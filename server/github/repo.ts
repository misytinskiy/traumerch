import "server-only";

import { describeError } from "../diagnostics/redact";
import type { MediaEntry, OptimizedFile } from "../media/optimize";
import {
  FILE_MODE,
  createBlob,
  createBranch,
  createCommit,
  createTree,
  deleteBranch,
  getBranchHead,
  getCommitTreeSha,
  listDirectory,
  listTree,
  readTextFile,
  requireBranchHead,
  updateBranch,
  type GitTreeEntry,
} from "./api";
import { readGitHubConfig, type GitHubConfig } from "./config";
import { GitHubConflictError, GitHubError } from "./errors";

/**
 * Черновик замены фотографий в ветке репозитория.
 *
 * Почему черновик живёт в git, а не в браузере: клиент может собирать подборку
 * два дня, с другого компьютера и в другой вкладке. Хранилище в IndexedDB
 * исчезает от очистки данных браузера, а ветка переживает всё и не требует
 * нового хранилища — git уже умеет версии и откат.
 *
 * Публикация — ровно один коммит в основную ветку. Не потому что так красивее,
 * а потому что иначе замена двенадцати плиток Inspiration это двенадцать
 * сборок и двенадцать промежуточных состояний сайта. Плюс откат одной
 * командой: одна публикация — один коммит.
 */

/** Реестр того, что сейчас показывается. */
const MEDIA_JSON_PATH = "content/media.json";
/** Корень вариантов в репозитории: public/ + путь из OptimizedFile. */
const MEDIA_ROOT = "public/media";
/** Версия формата media.json — используется, только если файла ещё нет. */
const MEDIA_VERSION = 2;

/**
 * Сколько раз повторяем при гонке. Три — потому что повтор помогает от
 * случайного совпадения по времени, а не от постоянного потока чужих пушей:
 * если ветку дёргают непрерывно, бесконечный цикл только скроет проблему.
 */
export const MAX_REF_ATTEMPTS = 3;

export type MediaFile = {
  version: number;
  slots: Record<string, MediaEntry>;
};

export type DraftState = {
  /** false — ветки черновика нет, неопубликованных изменений тоже. */
  exists: boolean;
  branch: string;
  baseBranch: string;
  /** media.json из черновика; если черновика нет — из основной ветки. */
  media: MediaFile;
  /** Ключи слотов, отличающихся от основной ветки. */
  changedSlots: string[];
};

export type SaveToDraftInput = {
  slotKey: string;
  files: OptimizedFile[];
  entry: MediaEntry;
};

export type SaveToDraftResult = {
  branch: string;
  commitSha: string;
  /** Пути старых вариантов, удалённых тем же коммитом. */
  removed: string[];
  /** true — ветка черновика создана этим вызовом. */
  branchCreated: boolean;
};

export type DiscardSlotResult = {
  branch: string;
  /** null — этого слота в черновике и не было, коммита не понадобилось. */
  commitSha: string | null;
  changed: boolean;
};

export type PublishResult = {
  branch: string;
  /** null — публиковать было нечего. */
  commitSha: string | null;
  /** Слоты, попавшие в публикацию. */
  slots: string[];
  /** false — коммит прошёл, но ветку черновика удалить не удалось. */
  draftReset: boolean;
};

/* ------------------------------------------------------------------ *
 * Вспомогательное
 * ------------------------------------------------------------------ */

/**
 * Ключ слота уходит в путь запроса и в путь файла в репозитории, а приходит
 * из браузера. Разрешаем ровно тот алфавит, которым ключи записаны в
 * content/slots.ts: буквы, цифры, точка, дефис, подчёркивание.
 */
const SLOT_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

const assertSlotKey = (slotKey: string): void => {
  if (!SLOT_KEY_PATTERN.test(slotKey)) {
    throw new GitHubError(`Недопустимый ключ слота: ${slotKey}`);
  }
};

const slotDirPath = (slotKey: string) => `${MEDIA_ROOT}/${slotKey}`;

/**
 * Путь варианта в репозитории. OptimizedFile.path задан относительно public,
 * а в дереве git всё лежит от корня. Заодно проверяем, что файл действительно
 * относится к своему слоту: иначе достаточно подложить путь с `../`, чтобы
 * коммит из админки переписал произвольный файл репозитория.
 */
const repoFilePath = (slotKey: string, file: OptimizedFile): string => {
  const path = `public/${file.path}`;
  const expected = `${slotDirPath(slotKey)}/`;
  if (!path.startsWith(expected) || path.includes("..")) {
    throw new GitHubError(
      `Файл ${file.path} не принадлежит слоту ${slotKey} — в коммит не пойдёт`
    );
  }
  return path;
};

