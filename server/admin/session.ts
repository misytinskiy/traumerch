/**
 * Сессионная кука админки: подпись и проверка.
 *
 * HMAC считается через Web Crypto (crypto.subtle), а не через node:crypto,
 * потому что проверять куку нужно в middleware.ts, а он выполняется на Edge,
 * где модулей Node нет вовсе. Web Crypto есть в обоих рантаймах, поэтому
 * реализация одна и разъехаться между сервером и Edge ей негде.
 *
 * В куке лежит только срок истечения и подпись — ни пароля, ни токенов.
 * Срок подписан вместе с остальным, поэтому продлить сессию, подкрутив
 * значение в браузере, нельзя: подпись перестанет сходиться.
 *
 * Секрет сюда передаётся аргументом, а не читается из process.env: модуль
 * должен одинаково работать и в роутах на Node, и в middleware на Edge, и в
 * тестах, где секрет подставляется свой.
 */

/** Имя куки. Префикс на случай, если на домене заведутся чужие куки. */
export const ADMIN_SESSION_COOKIE = "traumerch_admin";

/** Срок жизни сессии: неделя. Дальше клиент входит заново. */
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Версия формата в подписываемой строке. Если формат куки когда-нибудь
 * поменяется, старые куки перестанут проходить проверку сами собой, а не
 * будут молча трактоваться по новым правилам.
 */
const FORMAT_VERSION = "v1";

const encoder = new TextEncoder();

const importKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

const toHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sign = async (secret: string, payload: string): Promise<string> => {
  const key = await importKey(secret);
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${FORMAT_VERSION}.${payload}`)
  );
  return toHex(mac);
};

/**
 * Сравнение за постоянное время.
 *
 * Обычное === выходит на первом несовпавшем символе, и по времени ответа
 * подпись подбирается посимвольно. Здесь перебираются все символы всегда.
 * Ранний выход по длине ничего не выдаёт: длина подписи фиксированная
 * (64 шестнадцатеричных символа), она не зависит от секрета.
 */
const equalsInConstantTime = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

/** Значение куки: `<срок истечения в мс>.<подпись>`. */
export const createSessionValue = async (
  secret: string,
  {
    now = Date.now(),
    ttlSeconds = SESSION_TTL_SECONDS,
  }: { now?: number; ttlSeconds?: number } = {}
): Promise<string> => {
  const expiresAt = now + ttlSeconds * 1000;
  const signature = await sign(secret, String(expiresAt));
  return `${expiresAt}.${signature}`;
};

/**
 * Проверка куки. true — сессия действительна.
 *
 * Отвергает всё, что не сходится: чужую или поддельную подпись, просроченный
 * срок, мусор вместо значения и пустой секрет (иначе при незаданной
 * переменной окружения подпись считалась бы от пустой строки и любой, кто это
 * заметил, выписал бы себе куку сам).
 */
export const verifySessionValue = async (
  value: string | undefined | null,
  secret: string | undefined | null,
  { now = Date.now() }: { now?: number } = {}
): Promise<boolean> => {
  if (!value || !secret) return false;

  const separator = value.indexOf(".");
  if (separator <= 0) return false;

  const expiresRaw = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!/^\d+$/.test(expiresRaw) || !signature) return false;

  const expected = await sign(secret, expiresRaw);
  if (!equalsInConstantTime(signature, expected)) return false;

  // Срок проверяется после подписи: у неподписанного значения срок ничего не
  // значит, и порядок не даёт по коду ответа отличить подделку от протухшей.
  return Number(expiresRaw) > now;
};
