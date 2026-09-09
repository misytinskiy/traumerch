export const CATALOG_FIELD_IDS = {
  category: "fldUfiLQIyaPl8q9l",
  nameEn: "fldbIFRBwcbmiaeaD",
  nameDe: "fldAWb59hJvpL1QvS",
  catalogFeatured: "fld8rOJL1g5p0eyfe",
  descriptionEn: "fldl2DRA6A6ymQZUX",
  descriptionDe: "fldtJvmCzMZocu0Kt",
  customisationEn: "fldkoJvoL4UOGshxF",
  customisationDe: "fldDyBFX1FDu8rEXJ",
  productionEn: "fldhb7BiuqOdDAzRI",
  productionDe: "fldMGkJ0TZFu9VXCN",
  specificationsEn: "fldzQrQCCYvi58xn0",
  specificationsDe: "fldqX9n8r0i9nrXKm",
  paletteHexColours: "fldjoGaw92w2L7FPl",
  palettePhotos: "fldtar4CcUVWmI9Je",
  productSpecialField: "fld7FSikQsiDSC09e",
  productSpecialFieldTextDe: "fldevkb7Q3gkh3k0m",
  productSpecialFieldTextEn: "fldmFcdFRe8jdq8KE",
  filterItemCategory: "fldUfiLQIyaPl8q9l",
  mainProductPhoto: "fldWlZ9oRHcHdKc3a",
  secondaryProductPhotos: "fldzBPrsgjmMJihf0",
  outOfStock: "fldgAyzwS0sVj4A6v",
  sampleSales: "fldoogxylwkYg59yy",
  sales24to49: "fldg4rmBWhkjJT0QN",
  sales50to99: "fldEWFdY7jGDK0bjh",
  sales100to249: "fldt40xltt8ZqDEIu",
  sales250to499: "fldxsldJcQuyVR5p3",
  sales500to999: "fldve0iKfeDbuIscf",
  sales1000Plus: "fldEUQkamZmq1FOjP",
  moqSales: "fldTqmDGkdJTKmaYh",
  totalTimeDays: "fldBJeUFJS3yDwe3P",
} as const;

export const CATALOG_FIELD_ALIASES = {
  category: ["Filter: Item Category", "Item Category"],
  nameEn: ["[WEB] Name ENG", "Name"],
  nameDe: ["[WEB] Name DE", "Name"],
  mainProductPhoto: ["Main Product Photo"],
  secondaryProductPhotos: ["Secondary Product Photos"],
  outOfStock: ["Out of Stock", "Out of stock"],
  catalogFeatured: ["[WEB] Catalog Starring", "Catalog Starring", "Starring"],
  sampleSales: ["10-24 pcs | SALES", "1-24 pcs (Sample) | SALES", "Price", "[WEB] Price"],
  sales24to49: ["24-49 pcs | SALES"],
  sales50to99: ["50-99 pcs | SALES"],
  sales100to249: ["100-249 | SALES"],
  sales250to499: ["250 - 499 | SALES", "250-499 | SALES"],
  sales500to999: ["500 - 999 pcs | SALES", "500-999 pcs | SALES"],
  sales1000Plus: ["1000+ pcs | SALES", "Price", "[WEB] Price"],
  paletteHexColours: ["[WEB] Palette Hex Colours"],
  palettePhotos: ["[WEB] Palette Photos"],
  productSpecialField: ["[WEB] Product Special Field"],
  productSpecialFieldTextEn: ["[WEB] Product Special Field Text EN"],
  productSpecialFieldTextDe: ["[WEB] Product Special Field Text DE"],
  descriptionEn: ["[WEB] Description EN"],
  descriptionDe: ["[WEB] Description DE"],
  specificationsEn: ["[WEB] Specifications EN"],
  specificationsDe: ["[WEB] Specifications DE"],
  customisationEn: ["[WEB] Customisation EN"],
  customisationDe: ["[WEB] Customisation DE"],
  productionEn: ["[WEB] Production EN"],
  productionDe: ["[WEB] Production DE"],
  moqSales: ["MOQ | SALES", "# MOQ | SALES", "# MOQ", "MOQ"],
  totalTimeDays: ["Total Time (Days)"],
} as const;

export type CatalogFieldKey = keyof typeof CATALOG_FIELD_ALIASES;

export const getCatalogQueryFieldIds = (keys: readonly CatalogFieldKey[]) =>
  keys
    .map((key) => CATALOG_FIELD_IDS[key as keyof typeof CATALOG_FIELD_IDS])
    .filter(Boolean);

export const getCatalogQueryFieldNames = (keys: readonly CatalogFieldKey[]) =>
  keys
    .map((key) => CATALOG_FIELD_ALIASES[key][0])
    .filter(Boolean);

export const getCatalogFieldCandidates = (key: CatalogFieldKey) => {
  const candidates = [
    CATALOG_FIELD_IDS[key as keyof typeof CATALOG_FIELD_IDS],
    ...CATALOG_FIELD_ALIASES[key],
  ];
  return [...new Set(candidates.filter(Boolean))];
};

export const getCatalogFieldRequestName = (field: string) => {
  const entry = Object.entries(CATALOG_FIELD_IDS).find(([, fieldId]) => fieldId === field);
  if (!entry) return field;
  const [key] = entry as [CatalogFieldKey, string];
  return CATALOG_FIELD_ALIASES[key][0] || field;
};

export const getCatalogFieldValue = (
  fields: Record<string, unknown> | undefined,
  key: CatalogFieldKey
) => {
  if (!fields) return undefined;

  for (const candidate of getCatalogFieldCandidates(key)) {
    if (candidate in fields) {
      const value = fields[candidate];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return undefined;
};

export const getCatalogFieldString = (
  fields: Record<string, unknown> | undefined,
  key: CatalogFieldKey
) => {
  const value = getCatalogFieldValue(fields, key);
  return typeof value === "string" ? value : undefined;
};
