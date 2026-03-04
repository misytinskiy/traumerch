import type { FooterLink, FooterColumn } from "./types";

const isFooterLink = (value: unknown): value is FooterLink => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.label !== "string") return false;
  if (record.href !== undefined && typeof record.href !== "string") return false;
  if (
    record.external !== undefined &&
    typeof record.external !== "boolean"
  ) {
    return false;
  }
  return true;
};

export const normalizeFooterColumns = (raw: unknown): FooterColumn[] => {
  if (!Array.isArray(raw)) return [];

  return raw.reduce<FooterColumn[]>((acc, column, columnIndex) => {
    if (!column || typeof column !== "object") return acc;
    const record = column as Record<string, unknown>;
    if (typeof record.title !== "string" || !Array.isArray(record.links)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[Footer] Invalid column at index ${columnIndex}. Expected { title: string, links: FooterLink[] }.`
        );
      }
      return acc;
    }

    const links = record.links
      .filter((link) => isFooterLink(link))
      .map((link) => link as FooterLink);

    if (process.env.NODE_ENV !== "production" && links.length !== record.links.length) {
      console.warn(
        `[Footer] Some links were skipped due to invalid shape at column ${columnIndex}.`
      );
    }

    acc.push({ title: record.title, links });
    return acc;
  }, []);
};
