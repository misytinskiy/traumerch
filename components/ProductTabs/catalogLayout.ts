import type { NormalizedProduct } from "../../shared/types";

export type CatalogCardSize = "regular" | "large";

export type DesktopRowPattern = {
  className: string;
  sizes: CatalogCardSize[];
};

export const DESKTOP_ROW_PATTERNS: DesktopRowPattern[] = [
  { className: "row1", sizes: ["regular", "regular", "regular", "regular"] },
  { className: "row2", sizes: ["regular", "regular", "large"] },
  { className: "row3", sizes: ["regular", "regular", "regular", "regular"] },
  { className: "row4", sizes: ["large", "regular", "regular"] },
];

export const DESKTOP_LAYOUT_PATTERN = DESKTOP_ROW_PATTERNS.flatMap(
  (rowPattern) => rowPattern.sizes
);

export type DesktopLayoutItem = {
  record: NormalizedProduct;
  size: CatalogCardSize;
};

const getExtendedLayoutPattern = (count: number) => {
  const sizes: CatalogCardSize[] = [];
  let rowPatternIndex = 0;

  while (sizes.length < count) {
    sizes.push(...DESKTOP_ROW_PATTERNS[rowPatternIndex].sizes);
    rowPatternIndex = (rowPatternIndex + 1) % DESKTOP_ROW_PATTERNS.length;
  }
  return sizes.slice(0, count);
};

export const getDesktopLayoutCapacity = (rowCount: number) => {
  let capacity = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    capacity +=
      DESKTOP_ROW_PATTERNS[rowIndex % DESKTOP_ROW_PATTERNS.length].sizes.length;
  }

  return capacity;
};

export const buildDesktopLayoutItems = (
  sourceRecords: NormalizedProduct[]
): DesktopLayoutItem[] => {
  if (!sourceRecords.length) {
    return [];
  }

  const sizes = getExtendedLayoutPattern(sourceRecords.length);
  const featuredSlotIndices = sizes.flatMap((size, index) =>
    size === "large" ? [index] : []
  );
  const selectedFeaturedRecords = sourceRecords
    .filter((record) => record.catalogFeatured)
    .slice(0, featuredSlotIndices.length);

  if (!selectedFeaturedRecords.length) {
    return sourceRecords.map((record, index) => ({
      record,
      size: sizes[index] ?? "regular",
    }));
  }

  const selectedFeaturedIds = new Set(
    selectedFeaturedRecords.map((record) => record.id)
  );
  const remainingRecords = sourceRecords.filter(
    (record) => !selectedFeaturedIds.has(record.id)
  );
  const featuredRecordsBySlot = new Map<number, NormalizedProduct>();

  featuredSlotIndices.forEach((slotIndex, index) => {
    const record = selectedFeaturedRecords[index];
    if (record) {
      featuredRecordsBySlot.set(slotIndex, record);
    }
  });

  const layoutItems: DesktopLayoutItem[] = [];
  let remainingRecordIndex = 0;

  for (let index = 0; index < sourceRecords.length; index += 1) {
    const featuredRecord = featuredRecordsBySlot.get(index);
    if (featuredRecord) {
      layoutItems.push({ record: featuredRecord, size: "large" });
      continue;
    }

    const record = remainingRecords[remainingRecordIndex];
    if (!record) {
      continue;
    }

    layoutItems.push({
      record,
      size: sizes[index] ?? "regular",
    });
    remainingRecordIndex += 1;
  }

  return layoutItems;
};
