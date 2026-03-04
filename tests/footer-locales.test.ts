import { describe, it, expect, vi } from "vitest";
import en from "../locales/en.json";
import de from "../locales/de.json";
import { normalizeFooterColumns } from "../shared/footer";

const assertFooterColumns = (label: string, raw: unknown) => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const normalized = normalizeFooterColumns(raw);

  if (!Array.isArray(raw)) {
    throw new Error(`${label} footer columns are not an array`);
  }

  expect(normalized.length).toBe(raw.length);
  raw.forEach((column, index) => {
    const rawColumn = column as { links?: unknown[] };
    const normalizedLinks = normalized[index]?.links ?? [];
    expect(Array.isArray(rawColumn.links)).toBe(true);
    expect(normalizedLinks.length).toBe(rawColumn.links?.length ?? 0);
  });

  expect(warnSpy).not.toHaveBeenCalled();
  warnSpy.mockRestore();
};

describe("footer locale shapes", () => {
  it("validates en footer links", () => {
    assertFooterColumns("en", (en as typeof en).footer.columns);
  });

  it("validates de footer links", () => {
    assertFooterColumns("de", (de as typeof de).footer.columns);
  });
});
