import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

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
  samples_available?: boolean;
  samples_note?: string | null;
  returns_policy?: string | null;
  created_at: string;
};

/** Публичный каталог не показывает эти витрины (нормализация: trim + lower case). */
const BLOCKED_CATALOG_STORE_NAMES = new Set(["cosmos"]);

function isBlockedPublicCatalogStoreName(
  storeName: string | null | undefined,
): boolean {
  const key =
    typeof storeName === "string" ? storeName.trim().toLowerCase() : "";
  return key.length > 0 && BLOCKED_CATALOG_STORE_NAMES.has(key);
}

const PUBLISHED_VENDOR_SELECT_FIELDS =
  "id, slug, store_name, description, categories, logo_url, product_photos, location_row, created_at";

const PUBLISHED_VENDOR_PROFILE_SELECT_FIELDS =
  "id, slug, store_name, description, description_detail, categories, logo_url, container_photo_url, product_photos, location_row, phone_number, min_batch, payment_methods, delivery_help, whatsapp_1, whatsapp_2, instagram_url, telegram_url, samples_available, samples_note, returns_policy, created_at";

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
      if (!slug) {
        return null;
      }
      const id = typeof r.id === "string" ? r.id : "";
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
        location_row:
          typeof r.location_row === "string" ? r.location_row : null,
        created_at:
          typeof r.created_at === "string"
            ? r.created_at
            : new Date().toISOString(),
      };
    })
    .filter((x): x is PublishedVendorRow => x !== null);
}

function normalizePublishedVendorRow(row: unknown): PublishedVendorRow | null {
  const r = row as Record<string, unknown>;
  const slug = typeof r.slug === "string" ? r.slug.trim() : "";
  if (!slug) {
    return null;
  }
  const id = typeof r.id === "string" ? r.id : "";
  if (!id) {
    return null;
  }
  const cats = Array.isArray(r.categories)
    ? (r.categories as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const photos = Array.isArray(r.product_photos)
    ? (r.product_photos as unknown[]).filter((x): x is string => typeof x === "string")
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
    samples_available: Boolean(r.samples_available),
    samples_note: typeof r.samples_note === "string" ? r.samples_note : null,
    returns_policy:
      typeof r.returns_policy === "string" ? r.returns_policy : null,
    created_at:
      typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
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

/** Один опубликованный продавец по SEO slug для страницы `/catalog/{slug}`. */
export async function fetchPublishedVendorBySlug(
  slug: string,
): Promise<PublishedVendorRow | null> {
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
  title: string;
  tagline: string | null;
  description: string;
  categories: string[];
  avatarUrl: string | null;
  hideAvatar: boolean;
  photoUrls: string[] | undefined;
  featured: boolean;
  /** Локализованная строка «Добавлено …» — рассчитывается в layout. */
  addedLine: string;
  /** Локализованная строка «Обновлено сегодня» — рассчитывается в layout. */
  updatedLine: string;
};

/**
 * Маппер `PublishedVendorRow → CatalogCardSourceRow` (форма как у `previewRow` в `CatalogBrowseLayout`).
 * Все поля каталога, отсутствующие в БД, заполняются безопасными дефолтами:
 *  - `featured = false` (одинаковая обводка у всех карточек);
 *  - `tagline = null`;
 *  - `hideAvatar = true` для всех реальных vendor'ов — логотип в карточке каталога
 *    мы намеренно НЕ показываем (больше места под название и описание; логотип
 *    остаётся видимым на странице профиля магазина).
 *  - `location_row` в сетке каталога не показываем — только на странице профиля.
 */
export function vendorToCatalogCardSource(opts: {
  vendor: PublishedVendorRow;
  fallbackTitle: string;
  addedLine: string;
  updatedLine: string;
}): CatalogCardSourceRow {
  const { vendor, fallbackTitle, addedLine, updatedLine } = opts;
  const title = vendor.store_name?.trim() || fallbackTitle;
  const description = vendor.description?.trim() ?? "";
  const photoUrls =
    vendor.product_photos.length > 0 ? vendor.product_photos : undefined;
  return {
    id: vendor.id,
    slug: vendor.slug,
    href: `/catalog/${vendor.slug}`,
    title,
    tagline: null,
    description,
    categories: vendor.categories,
    avatarUrl: vendor.logo_url,
    hideAvatar: true,
    photoUrls,
    featured: false,
    addedLine,
    updatedLine,
  };
}
