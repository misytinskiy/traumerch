import { describe, expect, it } from "vitest";
import {
  buildDesktopLayoutItems,
  DESKTOP_LAYOUT_PATTERN,
} from "../components/ProductTabs/catalogLayout";
import type { NormalizedProduct } from "../shared/types";

const createRecord = (
  id: string,
  catalogFeatured = false
): NormalizedProduct => ({
  id,
  nameEn: `EN ${id}`,
  nameDe: `DE ${id}`,
  price: "From EUR 1",
  imageUrl: null,
  imageUrlSmall: null,
  imageUrlLarge: null,
  imageUrlFull: null,
  hoverImageUrl: null,
  outOfStock: false,
  categories: [],
  catalogFeatured,
});

describe("catalog layout", () => {
  it("keeps the existing large-slot pattern when nothing is featured", () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      createRecord(`rec-${index + 1}`)
    );

    const items = buildDesktopLayoutItems(records);

    expect(items).toHaveLength(12);
    expect(items[6]?.size).toBe("large");
    expect(items[11]?.size).toBe("large");
    expect(items[0]?.record.id).toBe("rec-1");
    expect(items[11]?.record.id).toBe("rec-12");
  });

  it("moves featured products into safe large slots only", () => {
    const records = [
      createRecord("rec-1"),
      createRecord("rec-2", true),
      createRecord("rec-3"),
      createRecord("rec-4", true),
      createRecord("rec-5"),
      createRecord("rec-6"),
      createRecord("rec-7"),
      createRecord("rec-8"),
      createRecord("rec-9"),
      createRecord("rec-10"),
      createRecord("rec-11"),
      createRecord("rec-12"),
    ];

    const items = buildDesktopLayoutItems(records);

    expect(items[6]).toMatchObject({ record: { id: "rec-2" }, size: "large" });
    expect(items[11]).toMatchObject({ record: { id: "rec-4" }, size: "large" });
    expect(items[0]?.record.id).toBe("rec-1");
    expect(items[1]?.record.id).toBe("rec-3");
    expect(items[2]?.record.id).toBe("rec-5");
  });

  it("caps featured products to the number of allowed large slots", () => {
    const largeSlotCount = DESKTOP_LAYOUT_PATTERN.filter(
      (size) => size === "large"
    ).length;
    const records = Array.from({ length: 24 }, (_, index) =>
      createRecord(`rec-${index + 1}`, index < largeSlotCount + 2)
    );

    const items = buildDesktopLayoutItems(records);
    const renderedLargeIds = items
      .filter((item) => item.size === "large")
      .map((item) => item.record.id);

    expect(renderedLargeIds).toEqual(["rec-1", "rec-2", "rec-3"]);
    expect(items).toHaveLength(records.length);
  });

  it("continues the same large-slot rhythm after the first 33 cards", () => {
    const records = Array.from({ length: 45 }, (_, index) =>
      createRecord(`rec-${index + 1}`, index < 5)
    );

    const items = buildDesktopLayoutItems(records);
    const renderedLargeItems = items
      .map((item, index) => ({ id: item.record.id, size: item.size, index }))
      .filter((item) => item.size === "large");

    expect(renderedLargeItems.slice(0, 6)).toEqual([
      { id: "rec-1", size: "large", index: 6 },
      { id: "rec-2", size: "large", index: 11 },
      { id: "rec-3", size: "large", index: 20 },
      { id: "rec-4", size: "large", index: 25 },
      { id: "rec-5", size: "large", index: 34 },
      { id: "rec-40", size: "large", index: 39 },
    ]);
  });
});
