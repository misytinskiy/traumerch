import "server-only";

import { redact } from "./redact";

/**
 * Единый формат записи о фотографии товара.
 *
 * Пишется одной строкой JSON: в логах Vercel по такой строке можно искать
 * полнотекстом (`"photo"` и `"outcome":"timeout"`), а при разборе — распарсить.
 *
 * Смысл полей — чтобы по жалобе «картинка не открылась» можно было
 * восстановить путь запроса целиком: какой товар, какое вложение, на каком
 * этапе сломалось, сколько это заняло и что ответил источник.
 */

export type PhotoStage = "resolve" | "fetch" | "encode" | "done";

export type PhotoOutcome =
  | "ok"
  | "bad-request"
  | "not-found"
  | "timeout"
  | "upstream-error"
  | "failed";

export type PhotoLogFields = {
  requestId: string;
  recordId: string;
  attachmentId: string;
  width: string;
  stage: PhotoStage;
  outcome: PhotoOutcome;
  status: number;
  /** Полное время обработки запроса. */
  ms: number;
  /** Поиск адреса вложения: снимок каталога или обращение к Airtable. */
  resolveMs?: number;
  /** Скачивание байтов с CDN. */
  fetchMs?: number;
  /** Пережатие через sharp. */
  encodeMs?: number;
  bytes?: number;
  /** Что ответил источник байтов. */
  sourceStatus?: number;
  /** Только хост источника — подписанная ссылка в лог не попадает. */
  sourceHost?: string;
  /** true — адрес нашёлся в снимке каталога, обращения к Airtable не было. */
  fromSnapshot?: boolean;
  /** Номер повторной попытки браузера, если он её пометил. */
  retry?: number;
  error?: string;
};

/**
 * Успешные запросы пишутся только когда они медленные. Каталог — это сотни
 * картинок на страницу: писать строку про каждую значит утопить в них тот
 * единственный сбой, ради которого всё и заводилось.
 */
const SLOW_MS = 3000;

export const logPhotoRequest = (fields: PhotoLogFields): void => {
  const failed = fields.outcome !== "ok";
  if (!failed && fields.ms < SLOW_MS) return;

  const line = JSON.stringify({
    tag: "photo",
    ...fields,
    error: fields.error ? redact(fields.error) : undefined,
  });

  if (failed) {
    console.error(line);
  } else {
    console.warn(line);
  }
};

/**
 * Отчёт браузера о картинке, которая не отрисовалась.
 *
 * Серверный лог видит только те запросы, которые до сервера дошли. Обрыв на
 * половине ответа, отказ оптимизатора картинок и просто потерянное соединение
 * в нём не видны вообще — поэтому вторая половина материала приходит с
 * клиента. Связываются они по recordId и attachmentId из адреса плюс время.
 */
export type ClientImageReport = {
  outcome: "recovered" | "failed";
  src: string;
  currentSrc: string;
  page: string;
  attempts: number;
  msToRetry?: number;
  connection?: string;
  visibility?: string;
  naturalWidth?: number;
};

export const logClientImageReport = (
  report: ClientImageReport,
  meta: { requestId: string; recordId?: string; attachmentId?: string }
): void => {
  const line = JSON.stringify({
    tag: "photo-client",
    ...meta,
    ...report,
    src: redact(report.src),
    currentSrc: redact(report.currentSrc),
    page: redact(report.page, 120),
  });

  // «recovered» — картинка догрузилась со второй попытки. Это не поломка
  // страницы, но ровно тот сигнал, который отличает случайный сбой от
  // постоянного, поэтому запись нужна.
  if (report.outcome === "failed") {
    console.error(line);
  } else {
    console.warn(line);
  }
};
