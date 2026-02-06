const MAIN_PHOTO_FIELD = "Main Product Photo";

/** URL первого вложения "Main Product Photo" из полей Airtable. */
export function getMainPhotoUrl(
  fields: Record<string, unknown> | undefined
): string | null {
  const raw = fields?.[MAIN_PHOTO_FIELD];
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
