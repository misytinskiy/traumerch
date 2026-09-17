export type NormalizedProduct = {
  id: string;
  nameEn: string;
  nameDe: string;
  price: string;
  imageUrl: string | null;
  hoverImageUrl?: string | null;
  /**
   * Идентификаторы вложений Airtable. В отличие от url они не протухают и
   * меняются только когда в Airtable заменили само фото, поэтому на них
   * строятся вечно кешируемые адреса в /api/product-photo.
   */
  imageId?: string | null;
  hoverImageId?: string | null;
  /**
   * Оригиналы вложений в полном разрешении. Именно их читает /api/product-photo:
   * imageUrl ниже — это thumbnails.large от Airtable, всего 512px, и ресайз
   * из него давал мыло на любой карточке крупнее превьюшки.
   */
  imageUrlOriginal?: string | null;
  hoverImageUrlOriginal?: string | null;
  /** Ширина оригинала — чтобы не просить у прокси варианты, которых нет. */
  imageWidth?: number | null;
  hoverImageWidth?: number | null;
  imageUrlSmall: string | null;
  imageUrlLarge: string | null;
  imageUrlFull: string | null;
  outOfStock: boolean;
  categories: string[];
  catalogFeatured?: boolean;
};

/**
 * То, что уезжает в браузер. Отличается от NormalizedProduct отсутствием
 * сырых ссылок Airtable: они протухают за два часа, ничего не рендерят
 * (адреса строятся из imageId) и занимают около сотни килобайт на странице.
 */
export type ClientProduct = Omit<
  NormalizedProduct,
  | "imageUrl"
  | "hoverImageUrl"
  | "imageUrlSmall"
  | "imageUrlLarge"
  | "imageUrlFull"
  | "imageUrlOriginal"
  | "hoverImageUrlOriginal"
>;

export type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};