/**
 * Сравнение записей слота без оглядки на порядок ключей: один и тот же слот,
 * записанный конвейером и дописанный точкой кадра из админки, отличается
 * порядком полей, но не содержанием. Наивный JSON.stringify показал бы такой
 * слот как изменённый и потянул бы его в публикацию без причины.
 */
const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  const body = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",");
  return `{${body}}`;
};

const sameEntry = (a: MediaEntry | undefined, b: MediaEntry | undefined): boolean =>
  stableJson(a ?? null) === stableJson(b ?? null);

/** Слоты, которыми черновик отличается от основной ветки. */
const changedSlots = (base: MediaFile, draft: MediaFile): string[] => {
  const keys = new Set([...Object.keys(base.slots), ...Object.keys(draft.slots)]);
  return [...keys]
    .filter((key) => !sameEntry(base.slots[key], draft.slots[key]))
    .sort();
};

const emptyMediaFile = (): MediaFile => ({ version: MEDIA_VERSION, slots: {} });

const readMediaFile = async (
  config: GitHubConfig,
  branch: string
): Promise<MediaFile> => {
  const text = await readTextFile(config, branch, MEDIA_JSON_PATH);
  if (text === null) return emptyMediaFile();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new GitHubError(
      `${MEDIA_JSON_PATH} в ветке ${branch} не разбирается как JSON`,
      { cause: error }
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new GitHubError(`${MEDIA_JSON_PATH} в ветке ${branch} не похож на реестр`);
  }

  const record = parsed as { version?: unknown; slots?: unknown };
  const slots =
    record.slots && typeof record.slots === "object"
      ? (record.slots as Record<string, MediaEntry>)
      : {};

  return {
    version: typeof record.version === "number" ? record.version : MEDIA_VERSION,
    slots,
  };
};

/** Так же, как его пишет конвейер: два пробела и перевод строки в конце. */
const serializeMediaFile = (media: MediaFile): string =>
  `${JSON.stringify(media, null, 2)}\n`;

/** Русское склонение для сообщения коммита. */
const plural = (n: number, one: string, few: string, many: string): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

const publishMessage = (slots: string[]): string => {
  const head = `Фотографии: обновлено ${slots.length} ${plural(
    slots.length,
    "слот",
    "слота",
    "слотов"
  )}`;
  return slots.length > 0
    ? `${head}\n\n${slots.map((key) => `- ${key}`).join("\n")}\n`
    : `${head}\n`;
};

/**
 * Повтор при гонке.
 *
 * Между чтением головы и переводом ветки проходят секунды: за это время
 * разработчик может запушить свой коммит. Повторяем всю попытку целиком, а не
 * только перевод ссылки — дерево собирается поверх новой головы, иначе
 * повторный перевод затёр бы чужую работу.
 */
const withConflictRetry = async <T>(
  what: string,
  attempt: () => Promise<T>
): Promise<T> => {
  let last: GitHubConflictError | undefined;

  for (let n = 1; n <= MAX_REF_ATTEMPTS; n += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (!(error instanceof GitHubConflictError)) throw error;
      last = error;
      console.warn(
        `[github] ${what}: попытка ${n} из ${MAX_REF_ATTEMPTS} не прошла, перечитываем голову ветки`,
        describeError(error)
      );
    }
  }

  throw new GitHubError(
    `${what}: ветка менялась во время записи, ${MAX_REF_ATTEMPTS} ${plural(
      MAX_REF_ATTEMPTS,
      "попытка",
      "попытки",
      "попыток"
    )} подряд не прошли. Попробуйте ещё раз через минуту.`,
    { cause: last }
  );
};

/* ------------------------------------------------------------------ *
 * Операции
 * ------------------------------------------------------------------ */

/**
 * Что сейчас в черновике.
 *
 * Отсутствие ветки — не ошибка, а обычное состояние «клиент ничего не менял».
 * Падать здесь значило бы, что админка не открывается до первой правки.
 */
export const getDraftState = async (): Promise<DraftState> => {
  const config = readGitHubConfig();

  const draftHead = await getBranchHead(config, config.draftBranch);
  const baseMedia = await readMediaFile(config, config.branch);

  if (!draftHead) {
    return {
      exists: false,
      branch: config.draftBranch,
      baseBranch: config.branch,
      media: baseMedia,
      changedSlots: [],
    };
  }

  const draftMedia = await readMediaFile(config, config.draftBranch);

  return {
    exists: true,
    branch: config.draftBranch,
    baseBranch: config.branch,
    media: draftMedia,
    changedSlots: changedSlots(baseMedia, draftMedia),
  };
};

