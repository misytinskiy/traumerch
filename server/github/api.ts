import "server-only";

import {
  FetchDeadlineError,
  fetchWithDeadline,
} from "../http/fetchWithDeadline";
import type { GitHubConfig } from "./config";
import {
  GitHubConflictError,
  GitHubError,
  GitHubNotFoundError,
  scrubSecret,
} from "./errors";

/**
 * Тонкая обёртка над Git Data API GitHub.
 *
 * Здесь нет никакой логики черновика — только «сходить и вернуть»: ветка,
 * дерево, блоб, коммит. Логика лежит в repo.ts, а этот слой существует, чтобы
 * ошибки разбирались в одном месте и одинаково.
 *
 * Стороннего SDK нет намеренно: нам нужно семь эндпоинтов из Git Data, а
 * @octokit тянет за собой десятки килобайт в serverless-функцию ради того же
 * самого fetch.
 *
 * ПОЧЕМУ НЕ server/http/fetchWithDeadline: его сигнатура умеет только GET
 * (url + headers + timeout), а тут нужны POST, PATCH и DELETE с телом.
 * Расширять чужой модуль в рамках этой задачи нельзя, поэтому дедлайн
 * повторён здесь по той же схеме — таймер снимается только после того, как
 * тело прочитано целиком, иначе зависшее соединение висит без ограничения.
 * Когда server/http станет общим, отсюда останется только вызов.
 */

const API_BASE = "https://api.github.com";

/**
 * Обычный вызов: чтение ветки, дерева, перевод ссылки. Ответы маленькие,
 * двадцати секунд хватает с запасом даже на плохом канале.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Заливка блоба. Тело — base64, то есть на треть больше самого файла; при
 * 2560px webp это единицы мегабайт. Отдельный, более щедрый предел, чтобы
 * загрузка не отваливалась на медленном аплинке.
 */
export const BLOB_TIMEOUT_MS = 60_000;

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type CallOptions = {
  method?: Method;
  body?: unknown;
  timeoutMs?: number;
};

type CallResult = { status: number; data: unknown; text: string };

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** Пояснение из ответа GitHub: `{ "message": "..." }`. */
const messageOf = (data: unknown): string => {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
};

