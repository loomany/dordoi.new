import type { PublishedVendorRow } from "@/lib/catalog/published-vendors";
import { CATALOG_SUBCATEGORY_SLUGS } from "@/lib/constants/categories";

/**
 * Keeps only slugs that exist in the catalog taxonomy (ignore unknown URL tokens).
 */
export function normalizeCatalogCategorySlugs(slugs: string[]): string[] {
  const allowed = CATALOG_SUBCATEGORY_SLUGS;
  const out: string[] = [];
  for (const s of slugs) {
    const t = s.trim();
    if (t && allowed.has(t)) {
      out.push(t);
    }
  }
  return out;
}

/**
 * TODO: связать с `vendors.categories` / анкетой (Telegram и т.д.).
 * Сейчас муляж: список карточек не меняется.
 */
export function filterPublishedVendorsBySubcategorySlugs(
  vendors: PublishedVendorRow[],
  // TODO: использовать при связке с `vendors.categories`
  subcategorySlugs: string[],
): PublishedVendorRow[] {
  void subcategorySlugs;
  return vendors;
}