/**
 * Замена одного слота: один коммит в ветку черновика.
 *
 * Старые варианты слота удаляются тем же коммитом (в дереве это запись с
 * sha: null). Без этого public/media растёт на полтора мегабайта с каждой
 * заменой, а имена вариантов содержат хеш, поэтому сами по себе старые файлы
 * никогда не перезапишутся.
 */
export const saveToDraft = async ({
  slotKey,
  files,
  entry,
}: SaveToDraftInput): Promise<SaveToDraftResult> => {
  assertSlotKey(slotKey);
  if (files.length === 0) {
    throw new GitHubError(`Слот ${slotKey}: нечего сохранять, список файлов пуст`);
  }

  const config = readGitHubConfig();
  const fresh = files.map((file) => ({
    path: repoFilePath(slotKey, file),
    buffer: file.buffer,
  }));

  return withConflictRetry(`сохранение слота ${slotKey}`, async () => {
    const baseHead = await requireBranchHead(config, config.branch);
    const draftHead = await getBranchHead(config, config.draftBranch);

    // Черновика ещё нет — ответвляемся от текущей головы основной ветки.
    const parent = draftHead ?? baseHead;
    const source = draftHead ? config.draftBranch : config.branch;

    const media = await readMediaFile(config, source);
    const next: MediaFile = {
      ...media,
      slots: { ...media.slots, [slotKey]: entry },
    };

    // Что лежит в папке слота сейчас. Берём именно листинг каталога, а не
    // пути из media.json: в папке могут остаться файлы от прошлых заходов,
    // на которые реестр уже не ссылается, и убрать их больше некому.
    const existing = await listDirectory(config, source, slotDirPath(slotKey));
    const freshPaths = new Set(fresh.map((file) => file.path));
    const removed = existing
      .map((item) => item.path)
      .filter((path) => !freshPaths.has(path));

    const entries: GitTreeEntry[] = [];
    for (const file of fresh) {
      const sha = await createBlob(config, file.buffer);
      entries.push({ path: file.path, mode: FILE_MODE, type: "blob", sha });
    }
    entries.push({
      path: MEDIA_JSON_PATH,
      mode: FILE_MODE,
      type: "blob",
      content: serializeMediaFile(next),
    });
    for (const path of removed) {
      entries.push({ path, mode: FILE_MODE, type: "blob", sha: null });
    }

    const baseTree = await getCommitTreeSha(config, parent);
    const treeSha = await createTree(config, { baseTree, entries });
    const commitSha = await createCommit(config, {
      message: `Черновик: фотография слота ${slotKey}`,
      tree: treeSha,
      parents: [parent],
    });

    if (draftHead) {
      await updateBranch(config, config.draftBranch, commitSha);
    } else {
      await createBranch(config, config.draftBranch, commitSha);
    }

    return {
      branch: config.draftBranch,
      commitSha,
      removed,
      branchCreated: !draftHead,
    };
  });
};

/**
 * Вернуть один слот к состоянию основной ветки.
 *
 * Остальной черновик не трогаем: клиент отменяет одну неудачную фотографию,
 * а не всю работу за день.
 */
export const discardSlotFromDraft = async (
  slotKey: string
): Promise<DiscardSlotResult> => {
  assertSlotKey(slotKey);
  const config = readGitHubConfig();

  return withConflictRetry(`отмена слота ${slotKey}`, async () => {
    const draftHead = await getBranchHead(config, config.draftBranch);
    if (!draftHead) {
      return { branch: config.draftBranch, commitSha: null, changed: false };
    }

    const dir = slotDirPath(slotKey);
    const [baseMedia, draftMedia, baseFiles, draftFiles] = await Promise.all([
      readMediaFile(config, config.branch),
      readMediaFile(config, config.draftBranch),
      listDirectory(config, config.branch, dir),
      listDirectory(config, config.draftBranch, dir),
    ]);

    const baseByPath = new Map(baseFiles.map((item) => [item.path, item]));
    const draftByPath = new Map(draftFiles.map((item) => [item.path, item]));

    const entries: GitTreeEntry[] = [];
    // Возвращаем файлы основной ветки по их sha — блобы уже есть в
    // репозитории, заливать заново нечего.
    for (const [path, item] of baseByPath) {
      if (draftByPath.get(path)?.sha !== item.sha) {
        entries.push({ path, mode: FILE_MODE, type: "blob", sha: item.sha });
      }
    }
    // И убираем то, чего в основной ветке нет.
    for (const path of draftByPath.keys()) {
      if (!baseByPath.has(path)) {
        entries.push({ path, mode: FILE_MODE, type: "blob", sha: null });
      }
    }

    const baseEntry = baseMedia.slots[slotKey];
    if (!sameEntry(draftMedia.slots[slotKey], baseEntry)) {
      const slots = { ...draftMedia.slots };
      if (baseEntry) slots[slotKey] = baseEntry;
      else delete slots[slotKey];
      entries.push({
        path: MEDIA_JSON_PATH,
        mode: FILE_MODE,
        type: "blob",
        content: serializeMediaFile({ ...draftMedia, slots }),
      });
    }

    if (entries.length === 0) {
      return { branch: config.draftBranch, commitSha: null, changed: false };
    }

    const baseTree = await getCommitTreeSha(config, draftHead);
    const treeSha = await createTree(config, { baseTree, entries });
    const commitSha = await createCommit(config, {
      message: `Черновик: слот ${slotKey} возвращён к состоянию ветки ${config.branch}`,
      tree: treeSha,
      parents: [draftHead],
    });
    await updateBranch(config, config.draftBranch, commitSha);

    return { branch: config.draftBranch, commitSha, changed: true };
  });
};

