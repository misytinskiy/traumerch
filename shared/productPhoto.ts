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
 * srcset по всем доступным ширинам. Браузер сам выберет нужную по sizes,
 * поэтому отдельная логика под мобильный не нужна.
 */
export const productPhotoSrcSet = (recordId: string, attachmentId: string) =>
  PRODUCT_PHOTO_WIDTHS.map(
    (width) => `${productPhotoUrl(recordId, attachmentId, width)} ${width}w`
  ).join(", ");
