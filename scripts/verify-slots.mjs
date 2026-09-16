/**
 * Проверка реестра слотов: все ли исходные файлы на месте и нет ли слотов,
 * которые ссылаются в пустоту. Запуск: node --experimental-strip-types scripts/verify-slots.mjs
 */
import { SLOTS, SLOT_GROUPS } from "../content/slots.ts";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

let missing = 0;
const byGroup = new Map();
let bytes = 0;

for (const slot of SLOTS) {
  byGroup.set(slot.group, (byGroup.get(slot.group) ?? 0) + 1);
  const abs = join(root, "public", slot.legacy);
  if (!existsSync(abs)) {
    console.log(`  ОТСУТСТВУЕТ  ${slot.key.padEnd(26)} -> ${slot.legacy}`);
    missing++;
  }
}

console.log("=== СЛОТЫ ПО ГРУППАМ ===");
for (const group of SLOT_GROUPS) {
  console.log(`  ${String(byGroup.get(group) ?? 0).padStart(3)}  ${group}`);
}
console.log("  ---");
console.log(`  ${String(SLOTS.length).padStart(3)}  ВСЕГО`);

const uniqueSources = new Set(SLOTS.map((s) => s.legacy));
for (const rel of uniqueSources) {
  const abs = join(root, "public", rel);
  if (existsSync(abs)) bytes += statSync(abs).size;
}

console.log(`\nУникальных исходных файлов: ${uniqueSources.size}`);
console.log(`Их суммарный вес: ${(bytes / 1048576).toFixed(1)} МБ`);
console.log(`Недостающих файлов: ${missing}`);

if (missing > 0) process.exitCode = 1;
