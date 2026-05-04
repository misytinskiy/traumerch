import "server-only";

import { buildAirtableListUrl, fetchAirtable } from "../airtable/airtable";
import type { NormalizedProduct } from "../../shared/types";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type PriceTier = "sample" | "bulk";

const NAME_FIELDS = ["[WEB] Name ENG", "[WEB] Name DE", "Name"];
const CATEGORY_FIELDS = ["Item Category"];
const IMAGE_FIELD = "Main Product Photo";
const SECONDARY_IMAGE_FIELD = "Secondary Product Photos";
const OUT_OF_STOCK_FIELD = "Out of Stock";
const OUT_OF_STOCK_FIELD_FALLBACK = "Out of stock";
const CATALOG_FEATURED_FIELDS = [
  "[WEB] Catalog Starring",
  "Catalog Starring",
  "Starring",
];
const PRICE_FIELDS_BY_TIER: Record<PriceTier, string[]> = {
  sample: ["1-24 pcs (Sample) | SALES", "Price", "[WEB] Price"],
  bulk: ["1000+ pcs | SALES", "Price", "[WEB] Price"],
};

const PRICE_FIELDS_QUERY: Record<PriceTier, string[]> = {
  sample: ["1-24 pcs (Sample) | SALES"],
  bulk: ["1000+ pcs | SALES"],
};

const extractStringValues = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return typeof value === "string" ? [value] : [];
};

