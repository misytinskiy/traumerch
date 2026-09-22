/**
 * Предупреждение о слишком мелкой фотографии.
 *
 * Решение владельца: предупреждать, но разрешать. Апскейла не делаем никогда —
 * растянутый исходник не добавляет деталей, зато весит больше и скрывает
 * проблему. Поэтому единственное, что здесь происходит, — честный расчёт
 * «сколько надо» против «сколько есть».
 *
 * Нужную ширину считает сервер (server/media/optimize.ts, targetWidths) и
 * передаёт готовым числом: второй копии этой формулы быть не должно, иначе
 * предупреждение разойдётся с тем, что конвейер реально сделает с файлом.
 */

export type ResolutionCheck = {
  neededWidth: number;
  sourceWidth: number;
  /** null — разрешения хватает, показывать нечего. */
  warning: string | null;
};

export const checkResolution = (
  neededWidth: number,
  sourceWidth: number
): ResolutionCheck => {
  if (sourceWidth >= neededWidth) {
    return { neededWidth, sourceWidth, warning: null };
  }
  return {
    neededWidth,
    sourceWidth,
    warning:
      `Этому месту нужна ширина ${neededWidth} пикселей, а у выбранной ` +
      `фотографии ${sourceWidth}. На экранах телефонов и ноутбуков с высокой ` +
      `плотностью точек она будет выглядеть нечётко. Опубликовать можно — ` +
      `но если есть файл покрупнее, лучше взять его.`,
  };
};
