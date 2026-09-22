import "server-only";

import { readGitHubConfig } from "../../../../server/github/config";
import { GitHubError } from "../../../../server/github/errors";
import { fetchWithDeadline } from "../../../../server/http/fetchWithDeadline";

/**
 * Чтение файла медиа из ветки репозитория.
 *
 * ПОЧЕМУ не через server/github/api.ts: там есть readTextFile, и он декодирует
 * содержимое в utf8. Для webp это необратимая порча байтов — картинка после
 * такого не откроется. Нужен именно двоичный ответ, поэтому запрос идёт с
 * Accept: raw, при котором GitHub отдаёт файл как есть, без обёртки в JSON и
 * base64 (заодно на треть меньше трафика).
 *
 * Роут поверх этого модуля существует ради одного свойства: черновик должен
 * быть виден после перезахода с другого устройства. Файлы черновика лежат
 * только в ветке, CDN о них ничего не знает.
 */

const API_BASE = "https://api.github.com";
const TIMEOUT_MS = 20_000;

/**
 * Разрешённая форма пути. Путь приходит из адресной строки, а уходит в запрос
 * к репозиторию: без этой проверки достаточно попросить
 * `../../.env` — и админка сама отдаст содержимое чужого файла.
 */
const MEDIA_PATH = /^media\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(webp|avif|png|jpg|jpeg)$/;

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  avif: "image/avif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export const isMediaPath = (path: string): boolean =>
  MEDIA_PATH.test(path) && !path.includes("..");

export const contentTypeOf = (path: string): string => {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
};

type Config = ReturnType<typeof readGitHubConfig>;

const fetchRaw = async (
  config: Config,
  branch: string,
  repoPath: string
): Promise<Buffer | null> => {
  const url =
    `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${repoPath}` +
    `?ref=${encodeURIComponent(branch)}`;

  const response = await fetchWithDeadline(url, {
    timeoutMs: TIMEOUT_MS,
    headers: {
      Accept: "application/vnd.github.raw",
      Authorization: `Bearer ${config.token}`,
      "User-Agent": "traumerch-admin",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new GitHubError(
      `Не удалось прочитать файл из ветки ${branch} (ответ ${response.status})`,
      { status: response.status }
    );
  }
  return response.body;
};

/**
 * Файл сначала ищется в черновике, потом в боевой ветке.
 *
 * Черновик содержит только изменённые слоты; всё остальное живёт в боевой
 * ветке. Без второго шага превью настоящей страницы показывало бы дырки на
 * месте слотов, которых клиент не трогал.
 */
export const readMediaFile = async (
  path: string
): Promise<{ body: Buffer; contentType: string } | null> => {
  if (!isMediaPath(path)) return null;

  const config = readGitHubConfig();
  const repoPath = `public/${path}`;

  const fromDraft = await fetchRaw(config, config.draftBranch, repoPath);
  const body = fromDraft ?? (await fetchRaw(config, config.branch, repoPath));
  if (!body) return null;

  return { body, contentType: contentTypeOf(path) };
};