const call = async (
  config: GitHubConfig,
  path: string,
  { method = "GET", body, timeoutMs = REQUEST_TIMEOUT_MS }: CallOptions = {}
): Promise<CallResult> => {
  // Дедлайн и чтение тела внутри него — в server/http/fetchWithDeadline.ts.
  // Своя копия здесь была бы вторым экземпляром той самой логики, в которой
  // ошибка (таймер снимался до чтения тела) уже дважды проходила мимо ревью.
  try {
    const response = await fetchWithDeadline(`${API_BASE}${path}`, {
      timeoutMs,
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        // GitHub отвечает 403 на запрос без User-Agent.
        "User-Agent": "traumerch-admin",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = response.body.toString("utf8");

    return { status: response.status, data: text ? parseJson(text) : null, text };
  } catch (error) {
    const timedOut = error instanceof FetchDeadlineError && error.timedOut;
    throw new GitHubError(
      timedOut
        ? `GitHub не ответил за ${timeoutMs} мс на ${method} ${path}`
        : `Не удалось достучаться до GitHub на ${method} ${path}`,
      { cause: error }
    );
  }
};

/**
 * Разбор неуспешного ответа.
 *
 * Токен в текст не попадает никогда: в запросе он живёт только в заголовке
 * Authorization, а всё, что пришло от GitHub, дополнительно прогоняется через
 * scrubSecret — на случай, если ответ процитировал заголовок обратно.
 */
const fail = (
  config: GitHubConfig,
  method: Method,
  path: string,
  result: CallResult
): never => {
  const detail = scrubSecret(
    messageOf(result.data) || result.text.slice(0, 200),
    config.token
  );
  const where = `${method} ${path}`;

  if (result.status === 401 || result.status === 403) {
    throw new GitHubError(
      `GitHub не принял токен (${result.status}) на ${where}: ${detail}. ` +
        `Проверьте GITHUB_TOKEN и право «Contents: write» на ${config.owner}/${config.repo}.`,
      { status: result.status }
    );
  }

  if (result.status === 404) {
    throw new GitHubNotFoundError(`Не найдено: ${where}`, { status: 404 });
  }

  // 409 — конфликт ссылки. 422 «Update is not a fast forward» GitHub отдаёт
  // ровно в том же случае: пока мы собирали дерево, кто-то сдвинул ветку.
  // Обрабатываем оба, иначе половина реальных гонок пройдёт мимо повтора.
  const looksLikeRace = /fast[- ]forward|already exists/i.test(detail);
  if (result.status === 409 || (result.status === 422 && looksLikeRace)) {
    throw new GitHubConflictError(
      `Ветка сдвинулась во время записи (${result.status}) на ${where}: ${detail}`,
      { status: result.status }
    );
  }

  throw new GitHubError(`GitHub ответил ${result.status} на ${where}: ${detail}`, {
    status: result.status,
  });
};

const githubJson = async <T>(
  config: GitHubConfig,
  path: string,
  options: CallOptions = {}
): Promise<T> => {
  const method = options.method ?? "GET";
  const result = await call(config, path, options);
  if (result.status < 200 || result.status >= 300) {
    fail(config, method, path, result);
  }
  return result.data as T;
};

/** То же, но «нет» — это ответ, а не авария (черновика может не быть). */
const githubJsonOrNull = async <T>(
  config: GitHubConfig,
  path: string,
  options: CallOptions = {}
): Promise<T | null> => {
  try {
    return await githubJson<T>(config, path, options);
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return null;
    throw error;
  }
};

const repoPath = (config: GitHubConfig, suffix: string) =>
  `/repos/${config.owner}/${config.repo}${suffix}`;

/* ------------------------------------------------------------------ *
 * Git Data
 * ------------------------------------------------------------------ */

/** Права обычного файла в дереве git. Всё, что мы кладём, — обычные файлы. */
export const FILE_MODE = "100644";

export type GitTreeEntry = {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  /** null — удалить путь из дерева. */
  sha?: string | null;
  /** Текст файла вместо блоба: GitHub создаст блоб сам, экономим вызов. */
  content?: string;
};

export type GitTreeItem = {
  path: string;
  mode: string;
  type: string;
  sha: string;
};

/** Голова ветки или null, если ветки нет. */
export const getBranchHead = async (
  config: GitHubConfig,
  branch: string
): Promise<string | null> => {
  const data = await githubJsonOrNull<{ object?: { sha?: string } }>(
    config,
    repoPath(config, `/git/ref/heads/${branch}`)
  );
  return data?.object?.sha ?? null;
};

/** Голова ветки, которая обязана существовать. */
export const requireBranchHead = async (
  config: GitHubConfig,
  branch: string
): Promise<string> => {
  const sha = await getBranchHead(config, branch);
  if (!sha) {
    throw new GitHubError(
      `В ${config.owner}/${config.repo} нет ветки ${branch} — проверьте GITHUB_BRANCH`
    );
  }
  return sha;
};

/** Дерево коммита: на него опирается следующее дерево через base_tree. */
export const getCommitTreeSha = async (
  config: GitHubConfig,
  commitSha: string
): Promise<string> => {
  const data = await githubJson<{ tree?: { sha?: string } }>(
    config,
    repoPath(config, `/git/commits/${commitSha}`)
  );
  const sha = data?.tree?.sha;
  if (!sha) {
    throw new GitHubError(`Коммит ${commitSha} вернулся без дерева`);
  }
  return sha;
};

/**
 * Полный список файлов дерева.
 *
 * GitHub обрезает ответ на очень больших репозиториях и честно сообщает об
 * этом флагом truncated. Молча опубликовать половину медиа — худшее, что тут
 * можно сделать, поэтому на обрезанном ответе падаем.
 */
export const listTree = async (
  config: GitHubConfig,
  treeSha: string
): Promise<GitTreeItem[]> => {
  const data = await githubJson<{ tree?: GitTreeItem[]; truncated?: boolean }>(
    config,
    repoPath(config, `/git/trees/${treeSha}?recursive=1`)
  );
  if (data?.truncated) {
    throw new GitHubError(
      "GitHub обрезал дерево репозитория — обойти все файлы медиа одним запросом не вышло"
    );
  }
  return data?.tree ?? [];
};

export const createBlob = async (
  config: GitHubConfig,
  buffer: Buffer
): Promise<string> => {
  const data = await githubJson<{ sha?: string }>(
    config,
    repoPath(config, "/git/blobs"),
    {
      method: "POST",
      body: { content: buffer.toString("base64"), encoding: "base64" },
      timeoutMs: BLOB_TIMEOUT_MS,
    }
  );
  if (!data?.sha) throw new GitHubError("GitHub не вернул sha блоба");
  return data.sha;
};

export const createTree = async (
  config: GitHubConfig,
  { baseTree, entries }: { baseTree: string; entries: GitTreeEntry[] }
): Promise<string> => {
  const data = await githubJson<{ sha?: string }>(
    config,
    repoPath(config, "/git/trees"),
    {
      method: "POST",
      body: { base_tree: baseTree, tree: entries },
      timeoutMs: BLOB_TIMEOUT_MS,
    }
  );
  if (!data?.sha) throw new GitHubError("GitHub не вернул sha дерева");
  return data.sha;
};

export const createCommit = async (
  config: GitHubConfig,
  {
    message,
    tree,
    parents,
  }: { message: string; tree: string; parents: string[] }
): Promise<string> => {
  const data = await githubJson<{ sha?: string }>(
    config,
    repoPath(config, "/git/commits"),
    { method: "POST", body: { message, tree, parents } }
  );
  if (!data?.sha) throw new GitHubError("GitHub не вернул sha коммита");
  return data.sha;
};

/**
 * Перевод ветки на новый коммит.
 *
 * force намеренно не ставим: без него GitHub отказывается затирать чужой
 * коммит, и мы получаем конфликт вместо потерянной чужой работы.
 */
export const updateBranch = async (
  config: GitHubConfig,
  branch: string,
  sha: string
): Promise<void> => {
  await githubJson(config, repoPath(config, `/git/refs/heads/${branch}`), {
    method: "PATCH",
    body: { sha, force: false },
  });
};

export const createBranch = async (
  config: GitHubConfig,
  branch: string,
  sha: string
): Promise<void> => {
  await githubJson(config, repoPath(config, "/git/refs"), {
    method: "POST",
    body: { ref: `refs/heads/${branch}`, sha },
  });
};

/** true — ветку удалили, false — её уже не было. */
export const deleteBranch = async (
  config: GitHubConfig,
  branch: string
): Promise<boolean> => {
  try {
    await githubJson(config, repoPath(config, `/git/refs/heads/${branch}`), {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    if (error instanceof GitHubNotFoundError) return false;
    throw error;
  }
};

/* ------------------------------------------------------------------ *
 * Contents API
 *
 * Git Data умеет только деревья целиком, а нам регулярно нужно «прочитать
 * один файл» и «перечислить один каталог». Через Contents это один короткий
 * запрос вместо обхода всего дерева репозитория.
 * ------------------------------------------------------------------ */

type ContentsFile = {
  type?: string;
  encoding?: string;
  content?: string;
  sha?: string;
  path?: string;
};

/** Текст файла из ветки или null, если файла нет. */
export const readTextFile = async (
  config: GitHubConfig,
  branch: string,
  path: string
): Promise<string | null> => {
  const data = await githubJsonOrNull<ContentsFile>(
    config,
    repoPath(config, `/contents/${path}?ref=${encodeURIComponent(branch)}`)
  );
  if (!data) return null;

  // Файлы больше мегабайта Contents отдаёт без содержимого. Для media.json
  // (десятки килобайт) это недостижимо, но если однажды случится — пусть
  // будет внятная ошибка, а не пустой реестр, затирающий все слоты.
  if (data.encoding !== "base64" || typeof data.content !== "string") {
    throw new GitHubError(
      `GitHub отдал ${path} в непригодном виде (encoding=${data.encoding ?? "нет"})`
    );
  }
  return Buffer.from(data.content, "base64").toString("utf8");
};

export type DirEntry = { path: string; sha: string };

/** Файлы каталога в ветке. Нет каталога — пустой список. */
export const listDirectory = async (
  config: GitHubConfig,
  branch: string,
  dir: string
): Promise<DirEntry[]> => {
  const data = await githubJsonOrNull<ContentsFile[] | ContentsFile>(
    config,
    repoPath(config, `/contents/${dir}?ref=${encodeURIComponent(branch)}`)
  );
  if (!Array.isArray(data)) return [];

  return data
    .filter((item) => item.type === "file" && item.path && item.sha)
    .map((item) => ({ path: item.path as string, sha: item.sha as string }));
};
