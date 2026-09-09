import { getCatalogFieldValue } from "./catalogFields";

export const PALETTE_FIELD = "paletteHexColours";
export const PALETTE_PHOTOS_FIELD = "palettePhotos";
export const MAIN_PHOTO_FIELD = "mainProductPhoto";
export const SECONDARY_PHOTOS_FIELD = "secondaryProductPhotos";
export const PRODUCT_SPECIAL_FIELD = "productSpecialField";
export const PRODUCT_SPECIAL_FIELD_TEXT_EN = "productSpecialFieldTextEn";
export const PRODUCT_SPECIAL_FIELD_TEXT_DE = "productSpecialFieldTextDe";

const PALETTE_RAINBOW_TOKEN = "rainbow";

export function parsePaletteData(fields: Record<string, unknown> | undefined) {
  const raw = getCatalogFieldValue(fields, PALETTE_FIELD);
  if (typeof raw !== "string" || !raw.trim()) {
    return { colors: [], hasRainbow: false };
  }
  const tokens = raw.split(",").map((s) => s.trim());
  const colors = tokens.filter((s) =>
    /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(s)
  );
  const hasRainbow = tokens.some(
    (token) => token.toLowerCase() === PALETTE_RAINBOW_TOKEN
  );
  return { colors, hasRainbow };
}

export function getMinQuantity(fields: Record<string, unknown> | undefined): number {
  if (!fields) return 1;
  const raw = getCatalogFieldValue(fields, "moqSales");
  if (raw === undefined) return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n < 1 ? 1 : Math.min(n, 99999);
}
