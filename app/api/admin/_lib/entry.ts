/**
 * Сборка записи слота для media.json.
 *
 * Конвейер сжатия возвращает запись без точки кадра — он про пиксели и ничего
 * не знает про то, куда клиент ткнул в превью. Дописывает её этот модуль,
 * ровно перед коммитом.
 */
import type { Focal, MediaEntry } from "../../../../server/media/optimize";

/**
 * Точка кадра дописывается ТОЛЬКО если она задана.
 *
 * Это не мелочь. MediaImage выставляет инлайновый object-position лишь при
 * наличии focal, а без него значение остаётся за CSS-классом страницы — на
 * карточках команды класс задаёт свой кадр. Записав сюда focal «по умолчанию»
 * 50/50, мы бы молча перебили вёрстку на всех слотах, которые клиент просто
 * открыл посмотреть.
 *
 * Порядок полей повторяет тот, в котором media.json пишет разовая миграция:
 * файл читают глазами, и переставленные ключи дают шумный дифф на пустом месте.
 */
export const withFocal = (entry: MediaEntry, focal: Focal | null): MediaEntry => {
  const base: MediaEntry = { src: entry.src, w: entry.w, h: entry.h, variants: entry.variants };
  if (!focal) return base;
  return { src: entry.src, w: entry.w, h: entry.h, focal, variants: entry.variants };
};
