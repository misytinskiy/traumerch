/**
 * Откуда брать картинку слота.
 *
 * Пути в media.json ведут в /media/... — это то, что раздаёт CDN, то есть
 * ОПУБЛИКОВАННАЯ версия. Файлы черновика лежат только в ветке репозитория, их
 * по такому адресу нет, и превью изменённого слота показало бы битую картинку.
 *
 * Поэтому у изменённых слотов адрес подменяется на роут админки, который
 * достаёт файл из ветки черновика. Это же даёт главное свойство: черновик
 * виден после перезахода с другого устройства, где в браузере ничего не
 * осталось.
 */

import type { SlotEntry } from "./types";

export const DRAFT_MEDIA_PREFIX = "/api/admin/draft-media";

/** Роут ждёт путь от корня public: /media/ключ/хеш-ширина.webp. */
export const draftMediaUrl = (src: string): string =>
  `${DRAFT_MEDIA_PREFIX}${src.startsWith("/") ? src : `/${src}`}`;

export const entrySrc = (entry: SlotEntry, fromDraft: boolean): string =>
  fromDraft ? draftMediaUrl(entry.src) : entry.src;

export const entrySrcSet = (
  entry: SlotEntry,
  fromDraft: boolean
): string | undefined => {
  if (!entry.variants?.length) return undefined;
  return entry.variants
    .map((variant) => `${entrySrc({ ...entry, src: variant.src }, fromDraft)} ${variant.w}w`)
    .join(", ");
};

/**
 * Самый мелкий вариант — для миниатюры в списке. Список показывает сто пять
 * фотографий сразу; если брать полноразмерные, страница тянет два десятка
 * мегабайт ради картинок размером со спичечный коробок.
 */
export const thumbSrc = (entry: SlotEntry, fromDraft: boolean): string => {
  const smallest = entry.variants?.length
    ? entry.variants.reduce((min, v) => (v.w < min.w ? v : min))
    : null;
  return entrySrc(smallest ? { ...entry, src: smallest.src } : entry, fromDraft);
};
