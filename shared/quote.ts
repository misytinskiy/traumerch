export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

export const getSwatchColor = (color: string) => {
  if (!color) return "#111";
  if (color.startsWith("#")) return color;
  const normalized = color.toLowerCase();
  if (normalized === "white") return "#f5f5f5";
  if (normalized === "black") return "#111";
  return normalized;
};
