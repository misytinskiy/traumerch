import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  buildAirtableListUrl,
  buildAirtableRecordUrl,
  fetchAirtable,
} from "../../../server/airtable/airtable";
import {
  CATALOG_FIELD_IDS,
  getCatalogFieldRequestName,
} from "../../../shared/catalogFields";
import {
  CATALOG_TTL_SECONDS,
  getCatalogSnapshot,
} from "../../../server/products/catalogSnapshot";

const apiToken = process.env.API_TOKEN;
const catalogViewId = process.env.AIRTABLE_CATALOG_VIEW_ID;

const parseFields = (raw: string | null) => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const ALLOWED_FIELDS = new Set([
  "[WEB] Name ENG",
  "[WEB] Name DE",
  "Name",
  "Filter: Item Category",
  "Item Category",
  "Main Product Photo",
  "[WEB] Palette Photos",
  "Secondary Product Photos",
  "[WEB] Catalog Starring",
  "Catalog Starring",
  "Starring",
  "[WEB] Product Special Field",
  "[WEB] Product Special Field Text EN",
  "[WEB] Product Special Field Text DE",
  "Out of Stock",
  "Out of stock",
  "1-24 pcs (Sample) | SALES",
  "24-49 pcs | SALES",
  "50-99 pcs | SALES",
  "100-249 | SALES",
  "250-499 | SALES",
  "250 - 499 | SALES",
  "500-999 pcs | SALES",
  "500 - 999 pcs | SALES",
  "1000+ pcs | SALES",
  "Price",
  "[WEB] Price",
  "# MOQ | SALES",
  "MOQ | SALES",
  "# MOQ",
  "MOQ",
  ...Object.values(CATALOG_FIELD_IDS),
]);

const sanitizeFields = (fields: string[]) =>
  fields
    .filter((field) => ALLOWED_FIELDS.has(field))
    .map((field) => getCatalogFieldRequestName(field));

const toBoundedInt = (value: string | null, min: number, max: number) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return undefined;
  return Math.min(Math.max(parsed, min), max);
};

const parsePriceTier = (value: string | null) =>
  value === "bulk" ? "bulk" : "sample";

export async function GET(request: NextRequest) {
  if (!apiToken) {
    return NextResponse.json(
      { error: "Missing Airtable configuration" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("recordId");
  const format = searchParams.get("format") || (recordId ? "raw" : "normalized");
  const priceTier = parsePriceTier(searchParams.get("priceTier"));
  const fields = parseFields(searchParams.get("fields"));
  const safeFields = sanitizeFields(fields);
  const view = searchParams.get("view") || catalogViewId || undefined;
  const maxRecords = toBoundedInt(searchParams.get("maxRecords"), 1, 100);
  const pageSize = toBoundedInt(searchParams.get("pageSize"), 1, 100);
  const filterByFormula = undefined;
  const category = (searchParams.get("category") || "").toLowerCase().trim();

  // stale-if-error на сутки — главная защита: если Airtable ответит 429 или
  // ляжет, CDN продолжит отдавать последний удачный ответ вместо пустого
  // каталога. Раньше здесь стоял no-store, и каждый посетитель ходил в Airtable.
  const cacheControl =
    format === "normalized"
      ? `public, s-maxage=${CATALOG_TTL_SECONDS}, stale-while-revalidate=1800, stale-if-error=86400`
      : recordId
        ? "public, s-maxage=600, stale-while-revalidate=1800, stale-if-error=86400"
        : "public, s-maxage=300, stale-while-revalidate=1800, stale-if-error=86400";

  try {
    let data: unknown;

    if (format === "normalized" && !recordId) {
      const snapshot = await getCatalogSnapshot({ priceTier, view });
      // Фильтры и лимиты применяем к снимку, а не отдельным запросом в Airtable:
      // так любая комбинация параметров обслуживается из одного кеша.
      let records = snapshot.records;
      if (category) {
        records = records.filter((record) =>
          record.categories.some((value) =>
            value.toLowerCase().includes(category)
          )
        );
      }
      if (typeof maxRecords === "number") {
        records = records.slice(0, maxRecords);
      }
      data = { records, offset: undefined };
    } else {
      const url = recordId
        ? buildAirtableRecordUrl(recordId, safeFields, {
            returnFieldsByFieldId: true,
          })
        : buildAirtableListUrl({
            fields: safeFields,
            view,
            maxRecords,
            pageSize,
            filterByFormula,
            returnFieldsByFieldId: true,
          });
      const response = await fetchAirtable(url, apiToken, {
      });
      if (!response.ok) {
        const message = await response.text();
        return NextResponse.json(
          { error: `Airtable request failed: ${message}` },
          { status: response.status }
        );
      }
      data = await response.json();
    }

    const payload = JSON.stringify(data);
    const etag = `"${crypto.createHash("sha1").update(payload).digest("hex")}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": cacheControl,
          "X-Cache-Policy": cacheControl,
        },
      });
    }

    const nextResponse = new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
    nextResponse.headers.set(
      "Cache-Control",
      cacheControl
    );
    nextResponse.headers.set("X-Cache-Policy", cacheControl);
    nextResponse.headers.set("ETag", etag);
    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Airtable data", details: `${error}` },
      { status: 500 }
    );
  }
}