const formatPrice = (value: unknown): string => {
  if (typeof value === "number") {
    return `From €${value}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "From €6";
    return trimmed.startsWith("€") ? trimmed : `From €${trimmed}`;
  }
  return "From €6";
};

const pickFirstField = (
  fields: Record<string, unknown>,
  fieldNames: string[]
) => {
  for (const field of fieldNames) {
    if (field in fields && fields[field] !== undefined && fields[field] !== null) {
      return fields[field];
    }
  }
  return undefined;
};

const parseBooleanField = (value: unknown) =>
  value === true ||
  value === "true" ||
  value === "1" ||
  value === 1;

const normalizeRecord = (
  record: AirtableRecord,
  priceTier: PriceTier
): NormalizedProduct => {
  const fields = record.fields || {};
  const nameEn =
    (fields["[WEB] Name ENG"] as string | undefined) ||
    (fields["Name"] as string | undefined) ||
    "Product";
  const nameDe =
    (fields["[WEB] Name DE"] as string | undefined) ||
    (fields["Name"] as string | undefined) ||
    nameEn;

  const priceValue = pickFirstField(fields, PRICE_FIELDS_BY_TIER[priceTier]);
  const price = formatPrice(priceValue);
  const outOfStockRaw =
    fields[OUT_OF_STOCK_FIELD] ?? fields[OUT_OF_STOCK_FIELD_FALLBACK];
  const outOfStock = parseBooleanField(outOfStockRaw);
  const catalogFeatured = parseBooleanField(
    pickFirstField(fields, CATALOG_FEATURED_FIELDS)
  );

  const mainPhoto = fields[IMAGE_FIELD];
  const mainPhotoArr = Array.isArray(mainPhoto) ? mainPhoto : [];
  const firstAttachment =
    mainPhotoArr[0] && typeof mainPhotoArr[0] === "object"
      ? (mainPhotoArr[0] as {
          url?: string;
          thumbnails?: {
            small?: { url?: string };
            large?: { url?: string };
            full?: { url?: string };
          };
        })
      : null;
  const imageUrlFull =
    firstAttachment?.url && typeof firstAttachment.url === "string"
      ? firstAttachment.url
      : null;
  const imageUrlLarge =
    firstAttachment?.thumbnails?.large?.url &&
    typeof firstAttachment.thumbnails.large.url === "string"
      ? firstAttachment.thumbnails.large.url
      : null;
  const imageUrlSmall =
    firstAttachment?.thumbnails?.small?.url &&
    typeof firstAttachment.thumbnails.small.url === "string"
      ? firstAttachment.thumbnails.small.url
      : null;
  const imageUrl = imageUrlLarge || imageUrlSmall || imageUrlFull;

  const secondaryPhoto = fields[SECONDARY_IMAGE_FIELD];
  const secondaryPhotoArr = Array.isArray(secondaryPhoto) ? secondaryPhoto : [];
  const hoverAttachment =
    secondaryPhotoArr[0] && typeof secondaryPhotoArr[0] === "object"
      ? (secondaryPhotoArr[0] as {
          url?: string;
          thumbnails?: {
            small?: { url?: string };
            large?: { url?: string };
            full?: { url?: string };
          };
        })
      : mainPhotoArr[1] && typeof mainPhotoArr[1] === "object"
        ? (mainPhotoArr[1] as {
            url?: string;
            thumbnails?: {
              small?: { url?: string };
              large?: { url?: string };
              full?: { url?: string };
            };
          })
      : null;
  const hoverImageUrlFull =
    hoverAttachment?.url && typeof hoverAttachment.url === "string"
      ? hoverAttachment.url
      : null;
  const hoverImageUrlLarge =
    hoverAttachment?.thumbnails?.large?.url &&
    typeof hoverAttachment.thumbnails.large.url === "string"
      ? hoverAttachment.thumbnails.large.url
      : null;
  const hoverImageUrlSmall =
    hoverAttachment?.thumbnails?.small?.url &&
    typeof hoverAttachment.thumbnails.small.url === "string"
      ? hoverAttachment.thumbnails.small.url
      : null;
  const hoverImageUrl =
    hoverImageUrlLarge || hoverImageUrlSmall || hoverImageUrlFull;

  const categories = CATEGORY_FIELDS.flatMap((field) =>
    extractStringValues(fields[field])
  );

  return {
    id: record.id,
    nameEn,
    nameDe,
    price,
    imageUrl,
    hoverImageUrl,
    imageUrlSmall,
    imageUrlLarge,
    imageUrlFull,
    outOfStock,
    categories,
    catalogFeatured,
  };
};

export const buildNormalizedFields = (
  priceTier: PriceTier,
  includeOutOfStock = true,
  catalogFeaturedField?: string
) => [
  ...NAME_FIELDS,
  ...PRICE_FIELDS_QUERY[priceTier],
  IMAGE_FIELD,
  SECONDARY_IMAGE_FIELD,
  ...(catalogFeaturedField ? [catalogFeaturedField] : []),
  ...(includeOutOfStock ? [OUT_OF_STOCK_FIELD] : []),
  ...CATEGORY_FIELDS,
];

const buildCategoryFormula = (categoryTerm: string) => {
  const safe = categoryTerm.replace(/"/g, '\\"');
  return `FIND("${safe}", LOWER(ARRAYJOIN({Item Category})))`;
};

type FetchNormalizedOptions = {
  apiToken: string;
  priceTier: PriceTier;
  view?: string;
  maxRecords?: number;
  pageSize?: number;
  category?: string;
  filterByFormula?: string;
};

export const fetchNormalizedProducts = async ({
  apiToken,
  priceTier,
  view,
  maxRecords,
  pageSize,
  category,
  filterByFormula,
}: FetchNormalizedOptions) => {
  const formula =
    filterByFormula || (category ? buildCategoryFormula(category) : undefined);

  const runFetch = async (
    includeOutOfStock: boolean,
    catalogFeaturedField?: string
  ) => {
    const fields = buildNormalizedFields(
      priceTier,
      includeOutOfStock,
      catalogFeaturedField
    );
    const url = buildAirtableListUrl({
      fields,
      view,
      maxRecords,
      pageSize,
      filterByFormula: formula,
    });
    const response = await fetchAirtable(url, apiToken, {
    });
    return response;
  };

  let includeOutOfStock = true;
  let catalogFeaturedFieldIndex = 0;
  let response = await runFetch(
    includeOutOfStock,
    CATALOG_FEATURED_FIELDS[catalogFeaturedFieldIndex]
  );

  while (!response.ok) {
    const message = await response.text();
    if (!message.includes("UNKNOWN_FIELD_NAME")) {
      throw new Error(message);
    }

    if (includeOutOfStock && message.includes(OUT_OF_STOCK_FIELD)) {
      includeOutOfStock = false;
      response = await runFetch(
        includeOutOfStock,
        CATALOG_FEATURED_FIELDS[catalogFeaturedFieldIndex]
      );
      continue;
    }

    const activeCatalogFeaturedField =
      CATALOG_FEATURED_FIELDS[catalogFeaturedFieldIndex];
    if (
      activeCatalogFeaturedField &&
      message.includes(activeCatalogFeaturedField)
    ) {
      catalogFeaturedFieldIndex += 1;
      response = await runFetch(
        includeOutOfStock,
        CATALOG_FEATURED_FIELDS[catalogFeaturedFieldIndex]
      );
      continue;
    }

    throw new Error(message);
  }

  const data = (await response.json()) as {
    records?: AirtableRecord[];
    offset?: string;
  };

  return {
    records: (data.records ?? []).map((record) =>
      normalizeRecord(record, priceTier)
    ),
    offset: data.offset,
  };
};
