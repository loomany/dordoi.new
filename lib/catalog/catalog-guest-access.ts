import { catalogFilterSlugsToMainIds } from "@/lib/catalog/catalog-category-filter";
import { guestFreeMainCatalogHubLimit } from "@/lib/catalog/catalog-main-hub-order";

/** Сколько карточек открыто на общем каталоге `/catalog` без фильтра. */
export const GUEST_FREE_CATALOG_CARDS = 6;

/** Сколько карточек открыто на странице категории (`/categories/…` или `/catalog?cat=`). */
export const GUEST_FREE_CATEGORY_PAGE_CARDS = 2;

/** Переопределение лимита для отдельных main-категорий на странице категории. */
export const GUEST_FREE_CATEGORY_PAGE_CARDS_BY_MAIN: Readonly<
  Partial<Record<string, number>>
> = {
  womens: 3,
};

/**
 * Main-категории, где гостю не открываем ни одной карточки (всё под paywall).
 * Пример: «Спорт, туризм и отдых».
 */
export const GUEST_CATEGORY_ZERO_FREE_MAIN_IDS = new Set<string>([
  "sports-outdoors",
]);

export type GuestFreeCatalogCardLimitOptions = {
  /** Slug-и из `?cat=` или SEO-страницы категории. */
  categoryFilterSlugs?: readonly string[];
  totalVendorsInFilter?: number;
  /** Фактическое число free-превью на главном каталоге (≤ теоретического лимита). */
  mainHubFreePreviewCount?: number;
};

export function guestFreeCatalogCardLimit(
  categoryFilterActive: boolean,
  opts: GuestFreeCatalogCardLimitOptions = {},
): number {
  if (!categoryFilterActive) {
    return opts.mainHubFreePreviewCount ?? guestFreeMainCatalogHubLimit();
  }

  const mains = catalogFilterSlugsToMainIds([...(opts.categoryFilterSlugs ?? [])]);
  for (const mainId of mains) {
    if (GUEST_CATEGORY_ZERO_FREE_MAIN_IDS.has(mainId)) {
      return 0;
    }
  }

  if ((opts.totalVendorsInFilter ?? 0) === 0) {
    return GUEST_FREE_CATALOG_CARDS;
  }

  if (mains.size === 1) {
    const mainId = [...mains][0]!;
    const override = GUEST_FREE_CATEGORY_PAGE_CARDS_BY_MAIN[mainId];
    if (override !== undefined) {
      return override;
    }
  }

  return GUEST_FREE_CATEGORY_PAGE_CARDS;
}

export function isCatalogCardLockedForGuest(opts: {
  hasFullAccess: boolean;
  globalIndex: number;
  freeLimit?: number;
}): boolean {
  if (opts.hasFullAccess) return false;
  const limit = opts.freeLimit ?? GUEST_FREE_CATALOG_CARDS;
  return opts.globalIndex >= limit;
}
