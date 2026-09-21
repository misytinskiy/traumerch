/**
 * Разовая миграция: берёт текущие файлы слотов из /public, сжимает их
 * и раскладывает в /public/media, после чего перезаписывает content/media.json
 * ссылками на сжатые копии.
 *
 * Сам конвейер живёт в server/media/optimize.ts — оттуда же его берёт админка.
 * Здесь остаётся только работа с файловой системой и отчёт: правила качества
 * и ширин должны существовать в одном экземпляре, иначе загруженная через
 * админку фотография перестанет совпадать с остальными на сайте.
 *
 * Запуск: node --experimental-strip-types scripts/optimize-media.mjs
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { SLOTS } from "../content/slots.ts";
import { optimizeSlotImage } from "../server/media/optimize.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PUBLIC = join(root, "public");
const MEDIA_DIR = join(PUBLIC, "media");
const MEDIA_JSON = join(root, "content", "media.json");

/** Сохраняем focal, если он уже был выставлен (например, у карточек команды). */
const previous = existsSync(MEDIA_JSON)
  ? JSON.parse(await readFile(MEDIA_JSON, "utf8")).slots
  : {};

/**
 * Исходники проверяем ДО того, как что-либо удалить.
 *
 * После миграции scripts/prune-legacy-media.mjs удаляет исходники из /public —
 * они больше не нужны, их заменили сжатые копии. Скрипт при этом остаётся
 * запускаемым, и без этой проверки он сначала сносит public/media, потом
 * обнаруживает, что сжимать нечего, и оставляет сайт вообще без картинок.
 * Проверено на себе.
 */
const missing = SLOTS.filter((slot) => !existsSync(join(PUBLIC, slot.legacy)));
if (missing.length) {
  console.error(
    `Нет исходников для ${missing.length} из ${SLOTS.length} слотов — ` +
      `похоже, миграция уже прошла и /public почищен прунером.`
  );
  console.error(`Например: ${missing.slice(0, 3).map((s) => s.legacy).join(", ")}`);
  console.error(
    `\nЭтот скрипт — разовая миграция, повторно он не запускается. ` +
      `Пересжать отдельный слот можно через админку, ` +
      `а сам конвейер лежит в server/media/optimize.ts.`
  );
  process.exit(1);
}

await rm(MEDIA_DIR, { recursive: true, force: true });
await mkdir(MEDIA_DIR, { recursive: true });

const slots = {};
let sourceBytes = 0;
let outputBytes = 0;
let failed = 0;
const rows = [];

for (const slot of SLOTS) {
  const sourcePath = join(PUBLIC, slot.legacy);
  try {
    const source = await readFile(sourcePath);
    sourceBytes += source.length;

    const { files, entry, source: meta } = await optimizeSlotImage(slot, source);

    await mkdir(join(MEDIA_DIR, slot.key), { recursive: true });
    let after = 0;
    for (const file of files) {
      await writeFile(join(PUBLIC, file.path), file.buffer);
      outputBytes += file.buffer.length;
      after += file.buffer.length;
    }

    slots[slot.key] = {
      ...entry,
      ...(previous[slot.key]?.focal ? { focal: previous[slot.key].focal } : null),
    };

    rows.push({
      key: slot.key,
      before: source.length,
      after,
      dims: `${meta.width}x${meta.height} -> ${entry.w}px`,
    });
  } catch (error) {
    console.error(`  ОШИБКА  ${slot.key} (${slot.legacy}): ${error.message}`);
    failed++;
  }
}

await writeFile(MEDIA_JSON, JSON.stringify({ version: 2, slots }, null, 2) + "\n", "utf8");

const mb = (n) => (n / 1048576).toFixed(1);
rows.sort((a, b) => b.before - a.before);

console.log("Самые тяжёлые исходники:");
for (const r of rows.slice(0, 10)) {
  console.log(
    `  ${mb(r.before).padStart(6)} МБ -> ${mb(r.after).padStart(5)} МБ  ` +
      `${String(Math.round(r.before / r.after) + "x").padStart(5)}  ${r.key}  (${r.dims})`
  );
}

console.log("");
console.log(`Слотов обработано: ${Object.keys(slots).length} из ${SLOTS.length}`);
console.log(`Исходники (с учётом дублей между слотами): ${mb(sourceBytes)} МБ`);
console.log(`Результат в public/media:                  ${mb(outputBytes)} МБ`);
console.log(`Итого легче в ${(sourceBytes / outputBytes).toFixed(0)} раз`);
if (failed) {
  console.error(`Не обработано: ${failed}`);
  process.exitCode = 1;
}
