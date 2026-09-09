import {
  getCatalogFieldString,
  getCatalogFieldValue,
} from "./catalogFields";

/** URL первого вложения "Main Product Photo" из полей Airtable. */
export function getMainPhotoUrl(
  fields: Record<string, unknown> | undefined
): string | null {
  const raw = getCatalogFieldValue(fields, "mainProductPhoto");
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const first = raw[0];
  if (
    first &&
    typeof first === "object" &&
    "url" in first &&
    typeof (first as { url: string }).url === "string"
  ) {
    return (first as { url: string }).url;
  }
  return null;
}

/** Локализованное имя товара из Airtable полей. */
export function getProductNameFromFields(
  fields: Record<string, unknown> | undefined,
  language: "en" | "de",
  fallbackName?: string
): string {
  if (!fields) return fallbackName ?? "Product";
  const nameEn = getCatalogFieldString(fields, "nameEn");
  const nameDe = getCatalogFieldString(fields, "nameDe");
  const resolved =
    language === "de"
      ? nameDe || nameEn
      : nameEn || nameDe;
  return resolved || fallbackName || "Product";
}
