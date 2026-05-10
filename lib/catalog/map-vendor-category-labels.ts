import "server-only";

/**
 * When `vendors.categories` stores canonical Russian labels (same as `messages/ru.json`
 * → `catalogCategories`), map them to the active locale via next-intl.
 * Unknown / free-text labels are returned unchanged.
 */
const RU_LABEL_TO_CATALOG_KEY: Record<string, string> = {
  "Женская одежда": "womens_clothing",
  "Мужская одежда": "mens_clothing",
  "Детская одежда": "kids_clothing",
  "Обувь": "footwear",
  "Сумки": "bags",
  "Ткани": "fabrics",
  "Косметика": "cosmetics",
  "Электроника": "electronics",
  "Товары для дома": "home_goods",
};

export function mapVendorCategoryLabelsForLocale(
  labels: string[],
  tCatalog: (key: string) => string,
): string[] {
  return labels.map((raw) => {
    const label = raw.trim();
    const key = RU_LABEL_TO_CATALOG_KEY[label];
    return key ? tCatalog(key) : raw;
  });
}
