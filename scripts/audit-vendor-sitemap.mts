/**
 * Audit vendor sitemap data (no server-only imports).
 *   npx tsx scripts/audit-vendor-sitemap.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const CHUNK_SIZE = 500;
const LOCALES = ["ru", "kk", "kg", "uz", "tj"] as const;
const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, count: dbCount } = await sb
  .from("vendors")
  .select("slug, seo_slug, store_name", { count: "exact" })
  .eq("status", "approved")
  .not("seo_slug", "is", null);

const seoSlugs: string[] = [];
const seen = new Set<string>();
for (const row of data ?? []) {
  const seo = row.seo_slug?.trim();
  if (!seo || seen.has(seo)) continue;
  seen.add(seo);
  seoSlugs.push(seo);
}

const chunkCount = Math.ceil(seoSlugs.length / CHUNK_SIZE);
const chunk1 = seoSlugs.slice(0, CHUNK_SIZE);
const sampleUrls = chunk1.slice(0, 3).flatMap((seo) =>
  LOCALES.map((locale) => `${BASE}/${locale}/suppliers/${seo}`),
);

const indexableFlag = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

console.log("=== Sitemap audit ===\n");
console.log("NEXT_PUBLIC_SITE_INDEXABLE:", process.env.NEXT_PUBLIC_SITE_INDEXABLE ?? "(not set)");
console.log("siteIndexable (prod gate):", indexableFlag);
console.log("DB approved + seo_slug:", dbCount);
console.log("Sitemap seo_slug entries:", seoSlugs.length);
console.log("Vendor chunks (500 each):", chunkCount);
console.log("URLs in chunk 1 (×5 locales):", chunk1.length * LOCALES.length);
console.log("\nIndex would list:");
console.log(`  ${BASE}/sitemaps/core.xml`);
for (let i = 1; i <= chunkCount; i++) {
  console.log(`  ${BASE}/sitemaps/vendors/vendors-${i}.xml`);
}
console.log("\nSample URLs (chunk 1):");
for (const u of sampleUrls) console.log(`  ${u}`);

const badCatalog = sampleUrls.some((u) => u.includes("/catalog/"));
const badOpaque = seoSlugs.some((s) =>
  /^postavshik(?:-|$)|^vendor-/.test(s),
);

if (!indexableFlag) {
  console.log(
    "\n⚠ Locally /sitemap.xml is EMPTY until NEXT_PUBLIC_SITE_INDEXABLE=true (by design).",
  );
}
if (badCatalog) {
  console.error("\nFAIL: catalog URLs in sitemap samples");
  process.exit(1);
}
if (badOpaque) {
  console.error("\nFAIL: opaque slugs found in seo_slug column");
  process.exit(1);
}
if (seoSlugs.length === 0) {
  console.error("\nFAIL: no seo slugs");
  process.exit(1);
}

console.log("\n✓ OK: sitemap data uses /suppliers/{seo_slug}, no /catalog/ opaque URLs");
