/**
 * Аудит: подзаголовок карточки vs выбранный фильтр категории.
 * Запуск: npx tsx scripts/audit-catalog-subtitle-categories.mts
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const {
  normalizeVendorCategoryMainSlugs,
  localizedMainCategoryLabels,
} = await import("../lib/catalog/vendor-category-normalize.ts");
const { getAiCatalogDisplayOverlay } = await import(
  "../lib/catalog/parsed-ai-catalog-overlay.ts"
);
const {
  dedupeCatalogSubtitle,
  resolveCatalogStoreTitleForCard,
} = await import("../lib/catalog/catalog-card-title.ts");
const { inferCatalogCardSubtitleFallback } = await import(
  "../lib/catalog/vendor-card-display.ts"
);
const { CATALOG_CATEGORY_TREE } = await import("../lib/constants/categories.ts");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ru = JSON.parse(readFileSync("messages/ru.json", "utf8")) as {
  catalogCategoryTree: { main: Record<string, string> };
};
const MAIN_LABELS = ru.catalogCategoryTree.main;
const tMain = (id: string) => MAIN_LABELS[id] ?? id;

const KEYWORDS: Array<[string, RegExp]> = [
  ["womens", /женск/i],
  ["mens", /мужск/i],
  ["kids", /детск/i],
  ["underwear-swim", /нижн|бель|купальн|чулоч/i],
  ["footwear", /обув/i],
  ["bags-leather", /сумк|кожгалантер/i],
  ["accessories", /аксессуар/i],
  ["fabrics-notions", /ткан|фурнитур|швейн/i],
  ["home-textiles", /текстил.*дом|постель|полотен/i],
  ["beauty", /космет|парфюм|уход/i],
  ["toys-children", /игруш/i],
  ["electronics", /электрон|мобильн|телефон/i],
  ["packaging-retail", /упаков|торгов.*оборуд/i],
  ["household", /хозтовар|товар.*дом/i],
  ["automotive", /авто|автомобил|запчаст/i],
  ["sports-outdoors", /спорт|туризм|горнолыж|лыж/i],
];

type VendorRow = {
  slug: string;
  store_name: string | null;
  categories: string[] | null;
  parsed_ai_data: unknown;
  instagram_url: string | null;
};

function impliedMainsFromSubtitle(sub: string | null | undefined): string[] {
  if (!sub?.trim()) return [];
  const hits: string[] = [];
  for (const [id, re] of KEYWORDS) {
    if (re.test(sub)) hits.push(id);
  }
  return hits;
}

function isExactMainLabel(sub: string | null | undefined): string | null {
  const s = sub?.trim();
  if (!s) return null;
  for (const [id, label] of Object.entries(MAIN_LABELS)) {
    if (s.toLowerCase() === label.toLowerCase()) return id;
  }
  return null;
}

function effectiveSubtitle(vendor: VendorRow) {
  const ai = getAiCatalogDisplayOverlay(vendor.parsed_ai_data, "ru");
  const { storeTitle } = resolveCatalogStoreTitleForCard({
    dbStoreName: vendor.store_name?.trim() ?? "",
    fallbackTitle: "Магазин",
    catalogBrandNameFromAi: ai?.catalogBrandName,
    instagramProfileUrl: vendor.instagram_url,
  });
  const aiSub = dedupeCatalogSubtitle(storeTitle, ai?.subtitle ?? null);
  const fallback = inferCatalogCardSubtitleFallback(vendor.categories, tMain);
  const finalSub = aiSub?.trim() || dedupeCatalogSubtitle(storeTitle, fallback);
  return { storeTitle, aiSub, fallback, finalSub };
}

async function fetchAllApproved(): Promise<VendorRow[]> {
  const pageSize = 100;
  const out: VendorRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("vendors")
      .select("slug, store_name, categories, parsed_ai_data, instagram_url")
      .eq("status", "approved")
      .not("slug", "is", null)
      .order("slug")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...(data as VendorRow[]));
    process.stderr.write(`fetched ${out.length} vendors...\n`);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

const rows = await fetchAllApproved();

type VendorAudit = ReturnType<typeof effectiveSubtitle> & {
  slug: string;
  mains: string[];
  labels: string[];
  implied: string[];
  isGeneric: boolean;
};

const vendors: VendorAudit[] = rows.map((v) => {
  const mains = normalizeVendorCategoryMainSlugs(v.categories);
  const sub = effectiveSubtitle(v);
  const exact = isExactMainLabel(sub.finalSub);
  const implied = exact ? [exact] : impliedMainsFromSubtitle(sub.finalSub);
  return {
    slug: v.slug,
    mains,
    labels: localizedMainCategoryLabels(v.categories, tMain),
    implied,
    isGeneric: implied.length === 0,
    ...sub,
  };
});

const multi = vendors.filter((v) => v.mains.length > 1);
const MAIN_IDS = CATALOG_CATEGORY_TREE.map((m) => m.id);

const filters = MAIN_IDS.map((filterMain) => {
  const inFilter = vendors.filter((v) => v.mains.includes(filterMain));
  const mismatches = inFilter.filter(
    (v) =>
      v.finalSub &&
      !v.isGeneric &&
      v.implied.some((im) => im !== filterMain),
  );
  const exactWrong = mismatches.filter((v) => {
    const e = isExactMainLabel(v.finalSub);
    return e && e !== filterMain;
  });
  return {
    id: filterMain,
    label: MAIN_LABELS[filterMain],
    total: inFilter.length,
    withSubtitle: inFilter.filter((v) => v.finalSub).length,
    multiCategory: inFilter.filter((v) => v.mains.length > 1).length,
    mismatches: mismatches.length,
    exactWrongLabel: exactWrong.length,
    examples: mismatches.slice(0, 15).map((v) => ({
      slug: v.slug,
      title: v.storeTitle,
      subtitle: v.finalSub,
      vendorMains: v.mains,
      vendorLabels: v.labels,
      implied: v.implied,
      source: v.aiSub ? "ai" : "fallback",
    })),
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  totalApproved: vendors.length,
  multiCategoryVendors: multi.length,
  subtitleSource: {
    fromAi: vendors.filter((v) => v.aiSub).length,
    fromFallback: vendors.filter((v) => !v.aiSub && v.finalSub).length,
    empty: vendors.filter((v) => !v.finalSub).length,
  },
  rootCause: {
    subtitleNotFilterAware:
      "buildCatalogCardSourceRowForPublishedVendor не получает categorySlugs; subtitle статичен (ИИ или первая main-категория по порядку дерева).",
    categoryOrder:
      "womens идёт первой в CATALOG_CATEGORY_TREE → fallback subtitle часто «Женская одежда» у мульти-категорийных.",
    categoryHref:
      "resolveSeoCategoryHrefForVendorCategories тоже берёт первую main-категорию, не активный фильтр.",
  },
  multiCategoryExamples: multi.slice(0, 20).map((v) => ({
    slug: v.slug,
    mains: v.mains,
    labels: v.labels,
    subtitle: v.finalSub,
    source: v.aiSub ? "ai" : "fallback",
  })),
  filters,
};

writeFileSync(
  "reports/catalog-subtitle-category-audit.json",
  JSON.stringify(report, null, 2),
);
console.log("written reports/catalog-subtitle-category-audit.json");
console.log(
  `mens mismatches: ${filters.find((f) => f.id === "mens")?.mismatches} / ${filters.find((f) => f.id === "mens")?.total}`,
);
console.log(
  `womens mismatches: ${filters.find((f) => f.id === "womens")?.mismatches} / ${filters.find((f) => f.id === "womens")?.total}`,
);
