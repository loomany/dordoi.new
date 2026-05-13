import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAiCatalogDisplayOverlay,
} from "@/lib/catalog/parsed-ai-catalog-overlay";
import {
  leadVideoFromProductVideos,
  type CatalogLeadVideo,
} from "@/lib/catalog/catalog-lead-video";

export { getAiCatalogDisplayOverlay };
import {
  commerceCopyFromVendorRow,
  inferCatalogCardSubtitleFallback,
  inferVendorTradeType,
  type ParsedVendorCardData,
} from "@/lib/catalog/vendor-card-display";
import {
  dedupeCatalogSubtitle,
  resolveCatalogStoreTitleForCard,
} from "@/lib/catalog/catalog-card-title";
import {
  getShowcaseCatalogFields,
  type CatalogBrowseT,
} from "@/lib/catalog/showcase-vendor-i18n";
import { resolveSeoCategoryHrefForVendorCategories } from "@/lib/catalog/seo-category-routes";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { localizedMainCategoryLabels } from "@/lib/catalog/vendor-category-normalize";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";
import {
  BUYER_ONLY_VENDOR_SLUGS,
  isBuyerOnlyVendorSlug,
} from "@/lib/catalog/buyer-only-vendor-slugs";
import {
  catalogFilterSlugsToMainIds,
  normalizeCatalogCategorySlugs,
} from "@/lib/catalog/catalog-category-filter";
import {
  isShowcaseVendorSlug,
  SHOWCASE_VENDOR_SLUGS,
} from "@/lib/catalog/showcase-vendor-i18n";

/**
 * Минимальный набор полей `vendors`, нужных для CatalogCard в /catalog.
 * Поля совпадают по смыслу с карточкой каталога (название, описание, категории, фото).
 */
export type PublishedVendorRow = {
  id: string;
  slug: string;
  store_name: string | null;
  description: string | null;
  description_detail?: string | null;
  categories: string[];
  logo_url: string | null;
  container_photo_url?: string | null;
  product_photos: string[];
  location_row: string | null;
  phone_number?: string | null;
  min_batch?: string | null;
  payment_methods?: string | null;
  delivery_help?: boolean;
  whatsapp_1?: string | null;
  whatsapp_2?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  /** Ссылка из Google Places (импорт / ручное заполнение). */
  google_maps_uri?: string | null;
  google_place_id?: string | null;
  /** Колонки в БД пока не добавлялись — поля для будущей миграции; в select не входят. */
  two_gis_uri?: string | null;
  yandex_maps_uri?: string | null;
  samples_available?: boolean;
  samples_note?: string | null;
  returns_policy?: string | null;
  created_at: string;
  /** Подписчики Instagram и др. */
  followers_count?: number | null;
  /** URL видео (Instagram Reels и др.), до 15. */
  product_videos?: string[];
  /** JSONB: снимок после ИИ (`display` + meta); см. миграцию `parsed_ai_data`. */
  parsed_ai_data?: unknown;
};

/** Публичный каталог не показывает эти витрины (нормализация: trim + lower case). */
const BLOCKED_CATALOG_STORE_NAMES = new Set(["cosmos", "123"]);

function isHiddenFromPublicCatalogSlug(
  slug: string | null | undefined,
): boolean {
  const key = typeof slug === "string" ? slug.trim() : "";
  return (
    key.length > 0 &&
    (isBuyerOnlyVendorSlug(key) || isShowcaseVendorSlug(key))
  );
}

function isBlockedPublicCatalogStoreName(
  storeName: string | null | undefined,
): boolean {
  const key =
    typeof storeName === "string" ? storeName.trim().toLowerCase() : "";
  return key.length > 0 && BLOCKED_CATALOG_STORE_NAMES.has(key);
}

const PUBLISHED_VENDOR_SELECT_FIELDS =
  "id, slug, store_name, description, categories, logo_url, product_photos, product_videos, location_row, created_at, min_batch, payment_methods, delivery_help, samples_available, samples_note, returns_policy, parsed_ai_data";

