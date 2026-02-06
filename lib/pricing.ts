/** Ценовые тиры по количеству (поля Airtable). */
const PRICE_TIERS: { min: number; max: number; fields: string[] }[] = [
  { min: 1, max: 24, fields: ["1-24 pcs (Sample) | SALES"] },
  { min: 25, max: 49, fields: ["24-49 pcs | SALES"] },
  { min: 50, max: 99, fields: ["50-99 pcs | SALES"] },
  { min: 100, max: 249, fields: ["100-249 | SALES"] },
  {
    min: 250,
    max: 499,
    fields: ["250-499 | SALES", "250 - 499 | SALES"],
  },
  {
    min: 500,
    max: 999,
    fields: ["500-999 pcs | SALES", "500 - 999 pcs | SALES"],
  },
  { min: 1000, max: Infinity, fields: ["1000+ pcs | SALES"] },
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

/** Возвращает цену за единицу для данного количества (из тира) в формате "€12". */
export function getUnitPriceForQuantity(
  quantity: number,
  fields: Record<string, unknown> | undefined
): string | null {
  if (!fields || quantity < 1) return null;
  const tier = PRICE_TIERS.find(
    (t) => quantity >= t.min && quantity <= t.max
  );
  if (!tier) return null;
  const rawField = tier.fields.find((field) => field in fields);
  if (!rawField) return null;
  const unitPrice = parsePriceValue(fields[rawField]);
  if (unitPrice === null) return null;
  return `€${unitPrice.toFixed(unitPrice % 1 === 0 ? 0 : 1)}`;
}

/** Возвращает суммарную цену (unit × quantity) в формате "€120". */
export function getPriceForQuantity(
  quantity: number,
  fields: Record<string, unknown> | undefined
): string | null {
  if (!fields || quantity < 1) return null;
  const tier = PRICE_TIERS.find(
    (t) => quantity >= t.min && quantity <= t.max
  );
  if (!tier) return null;
  const rawField = tier.fields.find((field) => field in fields);
  if (!rawField) return null;
  const unitPrice = parsePriceValue(fields[rawField]);
  if (unitPrice === null) return null;
  const total = unitPrice * quantity;
  return `€${total.toFixed(total % 1 === 0 ? 0 : 1)}`;
}

const MOQ_KEYS = ["# MOQ | SALES", "MOQ | SALES", "# MOQ", "MOQ"];

/** Минимальный заказ из полей Airtable (MOQ), по умолчанию 1. */
export function getMinQuantity(
  fields: Record<string, unknown> | undefined
): number {
  if (!fields) return 1;
  let raw: unknown;
  for (const key of MOQ_KEYS) {
    const v = fields[key];
    if (v !== undefined && v !== null && v !== "") {
      raw = v;
      break;
    }
  }
  if (raw === undefined) return 1;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isNaN(n) || n < 1 ? 1 : Math.min(n, 99999);
}
