/**
 * Аудит: совпадает ли `/catalog/{slug}` с Instagram-аккаунтом магазина.
 * Запуск: npx tsx scripts/audit-catalog-slug-instagram.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

type Row = {
  slug: string;
  store_name: string | null;
  instagram_url: string | null;
};

function slugifyVendorTitle(title: string | null | undefined): string {
  if (!title) return "";
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ң: "ng", ө: "o", ү: "u",
  };
  const lower = String(title).normalize("NFKD").toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (Object.prototype.hasOwnProperty.call(translitMap, ch)) out += translitMap[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += " ";
  }
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function canonicalInstagramUsernameFromUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "instagram.com" && host !== "instagr.am") return null;
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return null;
    const first = path.split("/").filter(Boolean)[0];
    if (!first) return null;
    const skip = new Set(["p", "reel", "reels", "stories", "tv", "explore"]);
    if (skip.has(first.toLowerCase())) return null;
    return first.toLowerCase();
  } catch {
    return null;
  }
}

type Risk =
  | "exact"
  | "slug_contains_ig"
  | "ig_contains_slug"
  | "store_slugify_matches_ig"
  | "normalized_match"
  | "opaque_slug"
  | "no_instagram"
  | "low_risk";

type AuditItem = {
  slug: string;
  catalogUrl: string;
  store_name: string | null;
  instagram_url: string | null;
  ig_username: string | null;
  risk: Risk;
  note: string;
};

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripSlugNoise(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/-kg$/i, "")
    .replace(/-bishkek$/i, "")
    .replace(/-dordoi$/i, "")
    .replace(/(^|-)dordoi($|-)/gi, "$1")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isOpaqueCatalogSlug(slug: string): boolean {
  return /^postavshik(?:-[a-z0-9-]+)?-[a-f0-9]{4,6}$/i.test(slug);
}

function classify(row: Row): AuditItem {
  const ig = canonicalInstagramUsernameFromUrl(row.instagram_url);
  const base: AuditItem = {
    slug: row.slug,
    catalogUrl: `/ru/catalog/${row.slug}`,
    store_name: row.store_name,
    instagram_url: row.instagram_url,
    ig_username: ig,
    risk: "low_risk",
    note: "",
  };

  if (!ig) {
    return { ...base, risk: "no_instagram", note: "Нет Instagram URL" };
  }

  if (isOpaqueCatalogSlug(row.slug)) {
    return {
      ...base,
      risk: "opaque_slug",
      note: "Новый opaque-slug (category + uuid), не связан с IG",
    };
  }

  const slugNorm = normalizeToken(row.slug);
  const igNorm = normalizeToken(ig);
  const slugCoreNorm = normalizeToken(stripSlugNoise(row.slug));
  const storeSlugNorm = normalizeToken(slugifyVendorTitle(row.store_name));

  if (slugNorm === igNorm) {
    return {
      ...base,
      risk: "exact",
      note: "Slug полностью совпадает с @username",
    };
  }

  if (slugNorm.includes(igNorm) && igNorm.length >= 4) {
    return {
      ...base,
      risk: "slug_contains_ig",
      note: "Slug содержит Instagram username",
    };
  }

  if (igNorm.includes(slugNorm) && slugNorm.length >= 4) {
    return {
      ...base,
      risk: "ig_contains_slug",
      note: "Instagram username содержит slug",
    };
  }

  if (
    slugCoreNorm.length >= 4 &&
    (slugCoreNorm === igNorm ||
      slugCoreNorm.includes(igNorm) ||
      igNorm.includes(slugCoreNorm))
  ) {
    return {
      ...base,
      risk: "normalized_match",
      note: "Совпадение после удаления -kg / dordoi и т.п.",
    };
  }

  if (
    storeSlugNorm.length >= 4 &&
    (storeSlugNorm === igNorm ||
      storeSlugNorm.includes(igNorm) ||
      igNorm.includes(storeSlugNorm))
  ) {
    return {
      ...base,
      risk: "store_slugify_matches_ig",
      note: "Slugify названия магазина совпадает с IG",
    };
  }

  return { ...base, risk: "low_risk", note: "Прямой связи slug ↔ IG не видно" };
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("slug, store_name, instagram_url")
  .eq("status", "approved")
  .not("slug", "is", null)
  .order("slug");

if (error) throw error;

const rows = (data ?? []) as Row[];
const items = rows.map(classify);

const risky = items.filter((i) =>
  ["exact", "slug_contains_ig", "ig_contains_slug", "normalized_match", "store_slugify_matches_ig"].includes(
    i.risk,
  ),
);

const byRisk = Object.groupBy(items, (i) => i.risk);

const report = {
  generatedAt: new Date().toISOString(),
  totalApproved: items.length,
  withInstagram: items.filter((i) => i.ig_username).length,
  riskyCount: risky.length,
  opaqueSlugCount: items.filter((i) => i.risk === "opaque_slug").length,
  lowRiskCount: items.filter((i) => i.risk === "low_risk").length,
  noInstagramCount: items.filter((i) => i.risk === "no_instagram").length,
  riskBreakdown: Object.fromEntries(
    Object.entries(byRisk).map(([k, v]) => [k, v?.length ?? 0]),
  ),
  examples: {
    exact: items.filter((i) => i.risk === "exact").slice(0, 20),
    slug_contains_ig: items.filter((i) => i.risk === "slug_contains_ig").slice(0, 20),
    ig_contains_slug: items.filter((i) => i.risk === "ig_contains_slug").slice(0, 20),
    normalized_match: items.filter((i) => i.risk === "normalized_match").slice(0, 20),
    store_slugify_matches_ig: items
      .filter((i) => i.risk === "store_slugify_matches_ig")
      .slice(0, 20),
  },
  riskyVendors: risky,
};

writeFileSync(
  "reports/catalog-slug-instagram-audit.json",
  JSON.stringify(report, null, 2),
);

console.log("catalog-slug-instagram audit");
console.log("total:", report.totalApproved);
console.log("with IG:", report.withInstagram);
console.log("RISKY (slug discoverable via IG):", report.riskyCount);
console.log("opaque slugs:", report.opaqueSlugCount);
console.log("low risk:", report.lowRiskCount);
console.log("breakdown:", report.riskBreakdown);
console.log("\nSample risky:");
for (const r of risky.slice(0, 15)) {
  console.log(`  ${r.risk.padEnd(22)} ${r.slug}  ↔  @${r.ig_username}  ${r.catalogUrl}`);
}
console.log("\nwritten reports/catalog-slug-instagram-audit.json");
