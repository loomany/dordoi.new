/**
 * Скачивает изображения с Instagram CDN и заливает в Supabase Storage (vendor-media),
 * затем подменяет URL в vendors (logo_url, product_photos) и vendor_photo_batch_items (photo_url).
 *
 * Бакет `vendor-media` создаётся миграцией supabase/migrations/20250510150000_vendor_media_bucket.sql
 * (public, jpeg/png/webp, до 10 MiB).
 *
 * Требует в .env.local: NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.
 * Опционально: VENDOR_MEDIA_BUCKET (по умолчанию vendor-media).
 *
 * Запуск:
 *   npm run download:instagram-media -- --dry-run=true
 *   npm run download:instagram-media -- --dry-run=false --delay-ms=400
 *   npm run download:instagram-media -- --dry-run=false --limit=50
 *
 * Флаги:
 *   --dry-run=true|false   (по умолчанию true) — без fetch/upload/UPDATE
 *   --delay-ms=N           пауза после каждого успешного скачивания (по умолчанию 350)
 *   --limit=N              обработать не больше N уникальных Instagram-URL
 *   --bucket=name          переопределить бакет
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const IG_HOST_MARKERS = ["instagram.com", "cdninstagram.com", "fbcdn.net"] as const;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
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
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  const delayMs = Math.max(
    0,
    Math.min(60_000, parseInt(raw["delay-ms"] ?? "350", 10) || 350),
  );
  const limitRaw = raw.limit?.trim();
  const limit =
    limitRaw && /^\d+$/.test(limitRaw) ? Math.min(500_000, parseInt(limitRaw, 10)) : null;
  const bucket = (raw.bucket ?? process.env.VENDOR_MEDIA_BUCKET ?? "vendor-media").trim();
  return { dryRun, delayMs, limit, bucket };
}

function isInstagramHostedUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u.startsWith("http://") && !u.startsWith("https://")) return false;
  return IG_HOST_MARKERS.some((m) => u.includes(m));
}

function isOurVendorMediaUrl(url: string, bucket: string): boolean {
  const u = url.trim();
  return u.includes(`/storage/v1/object/public/${bucket}/`);
}

function extFromContentType(ct: string): "jpg" | "png" | "webp" {
  const c = ct.split(";")[0]?.trim().toLowerCase() ?? "";
  if (c === "image/png") return "png";
  if (c === "image/webp") return "webp";
  return "jpg";
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function downloadInstagramImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url.trim(), {
    redirect: "follow",
    headers: BROWSER_HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim() || "";
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(contentType)) {
    return { buffer: buf, contentType };
  }
  const meta = await sharp(buf).metadata();
  const f = meta.format;
  if (f === "png") return { buffer: buf, contentType: "image/png" };
  if (f === "webp") return { buffer: buf, contentType: "image/webp" };
  if (f === "jpeg" || f === "jpg") return { buffer: buf, contentType: "image/jpeg" };
  const jpeg = await sharp(buf).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { buffer: jpeg, contentType: "image/jpeg" };
}

async function normalizeForBucket(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; ext: "jpg" | "png" | "webp"; uploadContentType: string }> {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(contentType)) {
    return {
      buffer,
      ext: extFromContentType(contentType),
      uploadContentType: contentType,
    };
  }
  const jpeg = await sharp(buffer).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { buffer: jpeg, ext: "jpg", uploadContentType: "image/jpeg" };
}

function objectPathForUrl(instagramUrl: string, ext: "jpg" | "png" | "webp"): string {
  const hash = createHash("sha256").update(instagramUrl.trim(), "utf8").digest("hex").slice(0, 28);
  return `imports/instagram-cache/${hash}.${ext}`;
}

type VendorRow = {
  id: string;
  logo_url: string | null;
  product_photos: string[] | null;
};

type BatchItemRow = {
  id: string;
  batch_id: string;
  photo_url: string;
  vendor_id: string;
};

async function fetchAllVendors(admin: ReturnType<typeof createAdminClient>): Promise<VendorRow[]> {
  const pageSize = 1000;
  const out: VendorRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendors")
      .select("id, logo_url, product_photos")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`vendors: ${error.message}`);
    const rows = (data ?? []) as VendorRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

async function fetchAllBatchItems(
  admin: ReturnType<typeof createAdminClient>,
): Promise<BatchItemRow[]> {
  const pageSize = 1000;
  const out: BatchItemRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendor_photo_batch_items")
      .select("id, batch_id, photo_url, vendor_photo_batches!inner(vendor_id)")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`vendor_photo_batch_items: ${error.message}`);
    const raw = (data ?? []) as unknown as Array<
      BatchItemRow & { vendor_photo_batches: { vendor_id: string } }
    >;
    for (const row of raw) {
      out.push({
        id: row.id,
        batch_id: row.batch_id,
        photo_url: row.photo_url,
        vendor_id: row.vendor_photo_batches.vendor_id,
      });
    }
    if (raw.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

async function main() {
  loadEnvLocal();
  const { dryRun, delayMs, limit, bucket } = parseArgs();
  const admin = createAdminClient();

  console.log("\n=== download-instagram-media ===\n");
  console.log(`dry-run: ${dryRun}`);
  console.log(`delay-ms: ${delayMs}`);
  console.log(`bucket: ${bucket}`);
  console.log(`limit (unique URLs): ${limit ?? "none"}\n`);

  const vendors = await fetchAllVendors(admin);
  const items = await fetchAllBatchItems(admin);

  const uniqueUrls = new Set<string>();
  for (const v of vendors) {
    const logo = v.logo_url?.trim();
    if (logo && isInstagramHostedUrl(logo) && !isOurVendorMediaUrl(logo, bucket)) {
      uniqueUrls.add(logo);
    }
    for (const p of v.product_photos ?? []) {
      const u = p?.trim();
      if (u && isInstagramHostedUrl(u) && !isOurVendorMediaUrl(u, bucket)) {
        uniqueUrls.add(u);
      }
    }
  }
  for (const it of items) {
    const u = it.photo_url?.trim();
    if (u && isInstagramHostedUrl(u) && !isOurVendorMediaUrl(u, bucket)) {
      uniqueUrls.add(u);
    }
  }

  const sortedUrls = [...uniqueUrls].sort();
  const toProcess = limit != null ? sortedUrls.slice(0, limit) : sortedUrls;

  console.log(`Уникальных Instagram-URL (ещё не в ${bucket}): ${sortedUrls.length}`);
  console.log(`К обработке в этом запуске: ${toProcess.length}\n`);

  const urlToPublic = new Map<string, string>();
  let downloaded = 0;
  let uploadErrors = 0;
  let downloadErrors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const srcUrl = toProcess[i]!;
    if (dryRun) {
      console.log(`[dry-run] ${i + 1}/${toProcess.length} ${srcUrl.slice(0, 96)}…`);
      continue;
    }

    try {
      const { buffer, contentType } = await downloadInstagramImage(srcUrl);
      const norm = await normalizeForBucket(buffer, contentType);
      const objectPath = objectPathForUrl(srcUrl, norm.ext);

      const { error: upErr } = await admin.storage.from(bucket).upload(objectPath, norm.buffer, {
        contentType: norm.uploadContentType,
        upsert: true,
      });
      if (upErr) {
        console.error(`[upload] ${objectPath}: ${upErr.message}`);
        uploadErrors += 1;
        continue;
      }

      const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
      const publicUrl = data.publicUrl;
      if (!publicUrl) {
        console.error("[upload] getPublicUrl empty", objectPath);
        uploadErrors += 1;
        continue;
      }

      urlToPublic.set(srcUrl, publicUrl);
      downloaded += 1;
      if (downloaded % 25 === 0 || downloaded === 1) {
        console.log(`… загружено ${downloaded}/${toProcess.length}`);
      }
    } catch (e) {
      downloadErrors += 1;
      console.warn(`[skip] ${srcUrl.slice(0, 80)}… — ${e instanceof Error ? e.message : e}`);
    }

    if (delayMs > 0 && i < toProcess.length - 1) {
      await sleep(delayMs);
    }
  }

  if (dryRun) {
    console.log("\n(dry-run: скачивание и UPDATE не выполнялись)\n");
    return;
  }

  let vendorsUpdated = 0;
  let itemsUpdated = 0;
  let dbErrors = 0;

  for (const v of vendors) {
    let logoNext = v.logo_url;
    const logoT = v.logo_url?.trim();
    if (logoT && urlToPublic.has(logoT)) {
      logoNext = urlToPublic.get(logoT)!;
    }

    const photos = v.product_photos ?? [];
    let photosChanged = false;
    const photosNext = photos.map((p) => {
      const t = p?.trim();
      if (t && urlToPublic.has(t)) {
        photosChanged = true;
        return urlToPublic.get(t)!;
      }
      return p;
    });

    if (logoNext === v.logo_url && !photosChanged) continue;

    const patch: Record<string, unknown> = {};
    if (logoNext !== v.logo_url) patch.logo_url = logoNext;
    if (photosChanged) patch.product_photos = photosNext;

    const { error } = await admin.from("vendors").update(patch).eq("id", v.id);
    if (error) {
      console.error(`[db vendors] ${v.id}: ${error.message}`);
      dbErrors += 1;
    } else {
      vendorsUpdated += 1;
    }
  }

  for (const it of items) {
    const t = it.photo_url?.trim();
    if (!t || !urlToPublic.has(t)) continue;
    const next = urlToPublic.get(t)!;
    if (next === it.photo_url) continue;

    const { error } = await admin
      .from("vendor_photo_batch_items")
      .update({ photo_url: next })
      .eq("id", it.id);
    if (error) {
      console.error(`[db batch_items] ${it.id}: ${error.message}`);
      dbErrors += 1;
    } else {
      itemsUpdated += 1;
    }
  }

  console.log("\n--- итог ---");
  console.log(`Скачано и залито (уникальных URL): ${downloaded}`);
  console.log(`Ошибок скачивания: ${downloadErrors}`);
  console.log(`Ошибок upload: ${uploadErrors}`);
  console.log(`Строк vendors обновлено: ${vendorsUpdated}`);
  console.log(`Строк vendor_photo_batch_items обновлено: ${itemsUpdated}`);
  console.log(`Ошибок БД: ${dbErrors}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
