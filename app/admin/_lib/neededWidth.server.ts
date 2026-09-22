/**
 * Сколько пикселей по ширине нужно слоту.
 *
 * СЕРВЕРНЫЙ модуль: тянет за собой server/media/optimize.ts, а с ним sharp.
 * Импортировать его из клиентского компонента нельзя — расчёт приезжает в
 * браузер готовым числом через пропсы страницы слота.
 *
 * Считаем через targetWidths, а не своей формулой. Вторая копия правила
 * разошлась бы с конвейером на первой же правке, и клиенту показывалось бы
 * «нужно 2400px» там, где конвейер на самом деле сделает 1920.
 */
import type { Slot } from "../../../content/slots";
import { MAX_WIDTH, targetWidths } from "../../../server/media/optimize";

export const neededWidth = (slot: Pick<Slot, "shape" | "mobileShape">): number => {
  // Подставляем исходник заведомо достаточной ширины: нас интересует
  // потребность места, а не то, чем её уже ограничил конкретный файл.
  const widths = targetWidths(slot, MAX_WIDTH);
  return widths.length ? widths[widths.length - 1] : 0;
};
