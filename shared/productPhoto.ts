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
 * Оригинал вложения по вечному адресу.
 *
 * Именно это отдаётся в next/image как источник. Ресайзить самим оказалось
 * плохой идеей: при небольшом трафике кеш на 414 фото в пяти ширинах почти
 * никогда не прогревался, и посетитель ждал 500-1500 мс на каждую картинку.
 * Оптимизатор Vercel делает то же самое, но кешируется глобально и надолго,
 * а от протухающих ссылок Airtable нас защищает стабильность этого адреса:
 * он привязан к id вложения, а не к временной ссылке.
 */
export const productPhotoOriginalUrl = (recordId: string, attachmentId: string) =>
  `/api/product-photo/${recordId}/${attachmentId}/original`;

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
