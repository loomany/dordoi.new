/**
 * Обогащение vendors данными из выгрузки Instagram profile scraper (JSON-массив).
 *
 *   npm run sync:instagram -- --dry-run=true --file=dataset_instagram-profile-scraper_2026-05-12_21-16-51-843.json
 *
 * Требует в .env.local: NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.
 * Перед продом примените миграцию 20260514120000_vendors_instagram_enrichment.sql.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  INSTAGRAM_PROFILE_IMPORT_SOURCE,
  buildInstagramLocationModerationAppend,
  canonicalInstagramUsernameFromUrl,
  catalogShortDescriptionFromBiography,
  collectExternalUrlStrings,
  detectDeliveryInText,
  extractProductPhotoUrls,
  extractProductVideoUrls,
  extractWhatsappDigitsFromProfile,
  isPlaceholderMinBatch,
  mergeModerationNoteAppend,
  pickLogoUrl,
  suggestMinBatchFromBiography,
  type InstagramProfileRow,
} from "@/lib/vendor/instagram-profile-sync";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

type VendorInstagramRow = {
  id: string;
  instagram_url: string | null;
  logo_url: string | null;
  location_row: string | null;
  min_batch: string | null;
  whatsapp_1: string | null;
  delivery_help: boolean;
  description: string | null;
  description_detail: string | null;
  moderation_note: string | null;
};

function loadEnvLocal() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseArgs() {
  const raw: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) raw[a.slice(2, eq)] = a.slice(eq + 1);
  }
  const file =
    raw.file?.trim() ||
    "dataset_instagram-profile-scraper_2026-05-12_21-16-51-843.json";
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  const archiveOldDescription =
    (raw["archive-old-description-to-note"] ?? "false").trim().toLowerCase() ===
    "true";
  const forceTerms =
    (raw["force-terms"] ?? "false").trim().toLowerCase() === "true";
  const limitRaw = raw.limit?.trim();
  const limit =
    limitRaw && /^\d+$/.test(limitRaw) ? Math.min(100_000, parseInt(limitRaw, 10)) : null;
  return { file, dryRun, archiveOldDescription, forceTerms, limit };
}

async function fetchAllVendorsWithInstagram(
  admin: ReturnType<typeof createAdminClient>,
): Promise<VendorInstagramRow[]> {
  const pageSize = 1000;
  const out: VendorInstagramRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendors")
      .select(
        "id, instagram_url, logo_url, location_row, min_batch, whatsapp_1, delivery_help, description, description_detail, moderation_note",
      )
      .not("instagram_url", "is", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("[sync-instagram] fetch vendors:", error.message);
      process.exit(1);
    }
    const rows = (data ?? []) as VendorInstagramRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

function buildVendorMapByInstagramUsername(
  rows: VendorInstagramRow[],
): Map<string, VendorInstagramRow> {
  const map = new Map<string, VendorInstagramRow>();
  for (const r of rows) {
    const key = canonicalInstagramUsernameFromUrl(r.instagram_url ?? "");
    if (!key) continue;
    if (map.has(key)) {
      continue;
    }
    map.set(key, r);
  }
  return map;
}

function shouldArchiveDescription(desc: string | null | undefined): boolean {
  const t = desc ?? "";
  if (!t.trim()) return false;
  const lower = t.toLowerCase();
  return (
    lower.includes("2gis") ||
    lower.includes("импорт из выгрузки") ||
    lower.includes("импорт из")
  );
}

async function main() {
  loadEnvLocal();
  const { file, dryRun, archiveOldDescription, forceTerms, limit } = parseArgs();
  const path = join(root, file);
  if (!existsSync(path)) {
    console.error("Файл не найден:", path);
    process.exit(1);
  }

  const rawJson = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!Array.isArray(rawJson)) {
    console.error("Ожидался JSON-массив записей Instagram.");
    process.exit(1);
  }
  const profiles = rawJson as InstagramProfileRow[];
  const sliced = limit != null ? profiles.slice(0, limit) : profiles;

  const admin = createAdminClient();
  const vendorRows = await fetchAllVendorsWithInstagram(admin);
  const vendorByIg = buildVendorMapByInstagramUsername(vendorRows);

  let matched = 0;
  let logosUpdated = 0;
  let wholesaleUpdates = 0;
  let deliveryUpdates = 0;
  let videoUrlsTotal = 0;
  let invalidInputUrl = 0;
  let noVendorForUsername = 0;
  let errors = 0;
  let batchesReplaced = 0;

  for (const row of sliced) {
    const igKey = canonicalInstagramUsernameFromUrl(row.inputUrl ?? "");
    if (!igKey) {
      invalidInputUrl += 1;
      continue;
    }
    const vendor = vendorByIg.get(igKey);
    if (!vendor) {
      noVendorForUsername += 1;
      continue;
    }
    matched += 1;

    const biography = row.biography?.trim() ?? "";
    const urlsText = collectExternalUrlStrings(row).join("\n");
    const squeezeHaystack = `${biography}\n${urlsText}`.trim();

    const logoUrl = pickLogoUrl(row);
    const photoUrls = extractProductPhotoUrls(row.latestPosts ?? undefined);
    const videoUrls = extractProductVideoUrls(row.latestPosts ?? undefined);
    videoUrlsTotal += videoUrls.length;

    const shortDesc = catalogShortDescriptionFromBiography(biography || null);
    const suggestMin = suggestMinBatchFromBiography(biography || null);
    const deliveryHit =
      squeezeHaystack.length > 0 && detectDeliveryInText(squeezeHaystack);

    if (logoUrl) {
      logosUpdated += 1;
    }

    let minBatchNext: string | null = null;
    if (forceTerms && suggestMin) {
      minBatchNext = suggestMin;
      wholesaleUpdates += 1;
    } else if (suggestMin && isPlaceholderMinBatch(vendor.min_batch)) {
      minBatchNext = suggestMin;
      wholesaleUpdates += 1;
    }

    let deliveryHelpNext: boolean | undefined;
    if (deliveryHit && !vendor.delivery_help) {
      deliveryHelpNext = true;
      deliveryUpdates += 1;
    }

    const waDigits = extractWhatsappDigitsFromProfile(row);
    let whatsappNext: string | null | undefined;
    if (!vendor.whatsapp_1?.trim() && waDigits) {
      whatsappNext = waDigits;
    }

    let moderationNoteNext = vendor.moderation_note;
    const locAppend = buildInstagramLocationModerationAppend({
      posts: row.latestPosts ?? undefined,
      locationRow: vendor.location_row,
    });
    if (locAppend) {
      moderationNoteNext = mergeModerationNoteAppend(moderationNoteNext, locAppend);
    }

    let descriptionNext = shortDesc ?? vendor.description;
    const detailNext =
      biography.length > 0 ? biography : vendor.description_detail;

    if (archiveOldDescription && vendor.description && shouldArchiveDescription(vendor.description)) {
      const snippet = vendor.description.trim().slice(0, 3500);
      const archiveLine = `[Архив описания до Instagram-синхронизации]\n${snippet}${vendor.description.trim().length > 3500 ? "…" : ""}`;
      moderationNoteNext = mergeModerationNoteAppend(moderationNoteNext, archiveLine);
    }

    const vendorUpdate: Record<string, unknown> = {
      logo_url: logoUrl ?? vendor.logo_url,
      description: descriptionNext,
      description_detail: detailNext,
      followers_count: typeof row.followersCount === "number" ? row.followersCount : null,
      product_photos: photoUrls,
      product_videos: videoUrls,
    };

    if (minBatchNext != null) {
      vendorUpdate.min_batch = minBatchNext;
    }
    if (deliveryHelpNext === true) {
      vendorUpdate.delivery_help = true;
    }
    if (whatsappNext != null) {
      vendorUpdate.whatsapp_1 = whatsappNext;
    }
    if (moderationNoteNext !== vendor.moderation_note) {
      vendorUpdate.moderation_note = moderationNoteNext;
    }

    if (dryRun) {
      continue;
    }

    const { error: delErr } = await admin
      .from("vendor_photo_batches")
      .delete()
      .eq("vendor_id", vendor.id)
      .eq("import_source", INSTAGRAM_PROFILE_IMPORT_SOURCE);
    if (delErr) {
      console.error("[sync-instagram] delete batches", vendor.id, delErr.message);
      errors += 1;
      continue;
    }

    const nowIso = new Date().toISOString();

    if (photoUrls.length > 0) {
      const { data: batchRow, error: batchErr } = await admin
        .from("vendor_photo_batches")
        .insert({
          vendor_id: vendor.id,
          status: "approved",
          import_source: INSTAGRAM_PROFILE_IMPORT_SOURCE,
          created_at: nowIso,
          approved_at: nowIso,
        })
        .select("id")
        .single();

      if (batchErr || !batchRow?.id) {
        console.error("[sync-instagram] insert batch", vendor.id, batchErr?.message);
        errors += 1;
        continue;
      }
      const batchId = batchRow.id as string;
      batchesReplaced += 1;

      const items = photoUrls.map((url, i) => ({
        batch_id: batchId,
        photo_url: url,
        position: i + 1,
        created_at: nowIso,
      }));
      const { error: itemsErr } = await admin.from("vendor_photo_batch_items").insert(items);
      if (itemsErr) {
        console.error("[sync-instagram] insert items", vendor.id, itemsErr.message);
        errors += 1;
        continue;
      }
    }

    const { error: updErr } = await admin
      .from("vendors")
      .update(vendorUpdate)
      .eq("id", vendor.id);
    if (updErr) {
      console.error("[sync-instagram] update vendor", vendor.id, updErr.message);
      errors += 1;
    }
  }

  console.log("\n=== sync-instagram-profiles ===\n");
  console.log(`Файл: ${path}`);
  console.log(`dry-run: ${dryRun}`);
  console.log(`archive-old-description-to-note: ${archiveOldDescription}`);
  console.log(`force-terms: ${forceTerms}`);
  console.log(`Записей в JSON: ${sliced.length}`);
  console.log(`Продавцов в БД с instagram_url: ${vendorRows.length}`);
  console.log(`Сопоставлено с vendor: ${matched}`);
  console.log(`Обновлено/назначено логотипов (есть URL в выгрузке): ${logosUpdated}`);
  console.log(`Обновлений min_batch (опт из био): ${wholesaleUpdates}`);
  console.log(`Включён delivery_help: ${deliveryUpdates}`);
  console.log(`Всего video URL в product_videos (сумма по строкам): ${videoUrlsTotal}`);
  console.log(`Некорректный inputUrl: ${invalidInputUrl}`);
  console.log(`Нет vendor по username: ${noVendorForUsername}`);
  if (!dryRun) {
    console.log(`Партий Instagram пересоздано: ${batchesReplaced}`);
    console.log(`Ошибок Supabase: ${errors}`);
  } else {
    console.log("\n(dry-run: в БД не писали)\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
