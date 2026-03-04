export type NormalizedProduct = {
  id: string;
  nameEn: string;
  nameDe: string;
  price: string;
  imageUrl: string | null;
  imageUrlSmall: string | null;
  imageUrlLarge: string | null;
  imageUrlFull: string | null;
  outOfStock: boolean;
  categories: string[];
};

export type FooterLink = {
  label: string;
  href?: string;
  external?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};
