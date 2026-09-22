import "server-only";

import { redact } from "../diagnostics/redact";

/**
 * Ошибки работы с репозиторием.
 *
 * Отдельные классы нужны не ради стройности: вызывающему коду приходится
 * отличать «голова ветки уехала, можно повторить» от «токен протух, повторять
 * бессмысленно». Без этого разделения админка либо молотит повторы там, где
 * они не помогут, либо показывает клиенту «попробуйте ещё раз» на ошибке
 * настройки.
 *
 * Сообщение всегда проходит через redact: в текст ошибки попадает ответ
 * GitHub, а оттуда — в лог Vercel. Тащить туда чужие ссылки и переводы строк
 * из постороннего JSON не надо: перевод строки дорисовывает в лог поддельные
 * строчки, и разобрать, что было на самом деле, уже нельзя.
 */
export class GitHubError extends Error {
  /** HTTP-статус, если ошибка пришла ответом, а не из сети. */
  readonly status?: number;

  constructor(
    message: string,
    options: { status?: number; cause?: unknown } = {}
  ) {
    super(redact(message, 500), { cause: options.cause });
    this.name = "GitHubError";
    this.status = options.status;
  }
}

/**
 * Голова ветки сдвинулась между чтением и записью — параллельный пуш
 * разработчика или второе открытое окно админки. Единственный случай, когда
 * повтор имеет смысл.
 */
export class GitHubConflictError extends GitHubError {
  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, options);
    this.name = "GitHubConflictError";
  }
}

/**
 * Ветки, файла или каталога нет. Для черновика это штатное состояние, а не
 * авария: пока клиент ничего не менял, ветки media/draft не существует.
 */
export class GitHubNotFoundError extends GitHubError {
  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, options);
    this.name = "GitHubNotFoundError";
  }
}

/**
 * Вырезает из текста сам токен.
 *
 * redact ловит известные форматы секретов (pat..., key..., Bearer ...), но
 * токены GitHub выглядят иначе — `ghp_...` и `github_pat_...` под эти шаблоны
 * не попадают. Здесь подход надёжнее любого шаблона: мы знаем точное значение
 * секрета и вырезаем именно его, чем бы он ни оказался.
 *
 * Короткие значения игнорируем — строка из трёх символов встретится в любом
 * тексте, и вычищать её значит превращать сообщение в кашу.
 */
export const scrubSecret = (text: string, secret: string | undefined): string =>
  secret && secret.length >= 8 ? text.split(secret).join("<token>") : text;
