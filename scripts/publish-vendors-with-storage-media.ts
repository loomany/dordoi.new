/**
 * Публикация в каталог: status=approved, approved_at=now(), при необходимости — slug.
 *
 * По умолчанию — только заявки в очереди (`pending_moderation` / `pending_review`), у которых
 * **логотип и минимум одна фотография товара** уже на нашем Storage (`vendor-media`).
 *
 *   npx tsx scripts/publish-vendors-with-storage-media.ts
 *   npx tsx scripts/publish-vendors-with-storage-media.ts --any-storage-photo
 *     (старое правило: достаточно любого фото или логотипа на Storage)
 *
 * В консоль — кликабельные URL каталога (с префиксом локали /ru/…).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyVendorTitle, buildVendorSlug } from "@/lib/catalog/vendor-slug";
import { canonicalInstagramUsernameFromUrl } from "@/lib/vendor/instagram-profile-sync";
import { isProviderSlug } from "@/data/provider-registry";
import { isVendorPendingQueueStatus } from "@/lib/vendor/status";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

function bucketPublicPathMarker(bucket: string): string {
  return `/storage/v1/object/public/${bucket}/`;
}

function storageHit(u: string | null | undefined, bucketMarker: string): boolean {
  const s = u?.trim() ?? "";
  return s.length > 0 && s.includes(bucketMarker);
}

/** Достаточно любого URL на нашем бакете (логотип или любое фото). */
function rowUsesOurStorage(
  logo_url: string | null,
  product_photos: string[] | null,
  bucket: string,
): boolean {
  const m = bucketPublicPathMarker(bucket);
  if (storageHit(logo_url, m)) return true;
  for (const p of product_photos ?? []) {
    if (storageHit(p, m)) return true;
  }
  return false;
}

/** Логотип на Storage + минимум одна карточка товара на Storage. */
function rowHasLogoAndPhotosOnStorage(
  logo_url: string | null,
  product_photos: string[] | null,
  bucket: string,
): boolean {
  const m = bucketPublicPathMarker(bucket);
  if (!storageHit(logo_url, m)) return false;
  for (const p of product_photos ?? []) {
    if (storageHit(p, m)) return true;
  }
  return false;
}

async function slugAvailable(
  admin: ReturnType<typeof createAdminClient>,
  slug: string,
  exceptVendorId: string,
): Promise<boolean> {
  if (isProviderSlug(slug)) return false;
  const { data, error } = await admin
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .neq("id", exceptVendorId)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length === 0;
}

async function pickUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  vendor: {
    id: string;
    store_name: string | null;
    instagram_url: string | null;
    slug: string | null;
  },
): Promise<string> {
  const existing = vendor.slug?.trim();
  if (existing) return existing;

  const igUser = canonicalInstagramUsernameFromUrl(vendor.instagram_url);
  let base = igUser ? slugifyVendorTitle(igUser) : "";
  if (base.length < 2) {
    base = `test-vendor-${vendor.id}`;
  }

  const id6 = vendor.id.replace(/-/g, "").slice(0, 6);
  const candidates = [
    base,
    `${base}-${id6}`,
    buildVendorSlug({ storeName: vendor.store_name, vendorId: vendor.id }),
    `store-${vendor.id.replace(/-/g, "").slice(0, 8)}`,
  ];

  for (const c of candidates) {
    const t = c.trim();
    if (t.length < 2) continue;
    if (await slugAvailable(admin, t, vendor.id)) return t;
  }
  return `vendor-${vendor.id.replace(/-/g, "")}`;
}

type VendorRow = {
  id: string;
  slug: string | null;
  store_name: string | null;
  instagram_url: string | null;
  status: string;
  logo_url: string | null;
  product_photos: string[] | null;
  approved_at: string | null;
};

async function fetchVendors(admin: ReturnType<typeof createAdminClient>): Promise<VendorRow[]> {
  const pageSize = 1000;
  const out: VendorRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendors")
      .select(
        "id, slug, store_name, instagram_url, status, logo_url, product_photos, approved_at",
      )
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as VendorRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

async function main() {
  loadEnvLocal();
  const bucket = (process.env.VENDOR_MEDIA_BUCKET ?? "vendor-media").trim();
  const admin = createAdminClient();
  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const defaultLocale = "ru";

  const anyStorageMode = process.argv.includes("--any-storage-photo");
  const all = await fetchVendors(admin);
  const targets = all.filter((v) => {
    if (!isVendorPendingQueueStatus(v.status)) return false;
    return anyStorageMode
      ? rowUsesOurStorage(v.logo_url, v.product_photos, bucket)
      : rowHasLogoAndPhotosOnStorage(v.logo_url, v.product_photos, bucket);
  });

  console.log(
    anyStorageMode
      ? `\nК публикации (очередь + любой URL в ${bucket}): ${targets.length}\n`
      : `\nК публикации (очередь + логотип и ≥1 фото в ${bucket}): ${targets.length}\n`,
  );

  const links: string[] = [];

  for (const v of targets) {
    const slugNext = await pickUniqueSlug(admin, v);
    const patch: Record<string, unknown> = {
      status: "approved",
      approved_at: new Date().toISOString(),
    };
    if (!v.slug?.trim()) {
      patch.slug = slugNext;
    }

    const { error } = await admin.from("vendors").update(patch).eq("id", v.id);
    if (error) {
      console.error(`Ошибка UPDATE ${v.id}: ${error.message}`);
      continue;
    }

    const finalSlug = (v.slug?.trim() || slugNext).trim();
    const url = `${appBase}/${defaultLocale}/catalog/${encodeURIComponent(finalSlug)}`;
    links.push(url);
    console.log(url);
  }

  console.log(
    `\n(Префикс /${defaultLocale}/ нужен из‑за localePrefix: \"always\" в i18n.)\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
