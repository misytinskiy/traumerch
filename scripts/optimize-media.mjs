/**
 * Разовая миграция: берёт текущие файлы слотов из /public, сжимает их
 * и раскладывает в /public/media, после чего перезаписывает content/media.json
 * ссылками на сжатые копии.
 *
 * Тот же конвейер потом используется в админке при загрузке нового файла,
 * поэтому правила качества и ширин живут здесь, в одном месте.
 *
 * Имя файла содержит хеш содержимого: при замене фотографии меняется имя,
 * поэтому раздачу можно кешировать навсегда и протухшего кеша не бывает.
 *
 * Запуск: node --experimental-strip-types scripts/optimize-media.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import sharp from "sharp";

import { SLOTS } from "../content/slots.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PUBLIC = join(root, "public");
const MEDIA_DIR = join(PUBLIC, "media");
const MEDIA_JSON = join(root, "content", "media.json");

/** Больше этого не имеет смысла — даже на 2x ретине. */
const MAX_WIDTH = 2560;
/** Меньше этого отдельный вариант не нужен. */
const MIN_VARIANT = 240;

const QUALITY = { photo: 88, logo: 92 };

/**
 * Во сколько раз генерим больше CSS-пикселей. Десктопные экраны обычно 2x,
 * телефоны почти поголовно 3x — если считать мобильные блоки по 2x, на
 * телефоне картинка растягивается и выглядит мылом.
 */
const DENSITY = { desktop: 2, mobile: 3 };

/** Сохраняем focal, если он уже был выставлен (например, у карточек команды). */
const previous = existsSync(MEDIA_JSON)
  ? JSON.parse(await readFile(MEDIA_JSON, "utf8")).slots
  : {};

/**
 * Сколько пикселей реально нужно этому месту на странице:
 * берём большую из десктопной и мобильной ширины, умножаем на 2 под ретину
 * и ограничиваем шириной исходника — апскейлить нечего.
 */
const targetWidths = (slot, sourceWidth) => {
  const layoutWidth = Math.max(
    slot.shape.w * DENSITY.desktop,
    (slot.mobileShape?.w ?? 0) * DENSITY.mobile
  );
  const needed = Math.min(sourceWidth, layoutWidth, MAX_WIDTH);
  const widths = [needed, Math.round(needed / 2), Math.round(needed / 4)]
    .filter((w) => w >= MIN_VARIANT);
  return [...new Set(widths)].sort((a, b) => a - b);
};

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

    // .rotate() без аргументов применяет EXIF-ориентацию — иначе фото
    // с телефона легло бы набок после ресайза.
    const base = sharp(source).rotate();
    const meta = await base.metadata();
    if (!meta.width || !meta.height) throw new Error("не читаются размеры");

    const quality = QUALITY[slot.kind === "logo" ? "logo" : "photo"];
    const widths = targetWidths(slot, meta.width);

    const rendered = [];
    for (const width of widths) {
      const buffer = await sharp(source)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer();
      rendered.push({ width, buffer });
    }

    const largest = rendered[rendered.length - 1];
    const hash = createHash("sha1").update(largest.buffer).digest("hex").slice(0, 8);
    const largestMeta = await sharp(largest.buffer).metadata();

    const dir = join(MEDIA_DIR, slot.key);
    await mkdir(dir, { recursive: true });

    const variants = [];
    for (const { width, buffer } of rendered) {
      const name = `${hash}-${width}.webp`;
      await writeFile(join(dir, name), buffer);
      outputBytes += buffer.length;
      variants.push({ w: width, src: `/media/${slot.key}/${name}` });
    }

    slots[slot.key] = {
      src: variants[variants.length - 1].src,
      w: largestMeta.width,
      h: largestMeta.height,
      ...(previous[slot.key]?.focal ? { focal: previous[slot.key].focal } : null),
      variants,
    };

    rows.push({
      key: slot.key,
      before: source.length,
      after: rendered.reduce((sum, r) => sum + r.buffer.length, 0),
      dims: `${meta.width}x${meta.height} -> ${largestMeta.width}px`,
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
