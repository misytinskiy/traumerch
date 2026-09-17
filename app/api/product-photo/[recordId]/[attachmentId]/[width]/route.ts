import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { getCatalogSnapshot } from "../../../../../../server/products/catalogSnapshot";
import {
  buildAirtableRecordUrl,
  fetchAirtable,
} from "../../../../../../server/airtable/airtable";
import { isProductPhotoWidth } from "../../../../../../shared/productPhoto";
import {
  FetchDeadlineError,
  fetchWithDeadline,
} from "../../../../../../server/http/fetchWithDeadline";
import { describeError, hostOf } from "../../../../../../server/diagnostics/redact";
import {
  logPhotoRequest,
  type PhotoOutcome,
  type PhotoStage,
} from "../../../../../../server/diagnostics/imageLog";

// sharp требует Node, на Edge не работает.
export const runtime = "nodejs";

const RECORD_ID = /^rec[A-Za-z0-9]{1,20}$/;
const ATTACHMENT_ID = /^att[A-Za-z0-9]{1,20}$/;

/** Ссылки Airtable живут ~2 часа, поэтому кешировать их незачем. */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Идентификатор запроса уезжает в заголовке ответа и в лог. По нему серверная
 * запись стыкуется с отчётом браузера, когда тот успел ответ получить.
 */
const REQUEST_ID_HEADER = "x-photo-request-id";

type Attachment = { id?: string; url?: string };

type Resolved = {
  url: string | null;
  /** true — адрес взят из снимка каталога, в Airtable не ходили. */
  fromSnapshot: boolean;
};

/**
 * Текущий адрес вложения в Airtable.
 *
 * Сначала ищем в снимке каталога — он уже закеширован, поэтому поиск стоит
 * ноль обращений к API. В Airtable лезем, только если товара в снимке нет:
 * например, он не входит в витрину каталога, но открыт напрямую по ссылке.
 */
