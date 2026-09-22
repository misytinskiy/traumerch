import "server-only";

import { GitHubError } from "./errors";

/**
 * Куда коммитим.
 *
 * Репозиторий и ветки берутся из окружения, а не зашиты в код: на дев-стенде
 * дев-репа, в проде прод-репа. Один код, разная настройка — админку можно
 * проверять, не трогая прод.
 *
 * Читается ВНУТРИ функции, а не на верхнем уровне модуля. На верхнем уровне
 * значение зафиксировалось бы в момент импорта, а импорт в Next случается в
 * том числе на сборке, когда переменных окружения ещё нет: собранный модуль
 * навсегда запомнил бы пустой токен. Плюс так модуль можно импортировать в
 * тестах, не выставляя окружение заранее.
 */

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  /** Основная ветка: в неё уходит публикация, с ней сравнивается черновик. */
  branch: string;
  /** Ветка черновика. Исключена из сборок Vercel, поэтому не деплоится. */
  draftBranch: string;
};

export const DEFAULT_BRANCH = "main";
export const DEFAULT_DRAFT_BRANCH = "media/draft";

/**
 * Ветка попадает в путь запроса, поэтому проверяем её форму: пробел или `..`
 * в имени — это либо опечатка в настройке, либо попытка увести запрос в
 * соседний ресурс. Лучше внятно упасть на старте, чем получить 404 из
 * середины публикации.
 */
const BRANCH_PATTERN = /^[A-Za-z0-9._\-/]+$/;

const readBranch = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (!BRANCH_PATTERN.test(value) || value.includes("..")) {
    throw new GitHubError(`Недопустимое имя ветки в ${name}`);
  }
  return value;
};

export const readGitHubConfig = (): GitHubConfig => {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new GitHubError(
      "Не задан GITHUB_TOKEN — админка не может писать в репозиторий. " +
        "Нужен fine-grained токен с правом «Contents: write» на один репозиторий."
    );
  }

  const slug = process.env.GITHUB_REPO?.trim();
  if (!slug) {
    throw new GitHubError("Не задан GITHUB_REPO — ожидается значение вида owner/name");
  }

  const [owner, repo, ...rest] = slug.split("/");
  if (!owner || !repo || rest.length > 0) {
    throw new GitHubError(`GITHUB_REPO должен быть вида owner/name, получено «${slug}»`);
  }

  const branch = readBranch("GITHUB_BRANCH", DEFAULT_BRANCH);
  const draftBranch = readBranch("MEDIA_DRAFT_BRANCH", DEFAULT_DRAFT_BRANCH);

  if (branch === draftBranch) {
    throw new GitHubError(
      "GITHUB_BRANCH и MEDIA_DRAFT_BRANCH совпадают — черновик попадёт в деплой"
    );
  }

  return { token, owner, repo, branch, draftBranch };
};