/** List query для пагинированного `/catalog` — с `parsed_ai_data` для текста ИИ на карточке. */
const PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS =
  "id, slug, store_name, description, categories, logo_url, product_photos, product_videos, location_row, created_at, min_batch, payment_methods, delivery_help, samples_available, samples_note, returns_policy, parsed_ai_data";

const PUBLISHED_VENDOR_PROFILE_SELECT_FIELDS =
  "id, slug, store_name, description, description_detail, categories, logo_url, container_photo_url, product_photos, product_videos, location_row, phone_number, min_batch, payment_methods, delivery_help, whatsapp_1, whatsapp_2, instagram_url, telegram_url, google_maps_uri, google_place_id, samples_available, samples_note, returns_policy, created_at, followers_count, parsed_ai_data";

/**
 * Все опубликованные продавцы для публичного каталога.
 * Идём через service-role (как в админке), чтобы не зависеть от RLS;
 * SELECT идёт только по `status = 'approved'` и только полями из карточки.
 */
export async function fetchPublishedVendorsForCatalog(): Promise<PublishedVendorRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select(PUBLISHED_VENDOR_SELECT_FIELDS)
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchPublishedVendorsForCatalog]", error);
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((row): PublishedVendorRow | null => {
      const r = row as Record<string, unknown>;
      const slug = typeof r.slug === "string" ? r.slug.trim() : "";
      if (!slug || isHiddenFromPublicCatalogSlug(slug)) {
        return null;
      }
      const id =
        typeof r.id === "string"
          ? r.id
          : typeof r.id === "number" && Number.isFinite(r.id)
            ? String(r.id)
            : "";
      if (!id) {
        return null;
      }
      const cats = Array.isArray(r.categories)
        ? (r.categories as unknown[]).filter(
            (x): x is string => typeof x === "string",
          )
        : [];
      const photos = Array.isArray(r.product_photos)
        ? (r.product_photos as unknown[]).filter(
            (x): x is string => typeof x === "string",
          )
        : [];
      const videos = Array.isArray(r.product_videos)
        ? (r.product_videos as unknown[]).filter(
            (x): x is string => typeof x === "string",
          )
        : [];
      const storeName = typeof r.store_name === "string" ? r.store_name : null;
      if (isBlockedPublicCatalogStoreName(storeName)) {
        return null;
      }
      return {
        id,
        slug,
        store_name: storeName,
        description: typeof r.description === "string" ? r.description : null,
        categories: cats,
        logo_url: typeof r.logo_url === "string" ? r.logo_url : null,
        product_photos: photos,
        product_videos: videos,
        location_row:
          typeof r.location_row === "string" ? r.location_row : null,
        created_at:
          typeof r.created_at === "string"
            ? r.created_at
            : new Date().toISOString(),
        min_batch: typeof r.min_batch === "string" ? r.min_batch : null,
        payment_methods:
          typeof r.payment_methods === "string" ? r.payment_methods : null,
        delivery_help: Boolean(r.delivery_help),
        samples_available: Boolean(r.samples_available),
        samples_note: typeof r.samples_note === "string" ? r.samples_note : null,
        returns_policy:
          typeof r.returns_policy === "string" ? r.returns_policy : null,
        instagram_url:
          typeof r.instagram_url === "string" ? r.instagram_url : null,
        parsed_ai_data: r.parsed_ai_data,
      };
    })
    .filter((x): x is PublishedVendorRow => x !== null);
}

/** Строка вендора для list view каталога (пагинация `/catalog`). */
export type PublishedVendorCatalogListRow = Omit<
  PublishedVendorRow,
  | "description_detail"
  | "container_photo_url"
  | "phone_number"
  | "whatsapp_1"
  | "whatsapp_2"
  | "telegram_url"
  | "google_maps_uri"
  | "google_place_id"
  | "two_gis_uri"
  | "yandex_maps_uri"
  | "followers_count"
>;

export type FetchPublishedVendorsCatalogPageParams = {
  page: number;
  pageSize: number;
  subcategorySlugs?: string[];
};

export type FetchPublishedVendorsCatalogPageResult = {
  vendors: PublishedVendorCatalogListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
};

/** `unstable_cache` tag for public `/catalog` vendor list (see moderation revalidate). */
export const CATALOG_VENDORS_LIST_CACHE_TAG = "catalog-vendors-list";

