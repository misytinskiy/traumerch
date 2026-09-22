/**
 * Загрузка с ограничением по времени, которое покрывает и чтение тела.
 *
 * Обычная связка «AbortController + clearTimeout в finally» ограничивает только
 * получение заголовков: как только fetch вернул Response, таймер снимается, а
 * тело читается уже без всякого предела. Для многомегабайтной картинки это
 * означает, что зависшее соединение висит до тех пор, пока процесс не убьют
 * снаружи. Ровно эта ошибка была и в /api/product-photo, и в fetchAirtable.
 *
 * Здесь таймер снимается только после того, как тело прочитано целиком.
 */

export class FetchDeadlineError extends Error {
  /** true — вышло время; false — сеть оборвалась или упала иначе. */
  readonly timedOut: boolean;

  constructor(message: string, timedOut: boolean, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "FetchDeadlineError";
    this.timedOut = timedOut;
  }
}

export type FetchWithDeadlineResult = {
  status: number;
  ok: boolean;
  headers: Headers;
  body: Buffer;
};

export const fetchWithDeadline = async (
  url: string,
  {
    timeoutMs,
    headers,
    cache = "no-store",
    method,
    body: requestBody,
  }: {
    timeoutMs: number;
    headers?: HeadersInit;
    cache?: RequestCache;
    /** По умолчанию GET. */
    method?: string;
    body?: BodyInit;
  }
): Promise<FetchWithDeadlineResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      body: requestBody,
      headers,
      cache,
      signal: controller.signal,
    });

    // 204 и 304 не имеют тела — читать нечего, и arrayBuffer() на них
    // в некоторых рантаймах ведёт себя неожиданно.
    const body =
      response.status === 204 || response.status === 304
        ? Buffer.alloc(0)
        : Buffer.from(await response.arrayBuffer());

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body,
    };
  } catch (error) {
    const timedOut =
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError");
    throw new FetchDeadlineError(
      timedOut ? `Источник не ответил за ${timeoutMs} мс` : "Не удалось загрузить источник",
      timedOut,
      { cause: error }
    );
  } finally {
    clearTimeout(timer);
  }
};
