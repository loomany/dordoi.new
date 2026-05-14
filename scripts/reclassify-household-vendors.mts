/**
 * Reclassify vendors from household audit: auto → automotive, unclear → proper categories.
 *
 * Usage:
 *   npx tsx scripts/reclassify-household-vendors.mts --dry-run
 *   npx tsx scripts/reclassify-household-vendors.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const dryRun = process.argv.includes("--dry-run");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Patch = { slug: string; remove: string[]; add: string[] };

const MAIN_ORDER = [
  "womens",
  "mens",
  "kids",
  "underwear-swim",
  "footwear",
  "bags-leather",
  "accessories",
  "fabrics-notions",
  "home-textiles",
  "beauty",
  "toys-children",
  "electronics",
  "packaging-retail",
  "household",
  "automotive",
  "sports-outdoors",
] as const;

function normalizeCategories(raw: string[] | null | undefined): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const t = item.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  const order = Object.fromEntries(MAIN_ORDER.map((id, i) => [id, i]));
  out.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));
  return out;
}

const PATCHES: Patch[] = [
  ...[
    "autogrand-kg",
    "subaru-faq-kg",
    "chaspik-accessories",
    "avto-magnit-kg",
    "trassa-kg",
    "salinaavto-kg",
    "force-kyrgyzstan",
    "avto-lux-kg",
  ].map((slug) => ({ slug, remove: ["household"], add: ["automotive"] })),
  ...[
    "lightstyle-kg",
    "fan-aziya-kg",
    "fan-kg-official",
    "lustry-sabi",
    "lustra-kg",
    "lustra-planeta-kg",
    "ebm-homelight",
    "jbd-lighting",
    "led-grand-kg",
    "moroz-holod-kg",
  ].map((slug) => ({ slug, remove: ["household"], add: ["electronics"] })),
  ...["mbeauty-kg", "opt-stock", "glamourbazar-kg"].map((slug) => ({
    slug,
    remove: ["household"],
    add: [],
  })),
  ...["balama-kg", "bebetom-kg"].map((slug) => ({
    slug,
    remove: ["household"],
    add: [],
  })),
  ...["krovatki-bishkek", "golden-toys-kg", "centralsklad-kg"].map((slug) => ({
    slug,
    remove: ["household"],
    add: [],
  })),
  { slug: "gulmira-brand-kg", remove: ["household"], add: [] },
  { slug: "saada-markett", remove: ["household"], add: [] },
  { slug: "silhome-kg", remove: ["household"], add: ["packaging-retail"] },
];

function applyPatch(
  current: string[] | null | undefined,
  patch: Patch,
): string[] {
  const base = normalizeCategories(current);
  const remove = new Set(patch.remove);
  const next = base.filter((id) => !remove.has(id));
  for (const id of patch.add) {
    if (!next.includes(id)) next.push(id);
  }
  return normalizeCategories(next);
}

const slugs = PATCHES.map((p) => p.slug);
const { data, error } = await sb
  .from("vendors")
  .select("id,slug,categories")
  .in("slug", slugs);

if (error) throw error;

const bySlug = new Map((data ?? []).map((r) => [r.slug as string, r]));
let updated = 0;
let skipped = 0;

for (const patch of PATCHES) {
  const row = bySlug.get(patch.slug);
  if (!row) {
    console.warn(`[skip] missing slug: ${patch.slug}`);
    skipped++;
    continue;
  }
  const before = normalizeCategories(row.categories as string[]);
  const after = applyPatch(row.categories as string[], patch);
  if (before.join(",") === after.join(",")) {
    console.log(`[ok] ${patch.slug}: unchanged (${after.join(", ") || "—"})`);
    skipped++;
    continue;
  }
  console.log(
    `[${dryRun ? "dry" : "update"}] ${patch.slug}: ${before.join(", ") || "—"} → ${after.join(", ") || "—"}`,
  );
  if (!dryRun) {
    const { error: updErr } = await sb
      .from("vendors")
      .update({ categories: after })
      .eq("id", row.id);
    if (updErr) throw updErr;
  }
  updated++;
}

console.log(
  `\nDone: ${updated} ${dryRun ? "would update" : "updated"}, ${skipped} skipped/unchanged`,
);
