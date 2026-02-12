import { buildAirtableListUrl, fetchAirtable } from "./airtable";

export type NormalizedProduct = {
  id: string;
  nameEn: string;
  nameDe: string;
  price: string;
  imageUrl: string | null;
  imageUrlSmall: string | null;
  imageUrlLarge: string | null;
  imageUrlFull: string | null;
  categories: string[];
};

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type PriceTier = "sample" | "bulk";

const NAME_FIELDS = ["[WEB] Name ENG", "[WEB] Name DE", "Name"];
const CATEGORY_FIELDS = ["Item Category"];
const IMAGE_FIELD = "Main Product Photo";
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

  const categories = CATEGORY_FIELDS.flatMap((field) =>
    extractStringValues(fields[field])
  );

  return {
    id: record.id,
    nameEn,
    nameDe,
    price,
    imageUrl,
    imageUrlSmall,
    imageUrlLarge,
    imageUrlFull,
    categories,
  };
};

export const buildNormalizedFields = (priceTier: PriceTier) => [
  ...NAME_FIELDS,
  ...PRICE_FIELDS_QUERY[priceTier],
  IMAGE_FIELD,
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
  revalidateSeconds?: number;
};

export const fetchNormalizedProducts = async ({
  apiToken,
  priceTier,
  view,
  maxRecords,
  pageSize,
  category,
  filterByFormula,
  revalidateSeconds = 300,
}: FetchNormalizedOptions) => {
  const fields = buildNormalizedFields(priceTier);
  const formula =
    filterByFormula || (category ? buildCategoryFormula(category) : undefined);
  const url = buildAirtableListUrl({
    fields,
    view,
    maxRecords,
    pageSize,
    filterByFormula: formula,
  });
  const response = await fetchAirtable(url, apiToken, {
    revalidateSeconds,
  });

  if (!response.ok) {
    const message = await response.text();
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
