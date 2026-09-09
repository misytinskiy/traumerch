
import { getCatalogFieldValue, type CatalogFieldKey } from "./catalogFields";

const PRICE_TIERS: { min: number; max: number; fields: CatalogFieldKey[] }[] = [
  { min: 1, max: 24, fields: ["sampleSales"] },
  { min: 25, max: 49, fields: ["sales24to49"] },
  { min: 50, max: 99, fields: ["sales50to99"] },
  { min: 100, max: 249, fields: ["sales100to249"] },
  {
    min: 250,
    max: 499,
    fields: ["sales250to499"],
  },
  {
    min: 500,
    max: 999,
    fields: ["sales500to999"],
  },
  { min: 1000, max: Infinity, fields: ["sales1000Plus"] },
];

function parsePriceValue(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const str = value.trim();
  const eurMatch = str.match(/€\s*([\d.,]+)/);
  if (eurMatch) return parseFloat(eurMatch[1].replace(",", "."));
  const numMatch = str.match(/([\d.,]+)/);
  if (numMatch) return parseFloat(numMatch[1].replace(",", "."));
  return null;
}

export function getUnitPriceForQuantity(
  quantity: number,
  fields: Record<string, unknown> | undefined
): string | null {
  if (!fields || quantity < 1) return null;
  const tier = PRICE_TIERS.find(
    (t) => quantity >= t.min && quantity <= t.max
  );
  if (!tier) return null;
  const rawValue = tier.fields
    .map((field) => getCatalogFieldValue(fields, field))
    .find((value) => value !== undefined && value !== null);
  if (rawValue === undefined) return null;
  const unitPrice = parsePriceValue(rawValue);
  if (unitPrice === null) return null;
  return `€${unitPrice.toFixed(unitPrice % 1 === 0 ? 0 : 1)}`;
}

export function getPriceForQuantity(
  quantity: number,
  fields: Record<string, unknown> | undefined
): string | null {
  if (!fields || quantity < 1) return null;
  const tier = PRICE_TIERS.find(
    (t) => quantity >= t.min && quantity <= t.max
  );
  if (!tier) return null;
  const rawValue = tier.fields
    .map((field) => getCatalogFieldValue(fields, field))
    .find((value) => value !== undefined && value !== null);
  if (rawValue === undefined) return null;
  const unitPrice = parsePriceValue(rawValue);
  if (unitPrice === null) return null;
  const total = unitPrice * quantity;
  return `€${total.toFixed(total % 1 === 0 ? 0 : 1)}`;
}

export function getMinQuantity(
  fields: Record<string, unknown> | undefined
): number {
  if (!fields) return 1;
  const raw = getCatalogFieldValue(fields, "moqSales");
  if (raw === undefined) return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n < 1 ? 1 : Math.min(n, 99999);
}
