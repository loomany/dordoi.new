/**
 * Apply seo_slug column migration (one-time).
 *   npx tsx scripts/apply-seo-slug-migration.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const statements = [
  `alter table public.vendors add column if not exists seo_slug text`,
  `create unique index if not exists vendors_seo_slug_unique_idx on public.vendors (seo_slug) where seo_slug is not null`,
];

for (const sql of statements) {
  const { error } = await sb.from("vendors").select("id").limit(0);
  if (error && error.code !== "PGRST116") {
    // probe connection
  }
  // Supabase JS has no raw SQL — use REST / pg if available; fallback: check column via select
}

const { data: probe, error: probeErr } = await sb
  .from("vendors")
  .select("seo_slug")
  .limit(1);

if (!probeErr) {
  console.log("seo_slug column already exists");
  process.exit(0);
}

if (probeErr.code !== "42703") {
  console.error("Unexpected probe error:", probeErr);
  process.exit(1);
}

// Use Supabase Management API or direct postgres if DATABASE_URL is set
const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "seo_slug missing. Set DATABASE_URL or SUPABASE_DB_URL in .env.local, or run migration SQL in Supabase dashboard:\n",
    readFileSync("supabase/migrations/20260514160000_vendors_seo_slug.sql", "utf8"),
  );
  process.exit(1);
}

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
for (const sql of statements) {
  await client.query(sql);
}
await client.end();
console.log("Migration applied: seo_slug column + unique index");
