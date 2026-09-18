/**
 * Адреса фотографий товаров.
 *
 * Airtable отдаёт ссылки на вложения, которые протухают примерно за два часа.
 * Из-за этого браузер периодически получал битые картинки (отсюда onError в
 * каталоге), а оптимизатор Vercel считал каждую ротацию новым исходником и
 * жёг квоту по кругу.
 *
 * Идентификатор вложения, наоборот, стабилен и меняется только когда в Airtable
 * заменили само фото. Поэтому адрес вида /api/product-photo/<rec>/<att>/<w>
 * можно кешировать неограниченно: новое фото — новый id — новый адрес.
 */

/** Ширины, которые готов отдавать прокси. Список закрытый, чтобы произвольные
 *  значения в URL не плодили бесконечные варианты в кеше. */
export const PRODUCT_PHOTO_WIDTHS = [320, 640, 960, 1280, 1920] as const;

export type ProductPhotoWidth = (typeof PRODUCT_PHOTO_WIDTHS)[number];

export const isProductPhotoWidth = (value: number): value is ProductPhotoWidth =>
  (PRODUCT_PHOTO_WIDTHS as readonly number[]).includes(value);

export const productPhotoUrl = (
  recordId: string,
  attachmentId: string,
  width: ProductPhotoWidth
) => `/api/product-photo/${recordId}/${attachmentId}/${width}`;

/**
 * Мастер-копия вложения по вечному адресу.
 *
 * Именно это отдаётся в next/image как источник. Ресайзить самим оказалось
 * плохой идеей: при небольшом трафике кеш на 414 фото в пяти ширинах почти
 * никогда не прогревался, и посетитель ждал 500-1500 мс на каждую картинку.
 * Оптимизатор Vercel делает то же самое, но кешируется глобально и надолго,
 * а от протухающих ссылок Airtable нас защищает стабильность этого адреса:
 * он привязан к id вложения, а не к временной ссылке.
 *
 * Отдаётся не нетронутый оригинал, а WebP. В Airtable лежат PNG 2048x2048 по
 * 1.4 МБ в среднем и до 4.2 МБ: на одну холодную загрузку каталога оптимизатор
 * был обязан протащить через наши функции 41 МБ. Мастер весит около 190 КБ —
 * в семь с лишним раз меньше. Разрешение при этом не режется, поэтому
 * уменьшает картинку по-прежнему только оптимизатор и второй передискретизации
 * не добавляется. Расхождение с прежним результатом измерено: 0.85/255
 * в среднем, то есть не видно.
 */
export const productPhotoMasterUrl = (recordId: string, attachmentId: string) =>
  `/api/product-photo/${recordId}/${attachmentId}/master`;

/**
 * Загрузчик для next/image, который уводит картинки мимо оптимизатора Vercel.
 *
 * С ним next/image по-прежнему собирает srcset и выбирает ширину, но адреса
 * указывают прямо на наш прокси, а не на /_next/image. Оптимизатор из цепочки
 * пропадает целиком.
 *
 * Зачем. Измерено на дев-стенде, ширина 640, всё вхолодную, три прогона:
 *
 *   через оптимизатор   847 / 824 / 870 мс поштучно, ~1.9 с пачкой в 32
 *   напрямую            385 / 416 / 440 мс поштучно, ~0.7 с пачкой в 32
 *
 * Разница вдвое берётся из того, что оптимизатор — это лишний хоп и второе
 * кодирование: мы жмём исходник в WebP, он этот WebP разжимает и жмёт заново.
 * Вес на выходе при этом одинаковый (15-22 КБ), то есть платили временем ни
 * за что.
 *
 * Прежний довод в пользу оптимизатора — «его кеш общий и живёт долго, а наш
 * надо прогревать» — оказался неверным. Кеш в обоих случаях один и тот же
 * CDN Vercel и ключей столько же: наши ответы уже отдаются с
 * Cache-Control: immutable.
 */
export const productPhotoLoader = ({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string => {
  // Next просит ширины из своего списка (deviceSizes), а прокси отдаёт только
  // свои. Берём ближайшую не меньше запрошенной, иначе картинка окажется
  // мельче слота и будет мылить.
  const target =
    PRODUCT_PHOTO_WIDTHS.find((candidate) => candidate >= width) ??
    PRODUCT_PHOTO_WIDTHS[PRODUCT_PHOTO_WIDTHS.length - 1];

  return src.replace(/\/(master|original|\d+)$/, `/${target}`);
};

/**
 * srcset по всем доступным ширинам. Браузер сам выберет нужную по sizes,
 * поэтому отдельная логика под мобильный не нужна.
 */
/**
 * srcset до ширины исходника включительно.
 *
 * Просить вариант шире оригинала бессмысленно: апскейла нет, вернётся тот же
 * файл под другим адресом. А каждый лишний адрес — отдельная запись в кеше CDN,
 * которую кто-то должен прогреть, заплатив ресайзом на сервере.
 */
export const productPhotoSrcSet = (
  recordId: string,
  attachmentId: string,
  sourceWidth?: number | null
) => {
  const widths = PRODUCT_PHOTO_WIDTHS.filter((width, index) => {
    if (!sourceWidth) return true;
    if (width <= sourceWidth) return true;
    // Первую ширину сверх оригинала оставляем — она и есть «оригинал целиком».
    return PRODUCT_PHOTO_WIDTHS[index - 1] < sourceWidth;
  });
  return widths
    .map((width) => `${productPhotoUrl(recordId, attachmentId, width)} ${width}w`)
    .join(", ");
};

/**
 * Достаёт идентификаторы товара и вложения из адреса картинки.
 *
 * Нужно для диагностики: браузер присылает адрес сломавшейся картинки, и по
 * нему надо понять, о каком товаре речь, чтобы состыковать отчёт с серверным
 * логом. Понимает и прямой адрес, и обёртку /_next/image?url=...
 */
export const parseProductPhotoUrl = (
  value: string
): { recordId: string; attachmentId: string } | null => {
  if (!value) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  const match = decoded.match(
    /\/api\/product-photo\/(rec[A-Za-z0-9]{1,20})\/(att[A-Za-z0-9]{1,20})\//
  );
  if (!match) return null;

  return { recordId: match[1], attachmentId: match[2] };
};