/** Выбросить черновик целиком: ветки просто не станет. */
export const discardDraft = async (): Promise<{ deleted: boolean }> => {
  const config = readGitHubConfig();
  return { deleted: await deleteBranch(config, config.draftBranch) };
};

/** Пути, которые публикация имеет право трогать. */
const isMediaPath = (path: string): boolean =>
  path === MEDIA_JSON_PATH || path.startsWith(`${MEDIA_ROOT}/`);

const mediaBlobs = async (
  config: GitHubConfig,
  treeSha: string
): Promise<Map<string, { sha: string; mode: string }>> => {
  const items = await listTree(config, treeSha);
  const map = new Map<string, { sha: string; mode: string }>();
  for (const item of items) {
    if (item.type === "blob" && isMediaPath(item.path)) {
      map.set(item.path, { sha: item.sha, mode: item.mode });
    }
  }
  return map;
};

/**
 * Публикация: один коммит в основную ветку со всем накопленным.
 *
 * Дерево собирается поверх ТЕКУЩЕЙ головы основной ветки, а не поверх
 * черновика, и содержит только пути медиа. Поэтому параллельный пуш
 * разработчика не создаёт конфликта: его правки остаются в дереве, мы меняем
 * рядом с ними только фотографии.
 */
export const publishDraft = async (): Promise<PublishResult> => {
  const config = readGitHubConfig();

  const result = await withConflictRetry("публикация черновика", async () => {
    const draftHead = await getBranchHead(config, config.draftBranch);
    if (!draftHead) return { commitSha: null, slots: [] as string[] };

    const baseHead = await requireBranchHead(config, config.branch);

    const [baseMedia, draftMedia] = await Promise.all([
      readMediaFile(config, config.branch),
      readMediaFile(config, config.draftBranch),
    ]);
    const slots = changedSlots(baseMedia, draftMedia);

    const baseTree = await getCommitTreeSha(config, baseHead);
    const draftTree = await getCommitTreeSha(config, draftHead);
    const [baseFiles, draftFiles] = await Promise.all([
      mediaBlobs(config, baseTree),
      mediaBlobs(config, draftTree),
    ]);

    const entries: GitTreeEntry[] = [];
    for (const [path, file] of draftFiles) {
      if (baseFiles.get(path)?.sha !== file.sha) {
        entries.push({ path, mode: file.mode, type: "blob", sha: file.sha });
      }
    }
    // Старые варианты, которых в черновике уже нет, публикация тоже уносит —
    // иначе удаление доезжало бы до сайта только на следующей замене.
    for (const [path, file] of baseFiles) {
      if (!draftFiles.has(path)) {
        entries.push({ path, mode: file.mode, type: "blob", sha: null });
      }
    }

    if (entries.length === 0) return { commitSha: null, slots };

    const treeSha = await createTree(config, { baseTree, entries });
    const commitSha = await createCommit(config, {
      message: publishMessage(slots),
      tree: treeSha,
      parents: [baseHead],
    });
    await updateBranch(config, config.branch, commitSha);

    return { commitSha, slots };
  });

  // Черновик сбрасываем только после удачного коммита. Если удалить не
  // вышло — публикация всё равно состоялась, и говорить об обратном нельзя:
  // клиент нажмёт ещё раз и получит второй коммит с тем же содержимым.
  let draftReset = true;
  if (result.commitSha) {
    try {
      await deleteBranch(config, config.draftBranch);
    } catch (error) {
      draftReset = false;
      console.error(
        "[github] публикация прошла, но ветку черновика удалить не удалось",
        describeError(error)
      );
    }
  }

  return {
    branch: config.branch,
    commitSha: result.commitSha,
    slots: result.slots,
    draftReset,
  };
};

export { GitHubConflictError, GitHubError, GitHubNotFoundError } from "./errors";
