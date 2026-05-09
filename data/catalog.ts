export const CATALOG_CATEGORY_IDS = [
  "womens_clothing",
  "mens_clothing",
  "kids_clothing",
  "footwear",
  "bags",
  "fabrics",
  "cosmetics",
  "electronics",
  "home_goods",
] as const;

export type CatalogCategoryId = (typeof CATALOG_CATEGORY_IDS)[number];
