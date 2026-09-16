/**
 * Проверка целостности медиа: каждый слот из реестра описан в media.json,
 * каждый файл на месте, лишних записей нет.
 *
 * Запуск: node --experimental-strip-types scripts/verify-slots.mjs
 */
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { SLOTS, SLOT_GROUPS } from "../content/slots.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const media = JSON.parse(await readFile(join(root, "content", "media.json"), "utf8"));

const problems = [];
const byGroup = new Map();
let bytes = 0;
let variantCount = 0;

for (const slot of SLOTS) {
  byGroup.set(slot.group, (byGroup.get(slot.group) ?? 0) + 1);

  const entry = media.slots[slot.key];
  if (!entry) {
    problems.push(`нет записи в media.json: ${slot.key}`);
    continue;
  }

  const files = [entry.src, ...(entry.variants ?? []).map((v) => v.src)];
  for (const file of new Set(files)) {
    const abs = join(root, "public", file);
    if (!existsSync(abs)) {
      problems.push(`файл отсутствует: ${slot.key} -> ${file}`);
      continue;
    }
    bytes += statSync(abs).size;
    variantCount++;
  }

  if (!entry.variants?.some((v) => v.src === entry.src)) {
    problems.push(`src не входит в variants: ${slot.key}`);
  }
  if (entry.focal && (entry.focal.x < 0 || entry.focal.x > 100 || entry.focal.y < 0 || entry.focal.y > 100)) {
    problems.push(`focal вне диапазона 0–100: ${slot.key}`);
  }
}

const known = new Set(SLOTS.map((s) => s.key));
for (const key of Object.keys(media.slots)) {
  if (!known.has(key)) problems.push(`запись без слота в реестре: ${key}`);
}

console.log("=== СЛОТЫ ПО ГРУППАМ ===");
for (const group of SLOT_GROUPS) {
  console.log(`  ${String(byGroup.get(group) ?? 0).padStart(3)}  ${group}`);
}
console.log("  ---");
console.log(`  ${String(SLOTS.length).padStart(3)}  ВСЕГО`);

console.log(`\nФайлов в public/media: ${variantCount}`);
console.log(`Их суммарный вес:      ${(bytes / 1048576).toFixed(1)} МБ`);
console.log(`Проблем:               ${problems.length}`);

for (const problem of problems) console.log(`  ! ${problem}`);
if (problems.length) process.exitCode = 1;
