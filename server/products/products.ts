import "server-only";

import { buildAirtableListUrl, fetchAirtable } from "../airtable/airtable";
import {
  getCatalogFieldCandidates,
  getCatalogFieldValue,
  getCatalogQueryFieldIds,
  getCatalogQueryFieldNames,
  type CatalogFieldKey,
} from "../../shared/catalogFields";
import type { NormalizedProduct } from "../../shared/types";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type PriceTier = "sample" | "bulk";

const PRICE_FIELDS_BY_TIER: Record<PriceTier, CatalogFieldKey[]> = {
  sample: ["sampleSales"],
  bulk: ["sales1000Plus"],
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
    (getCatalogFieldValue(fields, "nameEn") as string | undefined) || "Product";
  const nameDe =
    (getCatalogFieldValue(fields, "nameDe") as string | undefined) || nameEn;

  const priceValue = PRICE_FIELDS_BY_TIER[priceTier]
    .map((field) => getCatalogFieldValue(fields, field))
    .find((value) => value !== undefined && value !== null);
  const price = formatPrice(priceValue);
  const outOfStockRaw = getCatalogFieldValue(fields, "outOfStock");
  const outOfStock = parseBooleanField(outOfStockRaw);
  const catalogFeatured = parseBooleanField(
    getCatalogFieldValue(fields, "catalogFeatured")
  );

  const mainPhoto = getCatalogFieldValue(fields, "mainProductPhoto");
  const mainPhotoArr = Array.isArray(mainPhoto) ? mainPhoto : [];
  const firstAttachment =
    mainPhotoArr[0] && typeof mainPhotoArr[0] === "object"
      ? (mainPhotoArr[0] as {
          id?: string;
          width?: number;
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

  const secondaryPhoto = getCatalogFieldValue(fields, "secondaryProductPhotos");
  const secondaryPhotoArr = Array.isArray(secondaryPhoto) ? secondaryPhoto : [];
  const hoverAttachment =
    secondaryPhotoArr[0] && typeof secondaryPhotoArr[0] === "object"
      ? (secondaryPhotoArr[0] as {
          id?: string;
          width?: number;
          url?: string;
          thumbnails?: {
            small?: { url?: string };
            large?: { url?: string };
            full?: { url?: string };
          };
        })
      : mainPhotoArr[1] && typeof mainPhotoArr[1] === "object"
        ? (mainPhotoArr[1] as {
            id?: string;
            width?: number;
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

  const imageId =
    typeof firstAttachment?.id === "string" ? firstAttachment.id : null;
  const hoverImageId =
    typeof hoverAttachment?.id === "string" ? hoverAttachment.id : null;

  // Оригинал, а не thumbnails.large: из превьюшки 512px ресайзить нечего.
  const imageUrlOriginal = imageUrlFull;
  const hoverImageUrlOriginal = hoverImageUrlFull;
  const imageWidth =
    typeof firstAttachment?.width === "number" ? firstAttachment.width : null;
  const hoverImageWidth =
    typeof hoverAttachment?.width === "number" ? hoverAttachment.width : null;

  const categories = extractStringValues(getCatalogFieldValue(fields, "category"));

  return {
    id: record.id,
    nameEn,
    nameDe,
    price,
    imageUrl,
    hoverImageUrl,
    imageId,
    hoverImageId,
    imageUrlOriginal,
    hoverImageUrlOriginal,
    imageWidth,
    hoverImageWidth,
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
  includeCatalogFeatured = true
) => [
  ...getCatalogQueryFieldIds(["nameEn", "nameDe"]),
  ...getCatalogQueryFieldIds(PRICE_FIELDS_BY_TIER[priceTier]),
  ...getCatalogQueryFieldIds(["mainProductPhoto", "secondaryProductPhotos"]),
  ...(includeCatalogFeatured ? getCatalogQueryFieldIds(["catalogFeatured"]) : []),
  ...(includeOutOfStock ? getCatalogQueryFieldIds(["outOfStock"]) : []),
  ...getCatalogQueryFieldIds(["category"]),
];

const fetchNormalizedPage = async ({
  apiToken,
  priceTier,
  view,
  maxRecords,
  pageSize,
  filterByFormula,
  includeOutOfStock,
  includeCatalogFeatured,
  offset,
}: FetchNormalizedOptions & {
  includeOutOfStock: boolean;
  includeCatalogFeatured: boolean;
  offset?: string;
}) => {
  const fields = buildNormalizedFields(priceTier, includeOutOfStock, includeCatalogFeatured);
  const url = buildAirtableListUrl({
    fields,
    view,
    maxRecords,
    pageSize,
    filterByFormula,
    offset,
    returnFieldsByFieldId: true,
  });
  return fetchAirtable(url, apiToken, {});
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
  let includeOutOfStock = true;
  let includeCatalogFeatured = true;
  const normalizedCategory = category?.trim().toLowerCase();

  let response = await fetchNormalizedPage({
    apiToken,
    priceTier,
    view,
    maxRecords,
    pageSize,
    filterByFormula,
    includeOutOfStock,
    includeCatalogFeatured,
  });

  while (!response.ok) {
    const message = await response.text();
    if (!message.includes("UNKNOWN_FIELD_NAME")) {
      throw new Error(message);
    }

    if (
      includeOutOfStock &&
      getCatalogFieldCandidates("outOfStock").some((field) => message.includes(field))
    ) {
      includeOutOfStock = false;
      response = await fetchNormalizedPage({
        apiToken,
        priceTier,
        view,
        maxRecords,
        pageSize,
        filterByFormula,
        includeOutOfStock,
        includeCatalogFeatured,
      });
      continue;
    }

    if (
      includeCatalogFeatured &&
      getCatalogFieldCandidates("catalogFeatured").some((field) =>
        message.includes(field)
      )
    ) {
      includeCatalogFeatured = false;
      response = await fetchNormalizedPage({
        apiToken,
        priceTier,
        view,
        maxRecords,
        pageSize,
        filterByFormula,
        includeOutOfStock,
        includeCatalogFeatured,
      });
      continue;
    }

    throw new Error(message);
  }

  const firstPage = (await response.json()) as {
    records?: AirtableRecord[];
    offset?: string;
  };

  const allRecords = [...(firstPage.records ?? [])];
  let nextOffset = firstPage.offset;
  const limit = typeof maxRecords === "number" ? maxRecords : Infinity;

  while (nextOffset && allRecords.length < limit) {
    const nextResponse = await fetchNormalizedPage({
      apiToken,
      priceTier,
      view,
      maxRecords,
      pageSize,
      filterByFormula,
      includeOutOfStock,
      includeCatalogFeatured,
      offset: nextOffset,
    });

    if (!nextResponse.ok) {
      throw new Error(await nextResponse.text());
    }

    const nextPage = (await nextResponse.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    allRecords.push(...(nextPage.records ?? []));
    nextOffset = nextPage.offset;
  }

  const normalizedRecords = allRecords.map((record) =>
    normalizeRecord(record, priceTier)
  );
  const filteredRecords = normalizedCategory
    ? normalizedRecords.filter((record) =>
        record.categories.some((value) =>
          value.toLowerCase().includes(normalizedCategory)
        )
      )
    : normalizedRecords;

  return {
    records: filteredRecords.slice(0, limit),
    offset: nextOffset,
  };
};
