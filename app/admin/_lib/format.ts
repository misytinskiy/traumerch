/**
 * Мелкие преобразования для показа клиенту.
 *
 * Клиент не разработчик: «2359296 B» и «12 slots» ему ничего не говорят.
 * Всё, что уходит на экран, проходит отсюда.
 */

/** Вес файла человеческими словами. */
export const formatBytes = (bytes: number | undefined): string => {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} КБ`;
  const mb = kb / 1024;
  // До десяти мегабайт десятая доля различима на глаз, дальше это шум.
  return mb < 10 ? `${mb.toFixed(1).replace(".", ",")} МБ` : `${Math.round(mb)} МБ`;
};

export const formatSize = (w: number, h: number): string => `${w} × ${h}`;

/**
 * Русское склонение. Без него в интерфейсе появляется «1 слотов», и это
 * первое, за что цепляется глаз.
 */
export const plural = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  const mod100 = Math.abs(count) % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = mod100 % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

export const slotsWord = (count: number): string =>
  plural(count, "слот", "слота", "слотов");

export const changedLabel = (count: number): string =>
  count === 0
    ? "Неопубликованных изменений нет"
    : `${plural(count, "Изменён", "Изменено", "Изменено")} ${count} ${slotsWord(count)}`;
