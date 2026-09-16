/**
 * Генерирует content/media.json из реестра слотов.
 *
 * Фаза 1: каждый слот указывает на свой текущий файл в /public, без вариантов.
 * Рендер не меняется — меняется только путь, по которому компонент его берёт.
 *
 * Фаза 2 (scripts/optimize-media.mjs) перезапишет этот файл ссылками
 * на сжатые копии в /public/media с набором ширин.
 *
 * Запуск: node --experimental-strip-types scripts/build-media-json.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import { SLOTS } from "../content/slots.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const OUT = join(root, "content", "media.json");

/**
 * Слоты, где CSS-класс уже задаёт свой object-position. Для них фиксируем
 * focal в тех же значениях, иначе инлайн-стиль из админки сдвинет кадр
 * относительно того, что было. Остальные слоты идут без focal — тогда
 * MediaImage не пишет object-position вовсе и класс работает как раньше.
 */
const FOCAL_FROM_CSS = {
  // OurTeam.module.css: object-position: center bottom
  "team.ihor": { x: 50, y: 100 },
  "team.ivan": { x: 50, y: 100 },
  "team.yury": { x: 50, y: 100 },
  "team.mathias": { x: 50, y: 100 },
  "team.anna-valeriia": { x: 50, y: 100 },
  "team.lea": { x: 50, y: 100 },
};

const slots = {};
let failed = 0;

for (const slot of SLOTS) {
  const abs = join(root, "public", slot.legacy);
  try {
    const buffer = await readFile(abs);
    const { width, height } = await sharp(buffer).metadata();
    if (!width || !height) throw new Error("не удалось прочитать размеры");

    slots[slot.key] = {
      src: slot.legacy,
      w: width,
      h: height,
      ...(FOCAL_FROM_CSS[slot.key] ? { focal: FOCAL_FROM_CSS[slot.key] } : null),
    };
  } catch (error) {
    console.error(`  ОШИБКА  ${slot.key} (${slot.legacy}): ${error.message}`);
    failed++;
  }
}

const payload = { version: 1, slots };
await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`Записано слотов: ${Object.keys(slots).length} из ${SLOTS.length}`);
console.log(`Файл: content/media.json`);
if (failed) {
  console.error(`Не обработано: ${failed}`);
  process.exitCode = 1;
}
