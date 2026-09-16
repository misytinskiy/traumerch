/**
 * Удаляет из /public исходники, которые после миграции больше не нужны:
 * файлы слотов (их сжатые копии лежат в /public/media) и файлы, на которые
 * вообще никто не ссылается.
 *
 * Перед удалением каждый файл проверяется по исходникам проекта. Если на него
 * есть хоть одна ссылка вне реестра слотов и media.json — файл остаётся,
 * и скрипт об этом сообщает.
 *
 * Сухой прогон (по умолчанию):  node --experimental-strip-types scripts/prune-legacy-media.mjs
 * Удалить:                      node --experimental-strip-types scripts/prune-legacy-media.mjs --apply
 */
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import { SLOTS } from "../content/slots.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PUBLIC = join(root, "public");
const APPLY = process.argv.includes("--apply");

/** Эти файлы не про контент — трогать нельзя. */
const KEEP = new Set([
  "/logo.svg",              // логотип сайта, используется в Footer и /conf
  "/thankYou.gif",          // постер для видео
  "/thankYou.webm",
]);
const KEEP_DIRS = ["/favicons/", "/quoteIcons/", "/media/"];

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs)));
    else out.push(abs);
  }
  return out;
};

/** Весь исходный код проекта одной строкой — по нему ищем ссылки. */
const collectSources = async (dir, acc = []) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    // tests/ не считаем: там пути встречаются как строки в ассертах,
    // это не живая ссылка на файл в public.
    if (["node_modules", ".next", ".git", "public", "tests"].includes(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) await collectSources(abs, acc);
    else if (/\.(ts|tsx|js|jsx|mjs|css|json)$/.test(entry.name)) acc.push(abs);
  }
  return acc;
};

const sourceFiles = await collectSources(root);
let haystack = "";
for (const file of sourceFiles) {
  const rel = relative(root, file).split(sep).join("/");
  // Реестр слотов и media.json описывают миграцию, а не живые ссылки.
  if (rel === "content/slots.ts" || rel === "content/media.json") continue;
  haystack += await readFile(file, "utf8");
}

const slotLegacy = new Set(SLOTS.map((s) => s.legacy));

const files = await walk(PUBLIC);
const toDelete = [];
const kept = [];
let freed = 0;

for (const abs of files) {
  const web = "/" + relative(PUBLIC, abs).split(sep).join("/");
  if (KEEP.has(web) || KEEP_DIRS.some((d) => web.startsWith(d))) continue;

  // Только точный путь. Проверка по одному имени файла даёт ложные
  // срабатывания: "1.png" встречается в десятке разных папок.
  if (haystack.includes(web)) {
    kept.push({ web, reason: "на него есть ссылка в коде" });
    continue;
  }

  const size = (await stat(abs)).size;
  toDelete.push({ abs, web, size, slot: slotLegacy.has(web) });
  freed += size;
}

toDelete.sort((a, b) => b.size - a.size);

const mb = (n) => (n / 1048576).toFixed(2);

console.log(`${APPLY ? "УДАЛЯЮ" : "СУХОЙ ПРОГОН — удалено было бы"}: ${toDelete.length} файлов, ${mb(freed)} МБ\n`);
for (const f of toDelete.slice(0, 15)) {
  console.log(`  ${mb(f.size).padStart(7)} МБ  ${f.web}${f.slot ? "" : "   (ни на что не ссылается)"}`);
}
if (toDelete.length > 15) console.log(`  … и ещё ${toDelete.length - 15}`);

if (kept.length) {
  console.log(`\nОставлено (нашлись ссылки): ${kept.length}`);
  for (const k of kept) console.log(`  ${k.web}  — ${k.reason}`);
}

if (APPLY) {
  for (const f of toDelete) await unlink(f.abs);
  console.log(`\nУдалено файлов: ${toDelete.length}, освобождено ${mb(freed)} МБ`);
} else {
  console.log(`\nНичего не тронуто. Для удаления: --apply`);
}
