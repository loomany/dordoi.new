/**
 * Сверка: у строк из каталога (как на сайте) реально приходит `parsed_ai_data` и читается overlay.
 *
 *   npx tsx scripts/verify-catalog-parsed-ai.ts
 *
 * Нужны те же переменные, что у `test-ai-two-vendors` (Supabase service role).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { getAiCatalogDisplayOverlay } from "@/lib/catalog/parsed-ai-catalog-overlay";

const SELECT =
  "id, slug, store_name, description, categories, logo_url, product_photos, location_row, created_at, min_batch, payment_methods, delivery_help, samples_available, samples_note, returns_policy, parsed_ai_data";

const PAGE = 10;

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from("vendors")
    .select(SELECT)
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(PAGE);

  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];

  console.log(`Первые ${rows.length} approved (как в каталоге):\n`);
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const slug = typeof r.slug === "string" ? r.slug : "";
    const name = typeof r.store_name === "string" ? r.store_name : "";
    const raw = typeof r.description === "string" ? r.description.slice(0, 56) : "";
    const pad = r.parsed_ai_data;
    const padType =
      pad === null || pad === undefined
        ? "null/undefined"
        : typeof pad === "string"
          ? "string"
          : Array.isArray(pad)
            ? "array"
            : "object";
    const overlay = getAiCatalogDisplayOverlay(pad);
    const aiPrev = overlay
      ? overlay.description.slice(0, 56).replace(/\n/g, " ")
      : "— (overlay null)";
    console.log(`slug: ${slug}`);
    console.log(`  name: ${name.slice(0, 72)}`);
    console.log(`  parsed_ai_data: ${padType}`);
    console.log(`  raw desc:   ${raw}${(r.description as string)?.length > 56 ? "…" : ""}`);
    console.log(`  AI overlay: ${aiPrev}`);
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
