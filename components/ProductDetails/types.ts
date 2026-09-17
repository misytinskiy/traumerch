export type PhotoVariants = {
  /**
   * Идентификатор вложения Airtable. Не протухает, в отличие от url ниже,
   * поэтому именно из него строится адрес в /api/product-photo.
   */
  id: string | null;
  full: string | null;
  large: string | null;
  small: string | null;
  fallback: string | null;
};