const CATALOG_VENDORS_LIST_CACHE_REVALIDATE_SECONDS = 120;

type NormalizedCatalogPageParams = {
  page: number;
  pageSize: number;
  subcategorySlugs: string[];
};

function normalizeCatalogPageParams(
  params: FetchPublishedVendorsCatalogPageParams,
): NormalizedCatalogPageParams {
  const subcategorySlugs = normalizeCatalogCategorySlugs(
    params.subcategorySlugs ?? [],
  );
  return {
    page: parseCatalogPageNumber(params.page),
    pageSize: parseCatalogPageSize(params.pageSize),
    subcategorySlugs: [...new Set(subcategorySlugs)].sort(),
  };
}

const HIDDEN_PUBLIC_CATALOG_SLUGS: readonly string[] = [
  ...BUYER_ONLY_VENDOR_SLUGS,
  ...SHOWCASE_VENDOR_SLUGS,
];

function parseCatalogPageNumber(page: number): number {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parseCatalogPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return 12;
  }
  return Math.min(Math.max(1, Math.floor(pageSize)), 50);
}

/** Токены для PostgREST `categories` overlap (`?cat=` main + sub slug-и). */
function catalogCategoryOverlapTokens(subcategorySlugs: string[]): string[] {
  const normalized = normalizeCatalogCategorySlugs(subcategorySlugs);
  if (normalized.length === 0) {
    return [];
  }
  const mains = catalogFilterSlugsToMainIds(normalized);
  return [...new Set([...normalized, ...mains])];
}

function mapPublishedVendorCatalogListRow(
  row: unknown,
): PublishedVendorCatalogListRow | null {
  const r = row as Record<string, unknown>;
  const slug = typeof r.slug === "string" ? r.slug.trim() : "";
  if (!slug || isHiddenFromPublicCatalogSlug(slug)) {
    return null;
  }
  const id =
    typeof r.id === "string"
      ? r.id
      : typeof r.id === "number" && Number.isFinite(r.id)
        ? String(r.id)
        : "";
  if (!id) {
    return null;
  }
  const storeName = typeof r.store_name === "string" ? r.store_name : null;
  if (isBlockedPublicCatalogStoreName(storeName)) {
    return null;
  }
  const cats = Array.isArray(r.categories)
    ? (r.categories as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];
  const photos = Array.isArray(r.product_photos)
    ? (r.product_photos as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];
  const videos = Array.isArray(r.product_videos)
    ? (r.product_videos as unknown[]).filter(
        (x): x is string => typeof x === "string",
      )
    : [];
  return {
    id,
    slug,
    store_name: storeName,
    description: typeof r.description === "string" ? r.description : null,
    categories: cats,
    logo_url: typeof r.logo_url === "string" ? r.logo_url : null,
    product_photos: photos,
    product_videos: videos,
    location_row: typeof r.location_row === "string" ? r.location_row : null,
    created_at:
      typeof r.created_at === "string"
        ? r.created_at
        : new Date().toISOString(),
    min_batch: typeof r.min_batch === "string" ? r.min_batch : null,
    payment_methods:
      typeof r.payment_methods === "string" ? r.payment_methods : null,
    delivery_help: Boolean(r.delivery_help),
    samples_available: Boolean(r.samples_available),
    samples_note: typeof r.samples_note === "string" ? r.samples_note : null,
    returns_policy:
      typeof r.returns_policy === "string" ? r.returns_policy : null,
    instagram_url:
      typeof r.instagram_url === "string" ? r.instagram_url : null,
    parsed_ai_data: r.parsed_ai_data,
  };
}

/**
 * Одна страница опубликованных вендоров для `/catalog` (Supabase, без кэша).
 * `parsed_ai_data` в SELECT — на карточке только текст ИИ, не сырой `description`.
 *
 * Ограничения:
 * - `?cat=` фильтруется через `categories && tokens` (main/sub slug-и), без нормализации синонимов в БД.
 * - `store_name` blocklist (`cosmos`, `123`) отсекается после SELECT — `totalCount` может быть чуть завышен.
 */
