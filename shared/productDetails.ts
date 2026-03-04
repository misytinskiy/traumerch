export const PALETTE_FIELD = "[WEB] Palette Hex Colours";
export const MAIN_PHOTO_FIELD = "Main Product Photo";
export const SECONDARY_PHOTOS_FIELD = "Secondary Product Photos";

const PALETTE_RAINBOW_TOKEN = "rainbow";
const MOQ_KEYS = ["# MOQ | SALES", "MOQ | SALES", "# MOQ", "MOQ"];

export function parsePaletteData(fields: Record<string, unknown> | undefined) {
  const raw = fields?.[PALETTE_FIELD];
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
  let raw: unknown;
  for (const key of MOQ_KEYS) {
    if (key in fields && fields[key] !== undefined && fields[key] !== null && fields[key] !== "") {
      raw = fields[key];
      break;
    }
  }
  if (raw === undefined) return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n < 1 ? 1 : Math.min(n, 99999);
}