const resolveAttachmentUrl = async (
  recordId: string,
  attachmentId: string
): Promise<Resolved> => {
  const { records } = await getCatalogSnapshot({
    priceTier: "bulk",
    view: process.env.AIRTABLE_CATALOG_VIEW_ID || undefined,
  });

  const cached = records.find((record) => record.id === recordId);
  if (cached) {
    // Берём оригинал вложения. imageUrl/hoverImageUrl — это thumbnails.large
    // от Airtable, всего 512px по длинной стороне: ресайз из них давал
    // замыленную картинку на любом месте крупнее превьюшки.
    if (cached.imageId === attachmentId && cached.imageUrlOriginal) {
      return { url: cached.imageUrlOriginal, fromSnapshot: true };
    }
    if (cached.hoverImageId === attachmentId && cached.hoverImageUrlOriginal) {
      return { url: cached.hoverImageUrlOriginal, fromSnapshot: true };
    }
  }

  const apiToken = process.env.API_TOKEN;
  if (!apiToken) return { url: null, fromSnapshot: false };

  const response = await fetchAirtable(
    buildAirtableRecordUrl(recordId),
    apiToken,
    { timeoutMs: FETCH_TIMEOUT_MS }
  );
  if (!response.ok) return { url: null, fromSnapshot: false };

  const record = (await response.json()) as { fields?: Record<string, unknown> };
  for (const value of Object.values(record.fields ?? {})) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const attachment = item as Attachment;
      if (attachment?.id === attachmentId && typeof attachment.url === "string") {
        return { url: attachment.url, fromSnapshot: false };
      }
    }
  }

  return { url: null, fromSnapshot: false };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recordId: string; attachmentId: string; width: string }> }
) {
  const { recordId, attachmentId, width: rawWidth } = await params;

  const requestId = randomUUID().slice(0, 8);
  const startedAt = Date.now();

  // Браузер помечает повторную попытку параметром r=1. В логе видно, что это
  // не первый заход, — иначе повтор выглядит как отдельный независимый сбой.
  // Читается из request.url, а не из nextUrl: обычного Request достаточно, и
  // роут остаётся вызываемым без обёрток Next.
  const retryParam = Number.parseInt(
    new URL(request.url).searchParams.get("r") ?? "",
    10
  );
  const retry = Number.isFinite(retryParam) ? retryParam : undefined;

  let stage: PhotoStage = "resolve";
  let resolveMs: number | undefined;
  let fetchMs: number | undefined;
  let encodeMs: number | undefined;
  let sourceStatus: number | undefined;
  let sourceHost: string | undefined;
  let fromSnapshot: boolean | undefined;

  const finish = (
    response: NextResponse,
    outcome: PhotoOutcome,
    extra?: { bytes?: number; error?: string }
  ) => {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    logPhotoRequest({
      requestId,
      recordId,
      attachmentId,
      width: rawWidth,
      stage,
      outcome,
      status: response.status,
      ms: Date.now() - startedAt,
      resolveMs,
      fetchMs,
      encodeMs,
      bytes: extra?.bytes,
      sourceStatus,
      sourceHost,
      fromSnapshot,
      retry,
      error: extra?.error,
    });
    return response;
  };

  const wantsOriginal = rawWidth === "original";
  const width = Number.parseInt(rawWidth, 10);
  if (
    !RECORD_ID.test(recordId) ||
    !ATTACHMENT_ID.test(attachmentId) ||
    (!wantsOriginal && (!Number.isFinite(width) || !isProductPhotoWidth(width)))
  ) {
    return finish(
      NextResponse.json({ error: "Bad request" }, { status: 400 }),
      "bad-request"
    );
  }

  try {
    const resolveStartedAt = Date.now();
    const resolved = await resolveAttachmentUrl(recordId, attachmentId);
    resolveMs = Date.now() - resolveStartedAt;
    fromSnapshot = resolved.fromSnapshot;

    if (!resolved.url) {
      return finish(
        NextResponse.json({ error: "Photo not found" }, { status: 404 }),
        "not-found"
      );
    }

    sourceHost = hostOf(resolved.url);

    // Байты идут с CDN Airtable (v5.airtableusercontent.com), а не с api.airtable.com,
    // поэтому эта загрузка не расходует месячную квоту вызовов API.
    //
    // fetchWithDeadline держит таймаут до конца чтения тела: иначе
    // многомегабайтная картинка читается уже без ограничения по времени.
    stage = "fetch";
    let original: Buffer;
    let sourceContentType = "image/jpeg";
    const fetchStartedAt = Date.now();
    try {
      const source = await fetchWithDeadline(resolved.url, {
        timeoutMs: FETCH_TIMEOUT_MS,
      });
      fetchMs = Date.now() - fetchStartedAt;
      sourceStatus = source.status;

      if (!source.ok) {
        return finish(
          NextResponse.json(
            { error: "Failed to fetch source image" },
            { status: 502 }
          ),
          "upstream-error"
        );
      }

      sourceContentType = source.headers.get("content-type") || sourceContentType;
      original = source.body;
    } catch (error) {
      fetchMs = Date.now() - fetchStartedAt;
      // 504 только для настоящего таймаута. Обрыв соединения — это 502:
      // иначе в логах любая сетевая ошибка выглядит как превышение времени,
      // и искать будут не там.
      const timedOut = error instanceof FetchDeadlineError && error.timedOut;
      return finish(
        NextResponse.json(
          { error: timedOut ? "Source image timed out" : "Failed to fetch source image" },
          { status: timedOut ? 504 : 502 }
        ),
        timedOut ? "timeout" : "upstream-error",
        { error: describeError(error) }
      );
    }

    // Оригинал отдаём как есть: варианты по размерам сделает next/image, и
    // лишнее перекодирование здесь только съело бы качество ещё раз.
    if (wantsOriginal) {
      stage = "done";
      return finish(
        new NextResponse(new Uint8Array(original), {
          status: 200,
          headers: {
            "Content-Type": sourceContentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Length": String(original.byteLength),
          },
        }) as NextResponse,
        "ok",
        { bytes: original.byteLength }
      );
    }

    stage = "encode";
    const encodeStartedAt = Date.now();
    const optimized = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();
    encodeMs = Date.now() - encodeStartedAt;

    stage = "done";
    return finish(
      new NextResponse(new Uint8Array(optimized), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          // Адрес привязан к id вложения: заменят фото в Airtable — сменится id,
          // сменится адрес. Значит старый можно держать в кеше сколько угодно.
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(optimized.byteLength),
        },
      }) as NextResponse,
      "ok",
      { bytes: optimized.byteLength }
    );
  } catch (error) {
    return finish(
      NextResponse.json({ error: "Image processing failed" }, { status: 500 }),
      "failed",
      { error: describeError(error) }
    );
  }
}