async function fetchPublishedVendorsCatalogPageRaw(
  params: NormalizedCatalogPageParams,
): Promise<FetchPublishedVendorsCatalogPageResult> {
  const { page, pageSize, subcategorySlugs } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();
  // Supabase filter chain + `count: "exact"` — иначе TS2589 на reassignment.
  let q = admin
    .from("vendors")
    .select(PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS, { count: "exact" })
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("created_at", { ascending: false }) as {
    not: (
      column: string,
      operator: string,
      value: string,
    ) => typeof q;
    overlaps: (column: string, value: string[]) => typeof q;
    range: (
      from: number,
      to: number,
    ) => PromiseLike<{
      data: unknown[] | null;
      error: { message: string } | null;
      count: number | null;
    }>;
  };

  if (HIDDEN_PUBLIC_CATALOG_SLUGS.length > 0) {
    q = q.not(
      "slug",
      "in",
      `(${HIDDEN_PUBLIC_CATALOG_SLUGS.map((s) => `"${s}"`).join(",")})`,
    );
  }

  const categoryTokens = catalogCategoryOverlapTokens(subcategorySlugs);
  if (categoryTokens.length > 0) {
    q = q.overlaps("categories", categoryTokens);
  }

  const { data, error, count } = await q.range(from, to);

  if (error) {
    console.error("[fetchPublishedVendorsCatalogPage]", error);
    return { vendors: [], totalCount: 0, page, pageSize };
  }

  const vendors = (Array.isArray(data) ? data : [])
    .map((row) => mapPublishedVendorCatalogListRow(row))
    .filter((x): x is PublishedVendorCatalogListRow => x !== null);

  return {
    vendors,
    totalCount: typeof count === "number" && count >= 0 ? count : vendors.length,
    page,
    pageSize,
  };
}

/** Публичный paginated list для `/catalog` — кэш 120s, только vendor rows (без session/favorites). */
export async function fetchPublishedVendorsCatalogPage(
  params: FetchPublishedVendorsCatalogPageParams,
): Promise<FetchPublishedVendorsCatalogPageResult> {
  const normalized = normalizeCatalogPageParams(params);
  return unstable_cache(
    () => fetchPublishedVendorsCatalogPageRaw(normalized),
    [
      "published-vendors-catalog-page",
      String(normalized.page),
      String(normalized.pageSize),
      normalized.subcategorySlugs.join(","),
    ],
    {
      revalidate: CATALOG_VENDORS_LIST_CACHE_REVALIDATE_SECONDS,
      tags: [CATALOG_VENDORS_LIST_CACHE_TAG],
    },
  )();
}

