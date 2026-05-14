import { normalizeVendorCategoryMainSlugs } from "@/lib/catalog/vendor-category-normalize";
import {
  compareCatalogVendorsForDisplay,
  type CatalogVendorDisplayRankInput,
} from "@/lib/catalog/vendor-display-rank";
import { CATALOG_CATEGORY_TREE } from "@/lib/constants/categories";

/** Бесплатных карточек женской одежды на главном `/catalog`. */
export const MAIN_CATALOG_HUB_PREVIEW_WOMENS = 3;

/** Бесплатных карточек с каждой остальной ниши на главном `/catalog`. */
export const MAIN_CATALOG_HUB_PREVIEW_PER_OTHER_CATEGORY = 1;

export const MAIN_CATALOG_HUB_MAIN_IDS = CATALOG_CATEGORY_TREE.map((m) => m.id);

export function mainCatalogHubPreviewCountForCategory(mainId: string): number {
  return mainId === "womens"
    ? MAIN_CATALOG_HUB_PREVIEW_WOMENS
    : MAIN_CATALOG_HUB_PREVIEW_PER_OTHER_CATEGORY;
}

export function isMainCatalogHubView(opts: {
  categoryFilterSlugs?: readonly string[];
  searchQuery?: string | null;
}): boolean {
  return (
    (opts.categoryFilterSlugs?.length ?? 0) === 0 &&
    !(opts.searchQuery ?? "").trim()
  );
}

export function guestFreeMainCatalogHubLimit(): number {
  return MAIN_CATALOG_HUB_MAIN_IDS.reduce(
    (sum, mainId) => sum + mainCatalogHubPreviewCountForCategory(mainId),
    0,
  );
}

type MainHubVendor = CatalogVendorDisplayRankInput & {
  slug: string;
  categories?: readonly string[] | null;
};

function compareForMainHub(
  a: MainHubVendor,
  b: MainHubVendor,
  categoryFilterSlugs: readonly string[] = [],
): number {
  return compareCatalogVendorsForDisplay(a, b, { categoryFilterSlugs });
}

function sortByCategoryFilter<T extends MainHubVendor>(
  vendors: readonly T[],
  categoryFilterSlugs: readonly string[],
): T[] {
  return vendors.slice().sort((a, b) =>
    compareForMainHub(a, b, categoryFilterSlugs),
  );
}

/** Сколько free-слотов реально заполнено (если в нише нет вендоров — слот не считается). */
export function countMainCatalogHubFreePreview<T extends MainHubVendor>(
  vendors: readonly T[],
): number {
  const usedSlugs = new Set<string>();
  let count = 0;

  for (const mainId of MAIN_CATALOG_HUB_MAIN_IDS) {
    const picks = sortByCategoryFilter(
      vendors.filter((vendor) => {
        if (usedSlugs.has(vendor.slug)) return false;
        return normalizeVendorCategoryMainSlugs([...(vendor.categories ?? [])]).includes(
          mainId,
        );
      }),
      [mainId],
    ).slice(0, mainCatalogHubPreviewCountForCategory(mainId));

    for (const vendor of picks) {
      usedSlugs.add(vendor.slug);
      count += 1;
    }
  }

  return count;
}

function primaryMainCategoryId(vendor: MainHubVendor): string {
  const mains = normalizeVendorCategoryMainSlugs([...(vendor.categories ?? [])]);
  const preferred = MAIN_CATALOG_HUB_MAIN_IDS.find((id) => mains.includes(id));
  return preferred ?? mains[0] ?? "uncategorized";
}

function interleaveVendorsRoundRobin<T extends MainHubVendor>(
  vendors: readonly T[],
): T[] {
  const buckets = new Map<string, T[]>();

  for (const vendor of vendors) {
    const mainId = primaryMainCategoryId(vendor);
    const bucket = buckets.get(mainId) ?? [];
    bucket.push(vendor);
    buckets.set(mainId, bucket);
  }

  for (const mainId of buckets.keys()) {
    buckets.set(
      mainId,
      sortByCategoryFilter(buckets.get(mainId)!, [mainId]) as T[],
    );
  }

  const order = [
    ...MAIN_CATALOG_HUB_MAIN_IDS,
    ...[...buckets.keys()].filter((id) => !MAIN_CATALOG_HUB_MAIN_IDS.includes(id)),
  ];

  const out: T[] = [];
  let round = 0;
  let progressed = true;

  while (progressed) {
    progressed = false;
    for (const mainId of order) {
      const bucket = buckets.get(mainId);
      const vendor = bucket?.[round];
      if (!vendor) continue;
      out.push(vendor);
      progressed = true;
    }
    round += 1;
  }

  return out;
}

/**
 * Главный каталог без `?cat=`:
 * 1) 2 превью женской + по 1 из каждой другой ниши (в порядке дерева),
 * 2) остальные — round-robin по категориям (под paywall).
 */
export function orderVendorsForMainCatalogHub<T extends MainHubVendor>(
  vendors: readonly T[],
): T[] {
  const usedSlugs = new Set<string>();
  const freeTier: T[] = [];

  for (const mainId of MAIN_CATALOG_HUB_MAIN_IDS) {
    const picks = sortByCategoryFilter(
      vendors.filter((vendor) => {
        if (usedSlugs.has(vendor.slug)) return false;
        return normalizeVendorCategoryMainSlugs([...(vendor.categories ?? [])]).includes(
          mainId,
        );
      }),
      [mainId],
    ).slice(0, mainCatalogHubPreviewCountForCategory(mainId));

    for (const vendor of picks) {
      freeTier.push(vendor);
      usedSlugs.add(vendor.slug);
    }
  }

  const lockedTier = interleaveVendorsRoundRobin(
    vendors.filter((vendor) => !usedSlugs.has(vendor.slug)),
  );

  return [...freeTier, ...lockedTier];
}
