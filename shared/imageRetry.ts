/**
 * Адреса для повторной попытки загрузить картинку.
 *
 * Просто присвоить тот же самый src обратно недостаточно: браузер помнит
 * неудачу и во многих случаях не идёт в сеть заново. Поэтому к адресу
 * добавляется параметр — он меняет ключ кеша, но не меняет ответ.
 *
 * Для next/image параметр дописывается во ВНУТРЕННИЙ адрес (`?url=...`), а не
 * к самому /_next/image. Так меняется ключ и у оптимизатора, и у нашего
 * /api/product-photo, то есть повтор действительно идёт до источника, а не
 * достаёт из кеша тот же сломанный ответ. Роуты query-параметры игнорируют.
 */

export const RETRY_PARAM = "r";

const isSameOrigin = (url: URL, origin: string): boolean => {
  try {
    return url.origin === new URL(origin).origin;
  } catch {
    return false;
  }
};

/**
 * Адрес той же картинки, который гарантированно уйдёт в сеть заново.
 * null — повторять не нужно или нельзя (чужой origin, data:, мусор).
 */
export const buildRetryUrl = (
  rawUrl: string,
  attempt: number,
  origin: string
): string | null => {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl, origin);
  } catch {
    return null;
  }

  // data:, blob: и всё прочее повторять бессмысленно.
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  // Чужие адреса не трогаем: чинить чужой CDN повторами не наше дело, а лишний
  // запрос туда мы устраивать не хотим.
  if (!isSameOrigin(url, origin)) return null;

  if (url.pathname === "/_next/image") {
    const inner = url.searchParams.get("url");
    // Внешний источник внутри оптимизатора — тот же случай «чужой адрес».
    if (!inner || !inner.startsWith("/")) return null;

    let innerUrl: URL;
    try {
      innerUrl = new URL(inner, origin);
    } catch {
      return null;
    }

    innerUrl.searchParams.set(RETRY_PARAM, String(attempt));
    url.searchParams.set("url", `${innerUrl.pathname}${innerUrl.search}`);
    return `${url.pathname}${url.search}`;
  }

  url.searchParams.set(RETRY_PARAM, String(attempt));
  return `${url.pathname}${url.search}`;
};

/**
 * То же самое для srcset. Менять один src мало: когда у <img> есть srcset,
 * браузер выбирает источник именно из него, и подменённый src останется
 * без дела.
 *
 * null — переписать не удалось; вызывающий код тогда убирает srcset совсем,
 * чтобы сработал заведомо корректный src.
 */
export const buildRetrySrcSet = (
  srcSet: string,
  attempt: number,
  origin: string
): string | null => {
  if (!srcSet.trim()) return null;

  const entries = srcSet
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) return null;

  const rewritten: string[] = [];

  for (const entry of entries) {
    const gap = entry.search(/\s/);
    const candidate = gap === -1 ? entry : entry.slice(0, gap);
    const descriptor = gap === -1 ? "" : entry.slice(gap).trim();

    const retried = buildRetryUrl(candidate, attempt, origin);
    if (!retried) return null;

    rewritten.push(descriptor ? `${retried} ${descriptor}` : retried);
  }

  return rewritten.join(", ");
};
