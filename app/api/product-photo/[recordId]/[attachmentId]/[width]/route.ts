import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { getCatalogSnapshot } from "../../../../../../server/products/catalogSnapshot";
import {
  buildAirtableRecordUrl,
  fetchAirtable,
} from "../../../../../../server/airtable/airtable";
import { isProductPhotoWidth } from "../../../../../../shared/productPhoto";

// sharp требует Node, на Edge не работает.
export const runtime = "nodejs";

const RECORD_ID = /^rec[A-Za-z0-9]{1,20}$/;
const ATTACHMENT_ID = /^att[A-Za-z0-9]{1,20}$/;

/** Ссылки Airtable живут ~2 часа, поэтому кешировать их незачем. */
const FETCH_TIMEOUT_MS = 10_000;

type Attachment = { id?: string; url?: string };

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
): Promise<string | null> => {
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
      return cached.imageUrlOriginal;
    }
    if (cached.hoverImageId === attachmentId && cached.hoverImageUrlOriginal) {
      return cached.hoverImageUrlOriginal;
    }
  }

  const apiToken = process.env.API_TOKEN;
  if (!apiToken) return null;

  const response = await fetchAirtable(
    buildAirtableRecordUrl(recordId),
    apiToken,
    { timeoutMs: FETCH_TIMEOUT_MS }
  );
  if (!response.ok) return null;

  const record = (await response.json()) as { fields?: Record<string, unknown> };
  for (const value of Object.values(record.fields ?? {})) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const attachment = item as Attachment;
      if (attachment?.id === attachmentId && typeof attachment.url === "string") {
        return attachment.url;
      }
    }
  }

  return null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ recordId: string; attachmentId: string; width: string }> }
) {
  const { recordId, attachmentId, width: rawWidth } = await params;

  const wantsOriginal = rawWidth === "original";
  const width = Number.parseInt(rawWidth, 10);
  if (
    !RECORD_ID.test(recordId) ||
    !ATTACHMENT_ID.test(attachmentId) ||
    (!wantsOriginal && (!Number.isFinite(width) || !isProductPhotoWidth(width)))
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const sourceUrl = await resolveAttachmentUrl(recordId, attachmentId);
    if (!sourceUrl) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Байты идут с CDN Airtable (v5.airtableusercontent.com), а не с api.airtable.com,
    // поэтому эта загрузка не расходует месячную квоту вызовов API.
    //
    // Таймаут держим до конца чтения тела, а не до заголовков. Сначала было
    // наоборот: clearTimeout стоял сразу после fetch, то есть многомегабайтное
    // тело читалось уже без всякого ограничения по времени и зависшее
    // соединение висело до тех пор, пока функцию не убьёт платформа.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let original: Buffer;
    let sourceContentType = "image/jpeg";
    try {
      const source = await fetch(sourceUrl, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!source.ok) {
        return NextResponse.json(
          { error: "Failed to fetch source image" },
          { status: 502 }
        );
      }

      sourceContentType = source.headers.get("content-type") || sourceContentType;
      original = Buffer.from(await source.arrayBuffer());
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      console.error(
        `[product-photo] ${aborted ? "таймаут" : "ошибка"} при загрузке исходника ` +
          `${recordId}/${attachmentId}`,
        error
      );
      // 504 только для настоящего таймаута. Обрыв соединения — это 502:
      // иначе в логах и мониторинге любая сетевая ошибка выглядит как
      // превышение времени, и искать будут не там.
      return NextResponse.json(
        { error: aborted ? "Source image timed out" : "Failed to fetch source image" },
        { status: aborted ? 504 : 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Оригинал отдаём как есть: варианты по размерам сделает next/image, и
    // лишнее перекодирование здесь только съело бы качество ещё раз.
    if (wantsOriginal) {
      return new NextResponse(new Uint8Array(original), {
        status: 200,
        headers: {
          "Content-Type": sourceContentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(original.byteLength),
        },
      });
    }

    const optimized = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    return new NextResponse(new Uint8Array(optimized), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // Адрес привязан к id вложения: заменят фото в Airtable — сменится id,
        // сменится адрес. Значит старый можно держать в кеше сколько угодно.
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(optimized.byteLength),
      },
    });
  } catch (error) {
    console.error(`[product-photo] ${recordId}/${attachmentId}/${width}`, error);
    return NextResponse.json({ error: "Image processing failed" }, { status: 500 });
  }
}
