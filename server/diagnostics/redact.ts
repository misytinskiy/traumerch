import "server-only";

/**
 * Чистка строк перед записью в лог.
 *
 * Диагностика нужна, чтобы найти причину битых картинок, а не чтобы разложить
 * секреты по логам Vercel. Через эту функцию проходит всё, что пишется наружу:
 *
 *  - подписанные ссылки Airtable живут пару часов и до истечения дают доступ
 *    к файлу кому угодно;
 *  - сообщения ошибок Node регулярно тащат за собой полный URL запроса;
 *  - токены Airtable (pat..., key...) и заголовок Authorization.
 *
 * Отдельно вырезаются переводы строк. Без этого чужая строка из тела запроса
 * дорисовывает в лог поддельные строчки, и понять, что было на самом деле,
 * становится нельзя.
 */

const URL_PATTERN = /https?:\/\/[^\s"']+/gi;
const PAT_TOKEN = /\bpat[A-Za-z0-9._-]{10,}/g;
const KEY_TOKEN = /\bkey[A-Za-z0-9]{10,}/g;
const BEARER = /\bBearer\s+\S+/gi;
const SIGNED_PARAM = /\b(sig|signature|token|secret)=[^&\s]+/gi;

// Управляющие символы, включая перевод строки и возврат каретки.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]", "g");

/** Строка, безопасная для записи в одну строчку лога. */
export const redact = (value: unknown, maxLength = 300): string => {
  if (value === null || value === undefined) return "";

  let text = typeof value === "string" ? value : String(value);

  text = text.replace(URL_PATTERN, "<url>");
  text = text.replace(BEARER, "Bearer <token>");
  text = text.replace(PAT_TOKEN, "<token>");
  text = text.replace(KEY_TOKEN, "<token>");
  text = text.replace(SIGNED_PARAM, "$1=<redacted>");
  text = text.replace(CONTROL_CHARS, " ").trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}~` : text;
};

/**
 * Хост адреса без пути и подписи. В логе видно, откуда тянулись байты
 * (CDN Airtable или что-то другое), но не сама ссылка.
 */
export const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
};

/** Короткое описание ошибки: класс, сообщение и причина — всё почищенное. */
export const describeError = (error: unknown): string => {
  if (!(error instanceof Error)) return redact(error);

  const head = [error.name, error.message].filter(Boolean).join(": ");
  const cause = (error as { cause?: unknown }).cause;

  if (cause instanceof Error) {
    const code = (cause as { code?: string }).code;
    return redact(
      `${head} <- ${cause.name}: ${cause.message}${code ? ` (${code})` : ""}`
    );
  }

  return redact(head);
};
