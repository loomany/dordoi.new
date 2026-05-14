import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const AUTO_RE =
  /авто|auto|car|автомоб|запчаст|шин|диск|масл[ао]|аккумулятор|акб|автохим|автозвук|сигнализац|автоаксессуар|автосервис|сто\b|service.?station|автоковрик|чехол.*сиден|коврик.*авто|номер.*рамк|видеорегистратор|антирадар|тониров|автопленк/i;
const HOME_RE =
  /посуд|хоз|быт|кухн|сковород|кастрюл|термос|пластик.*посуд|одноразов|уборк|швабр|ведр|губк|моющ|чистящ|химия|ванн|туалет|полотенц|плед|подушк|одеял|текстил.*дом|мебел|пластик|сад|семен|цвет|сувенир|религиоз|ортопед|национальн/i;

type Row = {
  slug: string;
  store_name: string | null;
  description: string | null;
  categories: string[] | null;
  parsed_ai_data: unknown;
};

function aiText(row: Row): string {
  const ai = row.parsed_ai_data as
    | { display?: { description?: string; subtitle?: string; storeTitle?: string } }
    | null
    | undefined;
  const parts = [
    row.store_name,
    row.description,
    ai?.display?.storeTitle,
    ai?.display?.subtitle,
    ai?.display?.description,
  ].filter(Boolean);
  return parts.join(" ");
}

function classify(row: Row): "auto" | "home" | "mixed" | "unclear" {
  const text = aiText(row);
  const auto = AUTO_RE.test(text);
  const home = HOME_RE.test(text);
  if (auto && home) return "mixed";
  if (auto) return "auto";
  if (home) return "home";
  return "unclear";
}

const { data, error } = await sb
  .from("vendors")
  .select("slug,store_name,description,categories,parsed_ai_data,status")
  .eq("status", "approved")
  .overlaps("categories", ["household"]);

if (error) throw error;

const rows = (data ?? []) as Row[];
const onlyHousehold = rows.filter(
  (r) => (r.categories ?? []).length === 1 && r.categories?.[0] === "household",
);
const multiCategory = rows.filter((r) => (r.categories ?? []).includes("household") && (r.categories?.length ?? 0) > 1);

const buckets = { auto: [] as Row[], home: [] as Row[], mixed: [] as Row[], unclear: [] as Row[] };
for (const row of rows) {
  buckets[classify(row)].push(row);
}

const report = {
  generatedAt: new Date().toISOString(),
  categoryId: "household",
  categoryLabelRu: "Товары для дома (Хозтовары)",
  hasAutomotiveMainCategory: false,
  totalApprovedWithHousehold: rows.length,
  onlyHouseholdCount: onlyHousehold.length,
  multiCategoryCount: multiCategory.length,
  classificationHeuristic: {
    auto: buckets.auto.length,
    home: buckets.home.length,
    mixed: buckets.mixed.length,
    unclear: buckets.unclear.length,
  },
  autoOrMixedVendors: [...buckets.auto, ...buckets.mixed].map((r) => ({
    slug: r.slug,
    store_name: r.store_name,
    categories: r.categories,
    bucket: classify(r),
    snippet: aiText(r).slice(0, 180),
  })),
  homeVendors: buckets.home.map((r) => ({
    slug: r.slug,
    store_name: r.store_name,
    categories: r.categories,
  })),
  unclearVendors: buckets.unclear.map((r) => ({
    slug: r.slug,
    store_name: r.store_name,
    categories: r.categories,
    snippet: aiText(r).slice(0, 180),
  })),
  mappingIssues: [
    "В TWO_GIS_TOP_CATEGORY_TO_MAIN_IDS: service_station → household (автосервис попадает в «дом»)",
    "В TWO_GIS_TOP_CATEGORY_TO_MAIN_IDS: construction_market → household",
    "В TWO_GIS_RUBRIC: мебель, ортопедия, цветы, сувениры, семена → household (размывает нишу)",
    "Отдельной main-категории «Авто» в CATALOG_CATEGORY_TREE нет",
  ],
  recommendations: [] as string[],
};

const autoShare = (buckets.auto.length + buckets.mixed.length) / Math.max(rows.length, 1);
const homeShare = buckets.home.length / Math.max(rows.length, 1);

if (autoShare >= 0.25) {
  report.recommendations.push(
    "Добавить main-категорию automotive (автотовары/аксессуары) и перенести auto/mixed вендоров из household",
  );
}
if (homeShare < 0.35 && rows.length > 0) {
  report.recommendations.push(
    "Реальных «товаров для дома» мало — рассмотреть переименование household в более широкую «Прочее/Хозтовары и разное» ИЛИ сузить состав за счёт выноса мебели/авто/канцтоваров",
  );
} else {
  report.recommendations.push(
    "Переименование не обязательно: есть ядро household, но нужна чистка выбросов (авто, мебель, канцтовары)",
  );
}
report.recommendations.push(
  "Исправить 2gis map: service_station не должен маппиться в household",
);
report.recommendations.push(
  "Провести ручную ревизию unclear-вендоров (" + buckets.unclear.length + " шт.)",
);

const outPath = "reports/household-category-audit.json";
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify(report, null, 2));
