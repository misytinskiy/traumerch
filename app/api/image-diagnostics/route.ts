import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { logClientImageReport } from "../../../server/diagnostics/imageLog";
import { parseProductPhotoUrl } from "../../../shared/productPhoto";

export const runtime = "nodejs";

/**
 * Куда браузер сообщает о картинке, которая не отрисовалась.
 *
 * Серверный лог видит только запросы, которые до сервера дошли. Отказ
 * оптимизатора картинок, обрыв на середине ответа и потерянное соединение в
 * нём не видны — а посетитель видит именно их. Поэтому вторая половина
 * материала приходит отсюда.
 *
 * Адрес открыт наружу, поэтому тело считается недоверенным: размер ограничен,
 * поля проверяются по одному, длина режется, переводы строк вырезаются в
 * redact() (иначе в лог дорисовываются поддельные строки).
 */

/** Тело заведомо маленькое: всё, что больше, — не наш отчёт. */
const MAX_BODY_BYTES = 2048;

/**
 * Грубое ограничение на инстанс. От целенаправленного флуда не спасёт (инстансы
 * недолговечны и их много), но случайный цикл в браузере логи не утопит.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 120;
let windowStartedAt = 0;
let windowCount = 0;

const withinRateLimit = (): boolean => {
  const now = Date.now();
  if (now - windowStartedAt > RATE_WINDOW_MS) {
    windowStartedAt = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount <= RATE_LIMIT;
};

const asString = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.slice(0, maxLength) : "";

const asCount = (value: unknown, max: number): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(Math.max(Math.trunc(value), 0), max);
};

export async function POST(request: NextRequest) {
  const declaredLength = Number.parseInt(
    request.headers.get("content-length") ?? "",
    10
  );
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // Content-Length можно не прислать или соврать — проверяем и по факту.
  if (raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return new NextResponse(null, { status: 400 });
  }

  const body = parsed as Record<string, unknown>;

  const outcome = body.outcome === "recovered" ? "recovered" : "failed";
  const src = asString(body.src, 512);
  const currentSrc = asString(body.currentSrc, 512);

  if (!src && !currentSrc) {
    return new NextResponse(null, { status: 400 });
  }

  // Отчёт всегда про картинку с нашего же origin, поэтому идентификаторы
  // достаются прямо из адреса. Не достались — запись всё равно полезна,
  // просто без привязки к товару.
  const ids = parseProductPhotoUrl(currentSrc) ?? parseProductPhotoUrl(src);

  if (!withinRateLimit()) {
    // Отчёт молча теряется: отдавать 429 браузеру, который и так не смог
    // показать картинку, смысла нет.
    return new NextResponse(null, { status: 204 });
  }

  logClientImageReport(
    {
      outcome,
      src,
      currentSrc,
      page: asString(body.page, 120),
      attempts: asCount(body.attempts, 10) ?? 0,
      msToRetry: asCount(body.msToRetry, 600_000),
      connection: asString(body.connection, 20),
      visibility: asString(body.visibility, 20),
      naturalWidth: asCount(body.naturalWidth, 100_000),
    },
    {
      requestId: randomUUID().slice(0, 8),
      recordId: ids?.recordId,
      attachmentId: ids?.attachmentId,
    }
  );

  return new NextResponse(null, { status: 204 });
}
