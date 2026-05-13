import type { PublishedVendorRow } from "@/lib/catalog/published-vendors";
import { normalizeVendorCategoryMainSlugs } from "@/lib/catalog/vendor-category-normalize";
import {
  CATALOG_MAIN_CATEGORY_ID_SET,
  CATALOG_SUBCATEGORY_SLUGS,
  resolveCatalogSlugToMainId,
} from "@/lib/constants/categories";

/**
 * Допустимые токены в `?cat=` — основные категории и подкатегории (подкатегории в UI скрыты, URL сохраняем).
 */
export function normalizeCatalogCategorySlugs(slugs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    const t = s.trim();
    if (!t) continue;
    if (CATALOG_MAIN_CATEGORY_ID_SET.has(t) || CATALOG_SUBCATEGORY_SLUGS.has(t)) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}

/** Разворачивает выбранные в URL slug-и (main или sub) в набор id основных категорий. */
export function catalogFilterSlugsToMainIds(slugs: string[]): Set<string> {
  const mains = new Set<string>();
  for (const s of normalizeCatalogCategorySlugs(slugs)) {
    const main = resolveCatalogSlugToMainId(s);
    if (main) mains.add(main);
  }
  return mains;
}

/**
 * Фильтр каталога по `?cat=`: совпадение по основной категории (данные вендора нормализуются в main).
 */
export function filterPublishedVendorsBySubcategorySlugs(
  vendors: PublishedVendorRow[],
  categorySlugs: string[],
): PublishedVendorRow[] {
  const selectedMains = catalogFilterSlugsToMainIds(categorySlugs);
  if (selectedMains.size === 0) {
    return vendors;
  }
  return vendors.filter((v) => {
    const vendorMains = normalizeVendorCategoryMainSlugs(v.categories);
    return vendorMains.some((m) => selectedMains.has(m));
  });
}
