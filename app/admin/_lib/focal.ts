/**
 * Точка кадра: куда смотреть, когда фотография не совпадает по пропорциям
 * с местом на странице.
 *
 * Значение уезжает в object-position, то есть считается в процентах от
 * изображения, а не в пикселях превью. Поэтому одна и та же точка одинаково
 * работает и в рамке админки, и в настоящей вёрстке на телефоне.
 */

export type Focal = { x: number; y: number };

export const CENTER: Focal = { x: 50, y: 50 };

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value));

/**
 * Округляем до десятых. Целые проценты на широком экране дают шаг около
 * двадцати пикселей — заметно; больше одного знака смысла нет, разница уже
 * меньше пикселя, зато media.json пухнет хвостами двоичных дробей.
 */
const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Точка по клику внутри рамки превью.
 *
 * offsetX/offsetY намеренно не используются: они считаются от того элемента,
 * над которым оказался курсор, а в превью поверх картинки может лежать метка
 * или подпись. Берём координаты от прямоугольника самой рамки.
 */
export const focalFromPoint = (
  box: { width: number; height: number },
  point: { x: number; y: number }
): Focal => {
  if (box.width <= 0 || box.height <= 0) return { ...CENTER };
  return {
    x: round1(clampPercent((point.x / box.width) * 100)),
    y: round1(clampPercent((point.y / box.height) * 100)),
  };
};

/** Значение для CSS object-position. */
export const objectPosition = (focal: Focal | undefined): string => {
  const value = focal ?? CENTER;
  return `${value.x}% ${value.y}%`;
};

export const sameFocal = (a: Focal | undefined, b: Focal | undefined): boolean =>
  (a?.x ?? CENTER.x) === (b?.x ?? CENTER.x) &&
  (a?.y ?? CENTER.y) === (b?.y ?? CENTER.y);

/**
 * Разбор того, что пришло из запроса или из media.json.
 *
 * Значение приходит из браузера и уезжает в файл репозитория, поэтому «почти
 * число» здесь не годится: NaN в object-position ломает вёрстку молча, и
 * заметит это уже клиент на опубликованном сайте.
 */
export const parseFocal = (raw: unknown): Focal | null => {
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      return parseFocal(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;

  const record = raw as { x?: unknown; y?: unknown };
  if (typeof record.x !== "number" || typeof record.y !== "number") return null;
  if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) return null;

  return { x: round1(clampPercent(record.x)), y: round1(clampPercent(record.y)) };
};
