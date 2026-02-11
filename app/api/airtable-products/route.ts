import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  buildAirtableListUrl,
  buildAirtableRecordUrl,
  fetchAirtable,
} from "../../../lib/airtable";
import { fetchNormalizedProducts } from "../../../lib/products";

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
  const view = searchParams.get("view") || catalogViewId || undefined;
  const maxRecords = toBoundedInt(searchParams.get("maxRecords"), 1, 100);
  const pageSize = toBoundedInt(searchParams.get("pageSize"), 1, 100);
  const filterByFormula = searchParams.get("filterByFormula") || undefined;
  const category = (searchParams.get("category") || "").toLowerCase().trim();

  const cacheSeconds = recordId ? 600 : 300;

  try {
    let data: unknown;

    if (format === "normalized" && !recordId) {
      data = await fetchNormalizedProducts({
        apiToken,
        priceTier,
        view,
        maxRecords,
        pageSize,
        category: category || undefined,
        filterByFormula,
        revalidateSeconds: cacheSeconds,
      });
    } else {
      const url = recordId
        ? buildAirtableRecordUrl(recordId, fields)
        : buildAirtableListUrl({
            fields,
            view,
            maxRecords,
            pageSize,
            filterByFormula,
          });
      const response = await fetchAirtable(url, apiToken, {
        revalidateSeconds: cacheSeconds,
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
          "Cache-Control": `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
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
      `s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
    );
    nextResponse.headers.set("ETag", etag);
    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Airtable data", details: `${error}` },
      { status: 500 }
    );
  }
}