function normalizePublishedVendorRow(row: unknown): PublishedVendorRow | null {
  const r = row as Record<string, unknown>;
  const slug = typeof r.slug === "string" ? r.slug.trim() : "";
  if (!slug) {
    return null;
  }
  const id =
    typeof r.id === "string"
      ? r.id
      : typeof r.id === "number" && Number.isFinite(r.id)
        ? String(r.id)
        : "";
  if (!id) {
    return null;
  }
  const cats = Array.isArray(r.categories)
    ? (r.categories as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const photos = Array.isArray(r.product_photos)
    ? (r.product_photos as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const videos = Array.isArray(r.product_videos)
    ? (r.product_videos as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  return {
    id,
    slug,
    store_name: typeof r.store_name === "string" ? r.store_name : null,
    description: typeof r.description === "string" ? r.description : null,
    description_detail:
      typeof r.description_detail === "string" ? r.description_detail : null,
    categories: cats,
    logo_url: typeof r.logo_url === "string" ? r.logo_url : null,
    container_photo_url:
      typeof r.container_photo_url === "string" ? r.container_photo_url : null,
    product_photos: photos,
    product_videos: videos,
    location_row: typeof r.location_row === "string" ? r.location_row : null,
    phone_number: typeof r.phone_number === "string" ? r.phone_number : null,
    min_batch: typeof r.min_batch === "string" ? r.min_batch : null,
    payment_methods:
      typeof r.payment_methods === "string" ? r.payment_methods : null,
    delivery_help: Boolean(r.delivery_help),
    whatsapp_1: typeof r.whatsapp_1 === "string" ? r.whatsapp_1 : null,
    whatsapp_2: typeof r.whatsapp_2 === "string" ? r.whatsapp_2 : null,
    instagram_url:
      typeof r.instagram_url === "string" ? r.instagram_url : null,
    telegram_url: typeof r.telegram_url === "string" ? r.telegram_url : null,
    google_maps_uri:
      typeof r.google_maps_uri === "string" ? r.google_maps_uri : null,
    google_place_id:
      typeof r.google_place_id === "string" ? r.google_place_id : null,
    two_gis_uri: typeof r.two_gis_uri === "string" ? r.two_gis_uri : null,
    yandex_maps_uri:
      typeof r.yandex_maps_uri === "string" ? r.yandex_maps_uri : null,
    samples_available: Boolean(r.samples_available),
    samples_note: typeof r.samples_note === "string" ? r.samples_note : null,
    returns_policy:
      typeof r.returns_policy === "string" ? r.returns_policy : null,
    followers_count:
      typeof r.followers_count === "number" && Number.isFinite(r.followers_count)
        ? r.followers_count
        : null,
    created_at:
      typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
    parsed_ai_data: r.parsed_ai_data,
  };
}

/** Одна approved-партия фото товаров продавца в формате для UI ленты. */
export type VendorPhotoBatch = {
  id: string;
  createdAt: string;
  photos: string[];
};

/**
 * Лента approved-партий фото товаров продавца.
 * Сортировка: сверху самая свежая (по approved_at desc, fallback created_at).
 * Пагинация по ключу `before` (createdAt последней показанной партии).
 *
 * Возвращает фото уже отсортированными по `position` внутри партии,
 * а сами партии — по убыванию даты добавления.
 */
export async function fetchApprovedVendorPhotoBatches(opts: {
  vendorId: string;
  limit?: number;
  /** ISO-строка `created_at` последней показанной партии (для подгрузки далее). */
  before?: string | null;
}): Promise<VendorPhotoBatch[]> {
  const { vendorId, limit = 4, before } = opts;
  if (!vendorId) {
    return [];
  }
  const admin = createAdminClient();
  let q = admin
    .from("vendor_photo_batches")
    .select(
      "id, created_at, approved_at, vendor_photo_batch_items(photo_url, position)",
    )
    .eq("vendor_id", vendorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(20, limit)));

  if (before) {
    q = q.lt("created_at", before);
  }

  const { data, error } = await q;
  if (error) {
    console.error("[fetchApprovedVendorPhotoBatches]", error);
    return [];
  }

  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((row): VendorPhotoBatch | null => {
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : "";
      if (!id) return null;
      const createdAt =
        typeof r.created_at === "string"
          ? r.created_at
          : typeof r.approved_at === "string"
            ? r.approved_at
            : new Date().toISOString();
      const itemsRaw = Array.isArray(r.vendor_photo_batch_items)
        ? (r.vendor_photo_batch_items as unknown[])
        : [];
      const photos = itemsRaw
        .map((it) => {
          const item = it as Record<string, unknown>;
          const url =
            typeof item.photo_url === "string" ? item.photo_url : "";
          const pos =
            typeof item.position === "number" && Number.isFinite(item.position)
              ? item.position
              : 0;
          return url ? { url, pos } : null;
        })
        .filter((x): x is { url: string; pos: number } => x !== null)
        .sort((a, b) => a.pos - b.pos)
        .map((x) => x.url);
      if (photos.length === 0) return null;
      return { id, createdAt, photos };
    })
    .filter((x): x is VendorPhotoBatch => x !== null);
}

const RECOMMENDED_VENDORS_PROFILE_LIMIT = 6;

async function fetchRecommendedVendorCandidates(opts: {
  excludeSlug: string;
  categoryTokens: string[];
  fetchLimit: number;
}): Promise<PublishedVendorCatalogListRow[]> {
  const admin = createAdminClient();
  let q = admin
    .from("vendors")
    .select(PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS)
    .eq("status", "approved")
    .not("slug", "is", null)
    .neq("slug", opts.excludeSlug)
    .order("created_at", { ascending: false })
    .limit(opts.fetchLimit) as {
    not: (
      column: string,
      operator: string,
      value: string,
    ) => typeof q;
    overlaps: (column: string, value: string[]) => typeof q;
    limit: (count: number) => PromiseLike<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
  };

  if (HIDDEN_PUBLIC_CATALOG_SLUGS.length > 0) {
    q = q.not(
      "slug",
      "in",
      `(${HIDDEN_PUBLIC_CATALOG_SLUGS.map((s) => `"${s}"`).join(",")})`,
    );
  }

  if (opts.categoryTokens.length > 0) {
    q = q.overlaps("categories", opts.categoryTokens);
  }

  const { data, error } = await q.limit(opts.fetchLimit);

  if (error) {
    console.error("[fetchRecommendedVendorCandidates]", error);
    return [];
  }

  return (Array.isArray(data) ? data : [])
    .map((row) => mapPublishedVendorCatalogListRow(row))
    .filter((x): x is PublishedVendorCatalogListRow => x !== null);
}

/**
 * До 6 похожих продавцов для блока перелинковки на странице профиля.
 * Сначала — пересечение категорий, затем добор свежими из каталога.
 */
export async function fetchRecommendedVendorsForProfile(
  vendor: Pick<PublishedVendorRow, "slug" | "categories">,
  limit = RECOMMENDED_VENDORS_PROFILE_LIMIT,
): Promise<PublishedVendorCatalogListRow[]> {
  const categoryTokens = catalogCategoryOverlapTokens(vendor.categories);
  const picked: PublishedVendorCatalogListRow[] = [];
  const seenSlugs = new Set<string>([vendor.slug]);

  if (categoryTokens.length > 0) {
    const related = await fetchRecommendedVendorCandidates({
      excludeSlug: vendor.slug,
      categoryTokens,
      fetchLimit: limit * 3,
    });
    for (const row of related) {
      if (picked.length >= limit) break;
      if (seenSlugs.has(row.slug)) continue;
      seenSlugs.add(row.slug);
      picked.push(row);
    }
  }

  if (picked.length < limit) {
    const fallback = await fetchRecommendedVendorCandidates({
      excludeSlug: vendor.slug,
      categoryTokens: [],
      fetchLimit: limit * 4,
    });
    for (const row of fallback) {
      if (picked.length >= limit) break;
      if (seenSlugs.has(row.slug)) continue;
      seenSlugs.add(row.slug);
      picked.push(row);
    }
  }

  return picked.slice(0, limit);
}

/** Один опубликованный продавец по SEO slug для страницы `/catalog/{slug}`. */
export async function fetchPublishedVendorBySlug(
  slug: string,
): Promise<PublishedVendorRow | null> {
  if (isHiddenFromPublicCatalogSlug(slug)) {
    return null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select(PUBLISHED_VENDOR_PROFILE_SELECT_FIELDS)
    .eq("status", "approved")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[fetchPublishedVendorBySlug]", error);
    return null;
  }

  const row = data ? normalizePublishedVendorRow(data) : null;
  if (!row) {
    return null;
  }
  if (isBlockedPublicCatalogStoreName(row.store_name)) {
    return null;
  }
  return row;
}

/** Форма данных для рендера в `<CatalogCard />` из `CatalogBrowseLayout`. */
export type CatalogCardSourceRow = {
  id: string;
  slug: string | undefined;
  href: string | undefined;
  /** Localized SEO category page for the vendor's primary main category. */
  categoryHref?: string;
  /** Нормализованные поля карточки (каталог / превью админки). */
  display: ParsedVendorCardData;
  photoUrls: string[] | undefined;
  leadVideo?: CatalogLeadVideo;
  productVideos?: string[];
  featured: boolean;
  /** Локализованная строка «Добавлено …» — рассчитывается в layout. */
  addedLine: string;
  /** Локализованная строка «Обновлено сегодня» — рассчитывается в layout. */
  updatedLine: string;
};

export type { ParsedVendorCardData, VendorCardCommerceCopy, VendorTradeType } from "@/lib/catalog/vendor-card-display";

/**
 * Маппер `PublishedVendorRow → CatalogCardSourceRow` (форма как у `previewRow` в `CatalogBrowseLayout`).
 * При наличии `parsed_ai_data.display` от ИИ — описание, подзаголовок, тип сделки и commerce берутся оттуда;
 * При заглушке `store_name` и поле `catalogBrandName` в снимке ИИ — витринный заголовок из ИИ (без ника Instagram).
 * Логотип, категории, фото и ссылка Instagram — из колонок БД.
 */
export function vendorToCatalogCardSource(opts: {
  vendor: PublishedVendorRow | PublishedVendorCatalogListRow;
  fallbackTitle: string;
  addedLine: string;
  updatedLine: string;
}): CatalogCardSourceRow {
  const { vendor, fallbackTitle, addedLine, updatedLine } = opts;
  const ai = getAiCatalogDisplayOverlay(vendor.parsed_ai_data);
  const photoUrls =
    vendor.product_photos.length > 0 ? vendor.product_photos : undefined;
  const leadVideo = leadVideoFromProductVideos({
    productVideos: vendor.product_videos,
    posterUrl: vendor.product_photos[0],
  });

  const { storeTitle, catalogBrandName } = resolveCatalogStoreTitleForCard({
    dbStoreName: vendor.store_name?.trim() ?? "",
    fallbackTitle,
    catalogBrandNameFromAi: ai?.catalogBrandName,
    instagramProfileUrl: null,
  });
  const subtitle = dedupeCatalogSubtitle(storeTitle, ai?.subtitle ?? null);

  const display: ParsedVendorCardData = {
    storeTitle,
    catalogBrandName,
    subtitle,
    description: ai?.description?.trim() ?? "",
    tradeType: ai?.tradeType ?? inferVendorTradeType(vendor),
    commerce: ai ? ai.commerce : commerceCopyFromVendorRow(vendor),
    logoUrl: vendor.logo_url,
    categories: vendor.categories,
    instagramUrl: null,
  };
  return {
    id: vendor.id,
    slug: vendor.slug,
    href: `/catalog/${vendor.slug}`,
    display,
    photoUrls,
    leadVideo,
    productVideos:
      vendor.product_videos && vendor.product_videos.length > 0
        ? vendor.product_videos
        : undefined,
    featured: false,
    addedLine,
    updatedLine,
  };
}

/**
 * Одна строка карточки каталога для опубликованного вендора — та же логика, что в сетке `/catalog`
 * (ИИ `parsed_ai_data`, витринные slug-и, i18n категорий).
 */
export function buildCatalogCardSourceRowForPublishedVendor(
  vendor: PublishedVendorRow | PublishedVendorCatalogListRow,
  opts: {
    tBrowse: CatalogBrowseT;
    tTreeCategory: (key: string) => string;
    locale: string;
  },
): CatalogCardSourceRow {
  const { tBrowse, tTreeCategory, locale } = opts;
  const addedLine = tBrowse("listingAdded", {
    date: formatProviderAddedDate(vendor.created_at, locale),
  });
  const updatedLine = tBrowse("listingUpdated", {
    relative: formatListingUpdatedToday(locale),
  });
  const categoryHref = resolveSeoCategoryHrefForVendorCategories(
    vendor.categories,
    locale as RouteLocale,
  );
  const row = vendorToCatalogCardSource({
    vendor,
    fallbackTitle: tBrowse("fallbackStoreTitle"),
    addedLine,
    updatedLine,
  });
  const subtitleFallback = inferCatalogCardSubtitleFallback(
    vendor.categories,
    (id) => tTreeCategory(`main.${id}`),
  );
  const subtitle =
    row.display.subtitle?.trim() ||
    dedupeCatalogSubtitle(row.display.storeTitle, subtitleFallback);
  const showcase = getShowcaseCatalogFields(vendor.slug, tBrowse);
  if (showcase) {
    return {
      ...row,
      categoryHref,
      display: {
        ...row.display,
        storeTitle: showcase.title,
        description: showcase.description,
        categories: showcase.categories,
        subtitle,
      },
    };
  }
  return {
    ...row,
    categoryHref,
    display: {
      ...row.display,
      subtitle,
      categories: localizedMainCategoryLabels(vendor.categories, (id) =>
        tTreeCategory(`main.${id}`),
      ),
    },
  };
}
