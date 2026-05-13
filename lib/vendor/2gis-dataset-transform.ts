import { digitsOnly } from "@/lib/phone";
import { mapTwoGisRubricsToSiteCategories } from "@/lib/vendor/2gis-dataset-category-map";
import {
  VENDOR_MOQ_DEFAULT_RU,
  VENDOR_PAYMENT_DEFAULT_RU,
  VENDOR_RETURNS_DEFAULT_RU,
} from "@/lib/vendor/vendor-payment-display";

const MODERATION_NOTE =
  "Импорт из выгрузки 2GIS. Проверьте контакты и категорию перед публикацией.";

/** Минимальная строка датасета (расширяйте при появлении полей в JSON). */
export type TwoGisDatasetRow = {
  title: string;
  address?: string | null;
  url: string;
  category?: string;
  rubrics?: string[];
  mainPhotoUrl?: string | null;
  shortName?: string | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  socials?: {
    instagram?: string | string[] | null;
    whatsapp?: string | string[] | null;
    telegram?: string | string[] | null;
    /** Иногда Instagram попадает сюда (выгрузка 2GIS). */
    other?: string[] | null;
  };
  phoneValue?: string | string[] | number | null;
  location?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  } | null;
};

export type TwoGisVendorInsert = {
  store_name: string;
  location_row: string;
  description: string;
  description_detail: string | null;
  categories: string[];
  min_batch: string;
  payment_methods: string;
  delivery_help: boolean;
  returns_policy: string;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  samples_available: boolean;
  samples_note: string | null;
  language: "ru";
  status: "pending_review";
  application_source: "google_places";
  google_place_id: string;
  google_maps_uri: string | null;
  moderation_note: string;
  quality_flags: string[] | null;
  quality_note: string | null;
  telegram_chat_id: number | null;
  phone_number: string | null;
  product_photos: string[];
  logo_url: string | null;
  container_photo_url: string | null;
  user_id: string | null;
};

export function extractFirmIdFromTwoGisUrl(url: string): string | null {
  const m = url.trim().match(/\/firm\/(\d+)/);
  return m?.[1] ?? null;
}

function trimOrNull(s: string | null | undefined): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : null;
}

/** Первое непустое значение: строка или элемент массива (как в расширенной выгрузке 2GIS). */
function firstSocialScalar(
  v: string | string[] | number | null | undefined,
): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const t =
        typeof item === "string"
          ? trimOrNull(item)
          : typeof item === "number" && Number.isFinite(item)
            ? trimOrNull(String(item))
            : null;
      if (t) return t;
    }
    return null;
  }
  if (typeof v === "number") return trimOrNull(String(v));
  if (typeof v === "string") return trimOrNull(v);
  return null;
}

function extractInstagramFromOther(other: string[] | null | undefined): string | null {
  if (!other?.length) return null;
  for (const u of other) {
    const t = trimOrNull(u);
    if (t && /instagram\.com/i.test(t)) return t;
  }
  return null;
}

/** Первый телефон из phoneValue (строка, число или массив строк). */
function firstPhoneRaw(row: TwoGisDatasetRow): string | null {
  return firstSocialScalar(row.phoneValue ?? null);
}

function normalizePhoneForVendor(raw: string | null | undefined): string | null {
  const s = raw ?? "";
  const d = digitsOnly(s);
  return d.length >= 8 ? d : trimOrNull(s);
}

function normalizeInstagram(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw);
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const h = t.replace(/^@/, "");
  return `https://instagram.com/${h}`;
}

function normalizeTelegram(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw);
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const h = t.replace(/^@/, "").replace(/^t\.me\//i, "");
  return `https://t.me/${h}`;
}

function normalizeWhatsapp(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw);
  if (!t) return null;
  const d = digitsOnly(t);
  if (d.length >= 8) return d;
  return t;
}

export function rowHasSocialContact(row: TwoGisDatasetRow): boolean {
  const s = row.socials;
  const ig =
    firstSocialScalar(s?.instagram ?? null) ?? extractInstagramFromOther(s?.other);
  return Boolean(
    ig ||
      firstSocialScalar(s?.whatsapp ?? null) ||
      firstSocialScalar(s?.telegram ?? null) ||
      normalizePhoneForVendor(firstPhoneRaw(row)),
  );
}

function buildDescriptionMeta(row: TwoGisDatasetRow, siteCategories: string[]) {
  const lat = row.location?.lat ?? row.location?.latitude ?? null;
  const lng = row.location?.lng ?? row.location?.longitude ?? null;
  return {
    source: "2gis",
    twoGisUrl: row.url,
    twoGisCategory: row.category ?? null,
    twoGisRubrics: row.rubrics ?? [],
    siteCategories,
    coordinates:
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
        ? { lat, lng }
        : null,
    totalScore: row.totalScore ?? null,
    reviewsCount: row.reviewsCount ?? null,
  };
}

/**
 * Преобразует строку 2GIS в объект для insert в `vendors` (pending_review, application_source google_places, google_place_id = 2gis:{firmId}).
 * Возвращает null, если нет firm id в URL или нет маппинга категорий.
 */
export function transformTwoGisRowToVendorInsert(
  row: TwoGisDatasetRow,
): TwoGisVendorInsert | null {
  const firmId = extractFirmIdFromTwoGisUrl(row.url);
  if (!firmId) return null;

  const siteCategories = mapTwoGisRubricsToSiteCategories(
    row.rubrics,
    row.category,
  );
  if (!siteCategories || siteCategories.length === 0) return null;

  const storeName = trimOrNull(row.title) ?? "Без названия";
  const address = trimOrNull(row.address);
  const meta = buildDescriptionMeta(row, siteCategories);
  const description = `${MODERATION_NOTE}\n\n${JSON.stringify(meta, null, 2)}`;

  const waRaw = row.socials?.whatsapp;
  const wa1 = normalizeWhatsapp(firstSocialScalar(waRaw ?? null));
  const waSecond =
    Array.isArray(waRaw) && waRaw.length > 1
      ? normalizeWhatsapp(trimOrNull(waRaw[1]))
      : null;
  const igRaw =
    firstSocialScalar(row.socials?.instagram ?? null) ??
    extractInstagramFromOther(row.socials?.other);
  const ig = normalizeInstagram(igRaw);
  const tg = normalizeTelegram(firstSocialScalar(row.socials?.telegram ?? null));
  const phone = normalizePhoneForVendor(firstPhoneRaw(row));

  return {
    store_name: storeName,
    location_row: address ?? "—",
    description,
    description_detail: null,
    categories: siteCategories,
    min_batch: VENDOR_MOQ_DEFAULT_RU,
    payment_methods: VENDOR_PAYMENT_DEFAULT_RU,
    delivery_help: false,
    returns_policy: VENDOR_RETURNS_DEFAULT_RU,
    whatsapp_1: wa1,
    whatsapp_2: waSecond,
    instagram_url: ig,
    telegram_url: tg,
    samples_available: false,
    samples_note: null,
    language: "ru",
    status: "pending_review",
    application_source: "google_places",
    google_place_id: `2gis:${firmId}`,
    google_maps_uri: null,
    moderation_note: MODERATION_NOTE,
    quality_flags: null,
    quality_note: null,
    telegram_chat_id: null,
    phone_number: phone,
    product_photos: [],
    logo_url: trimOrNull(row.mainPhotoUrl ?? null),
    container_photo_url: null,
    user_id: null,
  };
}
