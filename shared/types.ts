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
  "imageUrl" | "hoverImageUrl" | "imageUrlSmall" | "imageUrlLarge" | "imageUrlFull"
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
