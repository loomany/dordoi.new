/**
 * Migrate approved vendors: seo_slug ← current slug, slug ← opaque buildVendorSlug.
 * Updates buyer_catalog_favorites listing_key slug:old → slug:new.
 *
 *   npx tsx scripts/migrate-vendor-slugs-opaque.mts --dry-run
 *   npx tsx scripts/migrate-vendor-slugs-opaque.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const dryRun = process.argv.includes("--dry-run");

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 5,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const wait = 500 * (i + 1);
      console.warn(`[retry ${i + 1}/${attempts}] ${label}:`, err);
      await sleep(wait);
    }
  }
  throw lastErr;
}

const SAFE_SLUG_RE =
  /^(?:postavshik(?:-(?:zhenskoy-odezhdy|muzhskoy-odezhdy|detskoy-odezhdy|obuvi|sumok|tkani|aksessuarov|tekstilya|sporta|belya))?|vendor)-[a-z0-9]{4,6}$/;

type Row = {
  id: string;
  slug: string;
  seo_slug: string | null;
  store_name: string | null;
  categories: string[] | null;
};

function categoryPrefix(categories: string[] | null | undefined): string {
  const hay = (categories ?? []).join(" ").toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/women|женск|womens|woman/i, "postavshik-zhenskoy-odezhdy"],
    [/men|мужск|mens/i, "postavshik-muzhskoy-odezhdy"],
    [/kid|дет|children/i, "postavshik-detskoy-odezhdy"],
    [/shoe|обув|footwear|boot/i, "postavshik-obuvi"],
    [/bag|сумк|leather/i, "postavshik-sumok"],
    [/fabric|ткан|textile|notion/i, "postavshik-tkani"],
    [/accessor|аксессуар/i, "postavshik-aksessuarov"],
    [/home.?text|текстил|bedding/i, "postavshik-tekstilya"],
    [/sport|спорт/i, "postavshik-sporta"],
    [/underwear|бель/i, "postavshik-belya"],
  ];
  for (const [re, prefix] of rules) {
    if (re.test(hay)) return prefix;
  }
  return "postavshik";
}

function opaqueSlug(vendorId: string, categories: string[] | null, len: 4 | 6): string {
  const compact = vendorId.replace(/-/g, "");
  const suffix = len === 4 ? compact.slice(-4) : compact.slice(0, 6);
  return `${categoryPrefix(categories)}-${suffix}`;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("id,slug,seo_slug,store_name,categories,status")
  .eq("status", "approved")
  .not("slug", "is", null);

if (error) throw error;

const rows = (data ?? []) as Row[];
const usedSlugs = new Set(rows.map((r) => r.slug));
const usedSeoSlugs = new Set(
  rows.map((r) => r.seo_slug).filter((s): s is string => Boolean(s?.trim())),
);

let migrated = 0;
let skipped = 0;

for (const row of rows) {
  const currentSlug = row.slug.trim();
  const alreadyOpaque = SAFE_SLUG_RE.test(currentSlug.toLowerCase());
  const seoSlug =
    row.seo_slug?.trim() ||
    (alreadyOpaque ? null : currentSlug);

  if (alreadyOpaque && row.seo_slug?.trim()) {
    skipped++;
    continue;
  }

  if (alreadyOpaque && !row.seo_slug?.trim()) {
    console.warn(`[skip] opaque slug without seo_slug: ${currentSlug}`);
    skipped++;
    continue;
  }

  let newSlug = opaqueSlug(row.id, row.categories, 4);
  if (usedSlugs.has(newSlug) && newSlug !== currentSlug) {
    newSlug = opaqueSlug(row.id, row.categories, 6);
  }
  if (usedSlugs.has(newSlug) && newSlug !== currentSlug) {
    newSlug = `store-${row.id.replace(/-/g, "").slice(0, 8)}`;
  }

  const finalSeo = seoSlug!;
  if (usedSeoSlugs.has(finalSeo) && finalSeo !== row.seo_slug) {
    console.warn(`[skip] seo_slug clash: ${finalSeo}`);
    skipped++;
    continue;
  }

  console.log(
    `[${dryRun ? "dry" : "update"}] ${currentSlug} → slug=${newSlug}, seo_slug=${finalSeo}`,
  );

  if (!dryRun) {
    await withRetry(`update vendor ${row.id}`, async () => {
      const { error: updErr } = await sb
        .from("vendors")
        .update({ slug: newSlug, seo_slug: finalSeo })
        .eq("id", row.id);
      if (updErr) throw updErr;
    });

    const oldKey = `slug:${currentSlug}`;
    const newKey = `slug:${newSlug}`;
    await withRetry(`favorites ${oldKey}`, async () => {
      const { error: favErr } = await sb
        .from("buyer_catalog_favorites")
        .update({ listing_key: newKey })
        .eq("listing_key", oldKey);
      if (favErr) throw favErr;
    });
  }

  usedSlugs.delete(currentSlug);
  usedSlugs.add(newSlug);
  usedSeoSlugs.add(finalSeo);
  migrated++;
}

console.log(`\nDone: ${migrated} ${dryRun ? "would migrate" : "migrated"}, ${skipped} skipped`);
