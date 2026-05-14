/**
 * Аудит очереди «Ожидают решения»: почему магазины не в каталоге.
 *   npx tsx scripts/audit-admin-pending-queue.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

type Row = {
  id: string;
  store_name: string | null;
  status: string;
  application_source: string | null;
  slug: string | null;
  seo_slug: string | null;
  approved_at: string | null;
  categories: string[] | null;
  logo_url: string | null;
  product_photos: string[] | null;
  product_videos: string[] | null;
  instagram_url: string | null;
  telegram_url: string | null;
  whatsapp_1: string | null;
  phone_number: string | null;
  description: string | null;
  google_place_id: string | null;
  google_maps_uri: string | null;
  location_row: string | null;
  moderation_note: string | null;
  created_at: string;
};

function digitsOnly(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

function storageHit(u: string | null | undefined, bucket: string): boolean {
  const s = u?.trim() ?? "";
  return s.includes(`/storage/v1/object/public/${bucket}/`);
}

function hasAnyPhoto(row: Row): boolean {
  if (row.logo_url?.trim()) return true;
  return (row.product_photos ?? []).some((p) => p?.trim());
}

function hasStorageMedia(row: Row, bucket = "vendor-media"): boolean {
  if (storageHit(row.logo_url, bucket)) return true;
  return (row.product_photos ?? []).some((p) => storageHit(p, bucket));
}

function hasLogoAndPhotoOnStorage(row: Row, bucket = "vendor-media"): boolean {
  if (!storageHit(row.logo_url, bucket)) return false;
  return (row.product_photos ?? []).some((p) => storageHit(p, bucket));
}

function externalOnlyMedia(row: Row): boolean {
  return hasAnyPhoto(row) && !hasStorageMedia(row);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select(
    "id, store_name, status, application_source, slug, seo_slug, approved_at, categories, logo_url, product_photos, product_videos, instagram_url, telegram_url, whatsapp_1, phone_number, description, google_place_id, google_maps_uri, location_row, moderation_note, created_at",
  )
  .in("status", ["pending_moderation", "pending_review"])
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

const rows = (data ?? []) as Row[];

const stats = {
  total: rows.length,
  pending_moderation: 0,
  pending_review: 0,
  google_places: 0,
  telegram: 0,
  other_source: 0,
  no_slug: 0,
  no_seo_slug: 0,
  no_categories: 0,
  no_phone_whatsapp: 0,
  no_instagram: 0,
  no_telegram: 0,
  no_any_media: 0,
  external_media_only: 0,
  storage_media: 0,
  logo_and_photo_storage: 0,
  no_description: 0,
  no_location_row: 0,
  no_google_maps: 0,
};

const blockers: Record<string, number> = {
  "status_not_approved": rows.length,
  "no_slug (required for /catalog)": 0,
  "google_places_never_auto_published": 0,
  "no_admin_approve_yet": rows.length,
  "weak_media_for_bulk_publish_script": 0,
  "no_contact_channel": 0,
  "no_categories_assigned": 0,
};

for (const r of rows) {
  if (r.status === "pending_moderation") stats.pending_moderation++;
  if (r.status === "pending_review") stats.pending_review++;

  const src = r.application_source ?? "(null)";
  if (src === "google_places") stats.google_places++;
  else if (src === "telegram") stats.telegram++;
  else stats.other_source++;

  if (!r.slug?.trim()) stats.no_slug++;
  if (!r.seo_slug?.trim()) stats.no_seo_slug++;
  if (!r.categories?.length) stats.no_categories++;

  const phone = digitsOnly(r.phone_number);
  const wa = digitsOnly(r.whatsapp_1);
  if (phone.length < 8 && wa.length < 8) stats.no_phone_whatsapp++;
  if (!r.instagram_url?.trim()) stats.no_instagram++;
  if (!r.telegram_url?.trim()) stats.no_telegram++;

  if (!hasAnyPhoto(r)) stats.no_any_media++;
  else if (externalOnlyMedia(r)) stats.external_media_only++;
  if (hasStorageMedia(r)) stats.storage_media++;
  if (hasLogoAndPhotoOnStorage(r)) stats.logo_and_photo_storage++;

  if (!r.description?.trim()) stats.no_description++;
  if (!r.location_row?.trim()) stats.no_location_row++;
  if (!r.google_maps_uri?.trim()) stats.no_google_maps++;

  if (!r.slug?.trim()) blockers["no_slug (required for /catalog)"]++;
  if (src === "google_places") blockers["google_places_never_auto_published"]++;
  if (!hasLogoAndPhotoOnStorage(r)) blockers["weak_media_for_bulk_publish_script"]++;
  if (phone.length < 8 && wa.length < 8 && !r.instagram_url?.trim() && !r.telegram_url?.trim()) {
    blockers["no_contact_channel"]++;
  }
  if (!r.categories?.length) blockers["no_categories_assigned"]++;
}

console.log("=== Аудит очереди «Ожидают решения» ===\n");
console.log("Всего в очереди:", stats.total);
console.log("");

console.log("--- Статус ---");
console.log("  pending_moderation:", stats.pending_moderation);
console.log("  pending_review:", stats.pending_review);
console.log("");

console.log("--- Источник заявки ---");
console.log("  google_places:", stats.google_places);
console.log("  telegram:", stats.telegram);
console.log("  другое:", stats.other_source);
console.log("");

console.log("--- Почему НЕ в публичном каталоге (технически) ---");
console.log("  Каталог: только status=approved + slug IS NOT NULL");
console.log("  Все в очереди: status pending → не попадают в SELECT каталога");
console.log("  Без slug:", stats.no_slug, `(${stats.total ? Math.round((stats.no_slug / stats.total) * 100) : 0}%)`);
console.log("  Без seo_slug:", stats.no_seo_slug);
console.log("");

console.log("--- Качество карточки (готовность к публикации) ---");
console.log("  Нет категорий:", stats.no_categories);
console.log("  Нет телефона и WhatsApp:", stats.no_phone_whatsapp);
console.log("  Нет Instagram:", stats.no_instagram);
console.log("  Нет Telegram:", stats.no_telegram);
console.log("  Нет фото/логотипа вообще:", stats.no_any_media);
console.log("  Медиа только внешние (не vendor-media Storage):", stats.external_media_only);
console.log("  Есть медиа на Storage:", stats.storage_media);
console.log("  Логотип + фото на Storage (скрипт массовой публикации):", stats.logo_and_photo_storage);
console.log("  Нет описания:", stats.no_description);
console.log("  Нет location_row:", stats.no_location_row);
console.log("  Нет google_maps_uri:", stats.no_google_maps);
console.log("");

console.log("--- Блокеры (пересекаются) ---");
for (const [k, v] of Object.entries(blockers).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log("");

// Readiness tiers
let readyForManualApprove = 0;
let needsMediaWork = 0;
let needsCategory = 0;
for (const r of rows) {
  const hasCat = Boolean(r.categories?.length);
  const hasContact =
    digitsOnly(r.phone_number).length >= 8 ||
    digitsOnly(r.whatsapp_1).length >= 8 ||
    Boolean(r.instagram_url?.trim());
  const hasMedia = hasAnyPhoto(r);
  if (hasCat && hasContact && hasMedia) readyForManualApprove++;
  if (!hasMedia) needsMediaWork++;
  if (!hasCat) needsCategory++;
}

console.log("--- Оценка готовности ---");
console.log("  Можно рассматривать к ручному approve (категория + контакт + любое фото):", readyForManualApprove);
console.log("  Нужны медиа:", needsMediaWork);
console.log("  Нужна категория:", needsCategory);
console.log("");

// Sample rows by problem type
function printSamples(label: string, filter: (r: Row) => boolean, limit = 8) {
  const sample = rows.filter(filter).slice(0, limit);
  if (!sample.length) return;
  console.log(`--- Примеры: ${label} (до ${limit}) ---`);
  for (const r of sample) {
    const photos = (r.product_photos ?? []).length;
    console.log(
      `  ${r.store_name ?? "—"} | ${r.status} | cat=${r.categories?.[0] ?? "—"} | ig=${r.instagram_url ? "yes" : "no"} | photos=${photos} | storage=${hasStorageMedia(r) ? "yes" : "no"}`,
    );
  }
  console.log("");
}

printSamples("нет медиа", (r) => !hasAnyPhoto(r));
printSamples("медиа только внешние (Google/IG CDN)", externalOnlyMedia);
printSamples("нет категории", (r) => !r.categories?.length);
printSamples("нет контактов", (r) => {
  const phone = digitsOnly(r.phone_number);
  const wa = digitsOnly(r.whatsapp_1);
  return phone.length < 8 && wa.length < 8 && !r.instagram_url?.trim() && !r.telegram_url?.trim();
});
printSamples("готовы к ручной модерации", (r) => {
  const hasCat = Boolean(r.categories?.length);
  const hasContact =
    digitsOnly(r.phone_number).length >= 8 ||
    digitsOnly(r.whatsapp_1).length >= 8 ||
    Boolean(r.instagram_url?.trim());
  return hasCat && hasContact && hasAnyPhoto(r);
});

console.log("--- Вывод ---");
console.log(
  "1. Главная причина: админ ещё не нажал «Одобрить» (status=pending_review).",
);
console.log(
  "2. Даже после approve у google_places код НЕ выдаёт slug автоматически — без slug каталог пустой.",
);
console.log(
  "3. Массовый скрипт publish-vendors-with-storage-media.ts требует логотип+фото на Storage — у большинства Google Places этого нет.",
);
console.log(
  "4. Это отдельный пайплайн от Instagram/Telegram: те попадали через sync-instagram + approve со slug.",
);

const catCounts = new Map<string, number>();
let withLogo = 0;
let withProductPhotos = 0;
for (const r of rows) {
  const c = r.categories?.[0] ?? "(none)";
  catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  if (r.logo_url?.trim()) withLogo++;
  if ((r.product_photos ?? []).some((p) => p?.trim())) withProductPhotos++;
}
console.log("");
console.log("--- Категории в очереди ---");
for (const [c, n] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c}: ${n}`);
}
console.log("");
console.log("Логотип (logo_url):", withLogo);
console.log("Фото товаров (product_photos[]):", withProductPhotos);

const { count: approvedGp } = await sb
  .from("vendors")
  .select("id", { count: "exact", head: true })
  .eq("status", "approved")
  .eq("application_source", "google_places");
const { count: approvedGpNoSlug } = await sb
  .from("vendors")
  .select("id", { count: "exact", head: true })
  .eq("status", "approved")
  .eq("application_source", "google_places")
  .is("slug", null);
console.log("");
console.log("Уже approved с source=google_places:", approvedGp ?? 0);
console.log("Из них без slug (невидимы в каталоге):", approvedGpNoSlug ?? 0);
