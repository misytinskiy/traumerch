/**
 * Конвейер сжатия фотографий слотов.
 *
 * Один и тот же код работает в двух местах: в разовой миграции
 * (scripts/optimize-media.mjs) и в админке при загрузке нового файла. Если бы
 * правила качества и ширин были в двух копиях, они разъехались бы на первой же
 * правке, и загруженная через админку фотография перестала бы совпадать
 * с остальными на сайте.
 *
 * Здесь намеренно НЕТ `import "server-only"`. Модуль импортируется в том числе
 * из обычного node-скрипта, а `server-only` вне рантайма Next бросает
 * исключение. От попадания в браузер защищает sharp — он всё равно не
 * собирается под клиент.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";

import type { Slot } from "../../content/slots";

/** Больше этого не имеет смысла — даже на 2x ретине. */
export const MAX_WIDTH = 2560;
/** Меньше этого отдельный вариант не нужен. */
export const MIN_VARIANT = 240;

export const QUALITY = { photo: 88, logo: 92 } as const;

/**
 * Во сколько раз генерим больше CSS-пикселей. Десктопные экраны обычно 2x,
 * телефоны почти поголовно 3x — если считать мобильные блоки по 2x, на
 * телефоне картинка растягивается и выглядит мылом.
 */
export const DENSITY = { desktop: 2, mobile: 3 } as const;

/** Насколько плотно жмём: у логотипов артефакты заметнее, чем у фотографий. */
export const qualityFor = (slot: Pick<Slot, "kind">): number =>
  QUALITY[slot.kind === "logo" ? "logo" : "photo"];

/**
 * Сколько пикселей реально нужно этому месту на странице:
 * берём большую из десктопной и мобильной ширины, умножаем на плотность
 * и ограничиваем шириной исходника — апскейлить нечего.
 */
export const targetWidths = (
  slot: Pick<Slot, "shape" | "mobileShape">,
  sourceWidth: number
): number[] => {
  const layoutWidth = Math.max(
    slot.shape.w * DENSITY.desktop,
    (slot.mobileShape?.w ?? 0) * DENSITY.mobile
  );
  const needed = Math.min(sourceWidth, layoutWidth, MAX_WIDTH);
  const widths = [needed, Math.round(needed / 2), Math.round(needed / 4)].filter(
    (w) => w >= MIN_VARIANT
  );
  return [...new Set(widths)].sort((a, b) => a - b);
};

/** Точка кадра в процентах, попадает в object-position. */
export type Focal = { x: number; y: number };

/** Запись слота в media.json. */
export type MediaEntry = {
  src: string;
  w: number;
  h: number;
  focal?: Focal;
  variants: { w: number; src: string }[];
};

export type OptimizedFile = {
  /** Имя внутри папки слота, например "af4b5026-648.webp". */
  name: string;
  /** Путь от корня public, например "media/preloader.1/af4b5026-648.webp". */
  path: string;
  buffer: Buffer;
};

export type OptimizedSlot = {
  files: OptimizedFile[];
  /** Готовая запись для media.json — без focal, его добавляет вызывающий код. */
  entry: MediaEntry;
  /** Размеры исходника после EXIF-поворота, для отчётов и превью. */
  source: { width: number; height: number; bytes: number };
};

/** Каталог слота внутри public. */
export const slotDir = (slotKey: string) => `media/${slotKey}`;

/**
 * Сжимает исходник во все нужные ширины и собирает запись для media.json.
 *
 * Имя файла содержит хеш содержимого: при замене фотографии меняется имя,
 * поэтому раздачу можно кешировать навсегда и протухшего кеша не бывает.
 */
export const optimizeSlotImage = async (
  slot: Pick<Slot, "key" | "kind" | "shape" | "mobileShape">,
  source: Buffer
): Promise<OptimizedSlot> => {
  // .rotate() без аргументов применяет EXIF-ориентацию — иначе фото
  // с телефона легло бы набок после ресайза.
  const meta = await sharp(source).rotate().metadata();
  if (!meta.width || !meta.height) {
    throw new Error("не читаются размеры изображения");
  }

  const quality = qualityFor(slot);
  const widths = targetWidths(slot, meta.width);

  const rendered: { width: number; buffer: Buffer }[] = [];
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

  const dir = slotDir(slot.key);
  const files: OptimizedFile[] = [];
  const variants: { w: number; src: string }[] = [];

  for (const { width, buffer } of rendered) {
    const name = `${hash}-${width}.webp`;
    files.push({ name, path: `${dir}/${name}`, buffer });
    variants.push({ w: width, src: `/${dir}/${name}` });
  }

  return {
    files,
    entry: {
      src: variants[variants.length - 1].src,
      w: largestMeta.width as number,
      h: largestMeta.height as number,
      variants,
    },
    source: { width: meta.width, height: meta.height, bytes: source.length },
  };
};
