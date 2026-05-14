import { catalogFilterSlugsToMainIds } from "@/lib/catalog/catalog-category-filter";
import { normalizeVendorCategoryMainSlugs } from "@/lib/catalog/vendor-category-normalize";

/**
 * Закреплённые витриной slug-и → позиция в каталоге (0 = первая карточка).
 * Пропуски в нумерации допустимы (например 3-я позиция свободна).
 */
export const CATALOG_PINNED_VENDOR_RANK: Readonly<Record<string, number>> = {
  "muhsina-kg": 0,
  "bermet-factory": 1,
  "fam-optom-kg": 3,
  "fatimashopkg": 4,
  "giza-optom": 5,
};

/** Закрепление только внутри main-категории (`mens`, `womens`, …). */
export const CATALOG_PINNED_VENDOR_RANK_BY_CATEGORY: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = {
  "muhsina-kg": { womens: 0 },
  "lima-brand-kg": { womens: 1 },
  "bermet-factory": { womens: 2 },
  "pkas-collection": { mens: 0 },
  "optom-dordoi-firdaus": { mens: 1 },
  "bigsport-dordoi": { mens: 2 },
  "milaisa-dordoi": { kids: 0 },
  "lili-moda": { kids: 1 },
  "amina-optom-kg": { "underwear-swim": 0 },
  "anttifu-r": { "underwear-swim": 1 },
  "anjur-kids-bishkek": { footwear: 0 },
  "italy-obuv-kg": { footwear: 1 },
  "zipari-ru": { "fabrics-notions": 0 },
  "eva-textile-kg": { "fabrics-notions": 1 },
  "kovry-islams": { "home-textiles": 0 },
  "icon-kovri": { "home-textiles": 1 },
  "b-toys-kg": { "toys-children": 0 },
  "igrushkin-kg": { "toys-children": 1 },
  "mobax-kg": { electronics: 0 },
  "tehnika-kg": { electronics: 1 },
};

/** @deprecated Используйте `CATALOG_PINNED_VENDOR_RANK`; порядок по возрастанию rank. */
export const CATALOG_PINNED_VENDOR_SLUGS = Object.entries(
  CATALOG_PINNED_VENDOR_RANK,
)
  .sort(([, a], [, b]) => a - b)
  .map(([slug]) => slug);

/** Публичный @username / t.me/name — канал или публичная группа (не чат по номеру и не invite). */
export function isTelegramChannelUrl(
  raw: string | null | undefined,
): boolean {
  if (!raw?.trim()) {
    return false;
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    return /^[A-Za-z][A-Za-z0-9_]{2,}$/.test(handle);
  }

  let normalized = trimmed;
  if (normalized.startsWith("t.me/")) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "t.me" && host !== "telegram.me") {
      return false;
    }
    const segment = parsed.pathname.split("/").filter(Boolean)[0];
    if (!segment) {
      return false;
    }
    if (segment === "joinchat" || segment === "c" || segment.startsWith("+")) {
      return false;
    }
    return /^[A-Za-z][A-Za-z0-9_]{2,}$/.test(segment);
  } catch {
    return false;
  }
}

export type CatalogVendorDisplayRankInput = {
  slug: string;
  /** Stable pin key after opaque catalog slug migration. */
  seo_slug?: string | null;
  categories?: readonly string[] | null;
  telegram_url?: string | null;
  created_at?: string | null;
};

export type CompareCatalogVendorsOptions = {
  /** Slug-и из `?cat=`; пусто — общий каталог. */
  categoryFilterSlugs?: readonly string[];
};

function vendorCatalogPinKeys(vendor: CatalogVendorDisplayRankInput): string[] {
  const keys: string[] = [];
  const slug = vendor.slug.trim();
  const seo = vendor.seo_slug?.trim();
  if (slug) keys.push(slug);
  if (seo && seo !== slug) keys.push(seo);
  return keys;
}

function pinnedRankFromMap(
  vendor: CatalogVendorDisplayRankInput,
  rankMap: Readonly<Record<string, number>>,
): number | undefined {
  for (const key of vendorCatalogPinKeys(vendor)) {
    const rank = rankMap[key];
    if (rank !== undefined) return rank;
  }
  return undefined;
}

function catalogPinSortKey(
  vendor: CatalogVendorDisplayRankInput,
  categoryFilterSlugs: readonly string[],
): number {
  const filterMains = catalogFilterSlugsToMainIds([...categoryFilterSlugs]);
  const vendorMains = normalizeVendorCategoryMainSlugs([...(vendor.categories ?? [])]);

  if (filterMains.size > 0) {
    const inFilter = vendorMains.some((m) => filterMains.has(m));
    if (!inFilter) {
      return Number.POSITIVE_INFINITY;
    }

    for (const main of vendorMains) {
      if (!filterMains.has(main)) continue;
      for (const key of vendorCatalogPinKeys(vendor)) {
        const rank = CATALOG_PINNED_VENDOR_RANK_BY_CATEGORY[key]?.[main];
        if (rank !== undefined) {
          return rank;
        }
      }
    }

    const globalRank = pinnedRankFromMap(vendor, CATALOG_PINNED_VENDOR_RANK);
    if (globalRank !== undefined) {
      return globalRank;
    }

    return Number.POSITIVE_INFINITY;
  }

  const globalRank = pinnedRankFromMap(vendor, CATALOG_PINNED_VENDOR_RANK);
  return globalRank === undefined ? Number.POSITIVE_INFINITY : globalRank;
}

/**
 * Закреплённые slug → Telegram-канал → `created_at` desc.
 */
export function compareCatalogVendorsForDisplay(
  a: CatalogVendorDisplayRankInput,
  b: CatalogVendorDisplayRankInput,
  opts: CompareCatalogVendorsOptions = {},
): number {
  const categoryFilterSlugs = opts.categoryFilterSlugs ?? [];
  const aPin = catalogPinSortKey(a, categoryFilterSlugs);
  const bPin = catalogPinSortKey(b, categoryFilterSlugs);
  if (aPin !== bPin) {
    return aPin - bPin;
  }

  const aChannel = isTelegramChannelUrl(a.telegram_url);
  const bChannel = isTelegramChannelUrl(b.telegram_url);
  if (aChannel !== bChannel) {
    return aChannel ? -1 : 1;
  }
  const aTime = Date.parse(a.created_at ?? "") || 0;
  const bTime = Date.parse(b.created_at ?? "") || 0;
  return bTime - aTime;
}

export function catalogVendorDisplayRankInputFromRow(
  row: Record<string, unknown>,
): CatalogVendorDisplayRankInput {
  return {
    slug: typeof row.slug === "string" ? row.slug.trim() : "",
    seo_slug: typeof row.seo_slug === "string" ? row.seo_slug.trim() : null,
    categories: Array.isArray(row.categories)
      ? (row.categories as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [],
    telegram_url:
      typeof row.telegram_url === "string" ? row.telegram_url : null,
    created_at:
      typeof row.created_at === "string" ? row.created_at : null,
  };
}
