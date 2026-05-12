/**
 * Сборщик Google Places для Dordoi.help (офлайн, tsx).
 * Канонический план: .cursor/plans/google_places_сборщик_e14c6ee8.plan.md
 *
 * Будущий enrich (Place Details): не запрашивать rating/userRatingCount.
 * Field mask для enrich (префикс places.* уточнить по доке API):
 * id, displayName, formattedAddress, location, googleMapsUri, businessStatus,
 * types, primaryType, internationalPhoneNumber, nationalPhoneNumber, websiteUri,
 * regularOpeningHours, editorialSummary
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { randomInt } from "node:crypto";

import {
  CATALOG_FORBIDDEN_PLACE_TYPES,
  DORDOI_CATEGORY_SEARCH_MAP,
  type DordoiCategorySearchMap,
} from "@/data/dordoiCategorySearchMap";
import {
  DISCOVERY_BLACKLIST_KEYWORDS,
  DISCOVERY_BLACKLIST_PLACE_TYPES,
  DISCOVERY_POSITIVE_CATEGORY_DEFS,
  DISCOVERY_TEXT_QUERIES,
  FABRIC_TEXTILE_KEYWORDS,
  discoveryGroupCliHelp,
  resolveDiscoveryNearbyGroups,
} from "@/data/dordoiDiscoveryConfig";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const DORDOI_LAT = 42.93856;
const DORDOI_LNG = 74.62049;
const FILTER_RADIUS_M = 1500;
const GRID_STEP_M = 275;
/** Радиусы Nearby для режима каталога (план: 300–1000). */
const CATALOG_NEARBY_RADII_M = [300, 500, 700, 1000] as const;

const MAX_REQUESTS_CATALOG = 80;
const MAX_REQUESTS_DISCOVERY = 400;
/** Порог для предупреждения в dry-run Discovery (тот же смысл, что лимит каталога за прогон). */
const MAX_REQUESTS_PER_RUN = MAX_REQUESTS_CATALOG;

const PLACES_SEARCH_TEXT = "https://places.googleapis.com/v1/places:searchText";
const PLACES_SEARCH_NEARBY = "https://places.googleapis.com/v1/places:searchNearby";

const FIELD_MASK_BASE =
  "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.businessStatus,places.types,places.primaryType";
const FIELD_MASK_RATINGS = ",places.rating,places.userRatingCount";

type RunMode = "all" | "text" | "nearby" | "discovery";
type DiscoveryGridMode = "compact" | "full";

type CliOpts = {
  category?: string;
  subcategory?: string;
  limit: number;
  mode: RunMode;
  dryRun: boolean;
  includeRatings: boolean;
  /** Только mode=discovery */
  discoveryGroup: string;
  includeTextSearch: boolean;
  discoveryGrid: DiscoveryGridMode;
  /** Радиусы Nearby для Discovery (метры), по умолчанию 500,700 */
  discoveryRadiiM: number[];
  /** Если задан неверный `--grid=`. */
  discoveryGridInvalid?: string;
  /** Явный `--output-tag=` (пустая строка = не задан, тег генерируется). */
  outputTag?: string;
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

function parseBool(v: string | undefined, defaultVal: boolean): boolean {
  if (v === undefined) return defaultVal;
  const t = v.trim().toLowerCase();
  if (t === "true" || t === "1" || t === "yes") return true;
  if (t === "false" || t === "0" || t === "no") return false;
  return defaultVal;
}

function parseDiscoveryRadii(raw: string | undefined): number[] {
  if (raw == null || raw.trim() === "") return [500, 700];
  const parts = raw
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 50 && n <= 50_000);
  if (parts.length === 0) return [500, 700];
  return [...new Set(parts)].sort((a, b) => a - b);
}

/** Безопасный фрагмент имени файла для тега discovery. */
function sanitizeDiscoveryOutputTag(s: string): string {
  const t = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t.length > 0 ? t : "discovery-run";
}

function defaultDiscoveryOutputTag(opts: CliOpts): string {
  const radii = opts.discoveryRadiiM.join("-");
  return `discovery-${opts.discoveryGroup}-${opts.discoveryGrid}-${radii}`;
}

/** Итоговый тег вывода: `--output-tag=` или `discovery-{group}-{grid}-{radii}`. */
function resolveDiscoveryOutputTag(opts: CliOpts): string {
  const fromCli = opts.outputTag?.trim();
  if (fromCli) return sanitizeDiscoveryOutputTag(fromCli);
  return sanitizeDiscoveryOutputTag(defaultDiscoveryOutputTag(opts));
}

function discoveryOutputPaths(tag: string) {
  const gen = join(root, "data", "generated");
  const rep = join(root, "reports");
  return {
    tag,
    rawJson: join(gen, `dordoi-google-places.${tag}.raw.json`),
    catalogMatchedJson: join(gen, `dordoi-google-places.${tag}.catalog-matched.json`),
    discoveryUnmappedJson: join(gen, `dordoi-google-places.${tag}.discovery-unmapped.json`),
    excludedJson: join(gen, `dordoi-google-places.${tag}.excluded.json`),
    summaryCsv: join(gen, `dordoi-google-places.${tag}.discovery-summary.csv`),
    reportMd: join(rep, `dordoi-google-places-${tag}-summary.md`),
  };
}

function discoveryOutputRelativePaths(tag: string) {
  const p = discoveryOutputPaths(tag);
  return {
    tag: p.tag,
    rawJson: `data/generated/dordoi-google-places.${tag}.raw.json`,
    catalogMatchedJson: `data/generated/dordoi-google-places.${tag}.catalog-matched.json`,
    discoveryUnmappedJson: `data/generated/dordoi-google-places.${tag}.discovery-unmapped.json`,
    excludedJson: `data/generated/dordoi-google-places.${tag}.excluded.json`,
    summaryCsv: `data/generated/dordoi-google-places.${tag}.discovery-summary.csv`,
    reportMd: `reports/dordoi-google-places-${tag}-summary.md`,
  };
}

function parseCli(): CliOpts {
  const raw: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) {
      raw[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  const mode = (raw.mode ?? "all") as RunMode;
  const limit = Math.max(1, Math.min(5000, Number.parseInt(raw.limit ?? "100", 10) || 100));
  const gridParam = raw.grid;
  let discoveryGrid: DiscoveryGridMode = "compact";
  let discoveryGridInvalid: string | undefined;
  if (gridParam !== undefined && gridParam.trim() !== "") {
    const g = gridParam.trim().toLowerCase();
    if (g === "full") discoveryGrid = "full";
    else if (g === "compact") discoveryGrid = "compact";
    else discoveryGridInvalid = gridParam.trim();
  }

  return {
    category: raw.category,
    subcategory: raw.subcategory,
    limit,
    mode,
    dryRun: parseBool(raw["dry-run"], true),
    includeRatings: parseBool(raw["include-ratings"], false),
    discoveryGroup: (raw["discovery-group"] ?? "all").trim().toLowerCase(),
    includeTextSearch: parseBool(raw["include-text-search"], true),
    discoveryGrid,
    discoveryRadiiM: parseDiscoveryRadii(raw.radii),
    discoveryGridInvalid,
    outputTag: raw["output-tag"]?.trim() || undefined,
  };
}

function metersBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Сетка вокруг Дордоя: full — 9 точек (центр + 8 направлений), compact — 5 (центр, N, S, E, W).
 * Шаг GRID_STEP_M метров по северу/востоку (приближённо).
 */
function buildGridCenters(mode: DiscoveryGridMode): { lat: number; lng: number; id: string }[] {
  const dLat = GRID_STEP_M / 111_320;
  const dLng = GRID_STEP_M / (111_320 * Math.cos((DORDOI_LAT * Math.PI) / 180));
  const c = { lat: DORDOI_LAT, lng: DORDOI_LNG };
  const full: { lat: number; lng: number; id: string }[] = [
    { ...c, id: "C" },
    { lat: c.lat + dLat, lng: c.lng, id: "N" },
    { lat: c.lat - dLat, lng: c.lng, id: "S" },
    { lat: c.lat, lng: c.lng + dLng, id: "E" },
    { lat: c.lat, lng: c.lng - dLng, id: "W" },
    { lat: c.lat + dLat, lng: c.lng + dLng, id: "NE" },
    { lat: c.lat + dLat, lng: c.lng - dLng, id: "NW" },
    { lat: c.lat - dLat, lng: c.lng + dLng, id: "SE" },
    { lat: c.lat - dLat, lng: c.lng - dLng, id: "SW" },
  ];
  return mode === "compact" ? full.slice(0, 5) : full;
}

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
};

function normalizePlace(p: GooglePlace) {
  const loc =
    p.location?.latitude != null && p.location?.longitude != null
      ? { latitude: p.location.latitude, longitude: p.location.longitude }
      : null;
  return {
    googlePlaceId: p.id ?? "",
    title: p.displayName?.text ?? "",
    address: p.formattedAddress ?? null,
    location: loc,
    googleMapsUri: p.googleMapsUri ?? null,
    businessStatus: p.businessStatus ?? null,
    types: p.types ?? [],
    primaryType: p.primaryType ?? null,
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
  };
}

function fieldMask(includeRatings: boolean) {
  return includeRatings ? FIELD_MASK_BASE + FIELD_MASK_RATINGS : FIELD_MASK_BASE;
}

async function sleepRequestDelay() {
  await delay(randomInt(150, 301));
}

function textHaystack(n: ReturnType<typeof normalizePlace>): string {
  return `${n.title} ${n.address ?? ""} ${n.types.join(" ")} ${n.primaryType ?? ""}`.toLowerCase();
}

function isBlacklistedDiscovery(n: ReturnType<typeof normalizePlace>): string | null {
  const pt = n.primaryType?.toLowerCase() ?? "";
  const types = n.types.map((t) => t.toLowerCase());
  if (DISCOVERY_BLACKLIST_PLACE_TYPES.has(pt)) return `blacklist_primaryType:${pt}`;
  for (const t of types) {
    if (DISCOVERY_BLACKLIST_PLACE_TYPES.has(t)) return `blacklist_type:${t}`;
  }
  const hay = textHaystack(n);
  for (const kw of DISCOVERY_BLACKLIST_KEYWORDS) {
    if (hay.includes(kw.toLowerCase())) return `blacklist_keyword:${kw}`;
  }
  return null;
}

function hasFabricTextileSignal(n: ReturnType<typeof normalizePlace>): boolean {
  const h = textHaystack(n);
  return FABRIC_TEXTILE_KEYWORDS.some((k) => h.includes(k.toLowerCase()));
}

function matchPositiveCategory(n: ReturnType<typeof normalizePlace>) {
  const h = textHaystack(n);
  for (const def of DISCOVERY_POSITIVE_CATEGORY_DEFS) {
    for (const kw of def.keywords) {
      if (h.includes(kw.toLowerCase())) {
        return {
          proposedCategory: def.proposedCategory,
          proposedCategoryLabel: def.proposedCategoryLabel,
          matchedKw: kw,
        };
      }
    }
  }
  return null;
}

type ClassifyOk =
  | {
      bucket: "catalog_matched";
      catalogMainId: string;
      catalogMainLabel: string;
      guessedCategory: string;
      reason: string;
    }
  | {
      bucket: "discovery_unmapped";
      proposedCategory: string;
      proposedCategoryLabel: string;
      confidence: "high" | "medium" | "low";
      reason: string;
    };

const MAIN_LABELS: Record<string, string> = {
  womens: "Женская одежда",
  mens: "Мужская одежда",
  kids: "Детская одежда",
  "underwear-swim": "Нижнее белье и купальники",
  footwear: "Обувь",
  "bags-leather": "Сумки и кожгалантерея",
  accessories: "Аксессуары",
  "fabrics-notions": "Ткани и швейная фурнитура",
  beauty: "Косметика, парфюмерия и уход",
  "toys-children": "Игрушки и товары для детей",
  electronics: "Электроника и мобильные аксессуары",
  household: "Товары для дома (Хозтовары)",
};

function classifyAfterBlacklist(
  n: ReturnType<typeof normalizePlace>,
): ClassifyOk | null {
  const pt = (n.primaryType ?? "").toLowerCase();

  if (pt === "shoe_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "footwear",
      catalogMainLabel: MAIN_LABELS.footwear,
      guessedCategory: "footwear",
      reason: "primaryType:shoe_store",
    };
  }
  if (pt === "clothing_store" || pt === "womens_clothing_store" || pt === "sportswear_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "womens",
      catalogMainLabel: MAIN_LABELS.womens,
      guessedCategory: "womens",
      reason: `primaryType:${pt}`,
    };
  }
  if (pt === "jewelry_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "accessories",
      catalogMainLabel: MAIN_LABELS.accessories,
      guessedCategory: "accessories",
      reason: "primaryType:jewelry_store",
    };
  }
  if (pt === "cosmetics_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "beauty",
      catalogMainLabel: MAIN_LABELS.beauty,
      guessedCategory: "beauty",
      reason: "primaryType:cosmetics_store",
    };
  }
  if (pt === "electronics_store" || pt === "cell_phone_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "electronics",
      catalogMainLabel: MAIN_LABELS.electronics,
      guessedCategory: "electronics",
      reason: `primaryType:${pt}`,
    };
  }
  if (pt === "toy_store") {
    return {
      bucket: "catalog_matched",
      catalogMainId: "toys-children",
      catalogMainLabel: MAIN_LABELS["toys-children"],
      guessedCategory: "toys-children",
      reason: "primaryType:toy_store",
    };
  }
  if (pt === "home_goods_store") {
    if (hasFabricTextileSignal(n)) {
      return {
        bucket: "catalog_matched",
        catalogMainId: "fabrics-notions",
        catalogMainLabel: MAIN_LABELS["fabrics-notions"],
        guessedCategory: "fabrics-notions",
        reason: "home_goods_store+textile_keywords",
      };
    }
    const posHome = matchPositiveCategory(n);
    if (posHome?.proposedCategory === "kitchenware" || posHome?.proposedCategory === "home-goods") {
      return {
        bucket: "catalog_matched",
        catalogMainId: "household",
        catalogMainLabel: MAIN_LABELS.household,
        guessedCategory: "household",
        reason: `home_goods_store+keywords:${posHome.proposedCategory}`,
      };
    }
  }

  const posKw = matchPositiveCategory(n);
  if (posKw) {
    const conf: "high" | "medium" | "low" =
      pt === "store" || pt === "shopping_mall" || pt === "department_store" ? "medium" : "high";
    return {
      bucket: "discovery_unmapped",
      proposedCategory: posKw.proposedCategory,
      proposedCategoryLabel: posKw.proposedCategoryLabel,
      confidence: conf,
      reason: `positive_keyword:${posKw.matchedKw}`,
    };
  }

  if (
    [
      "store",
      "general_store",
      "department_store",
      "shopping_mall",
      "market",
      "flea_market",
      "wholesaler",
      "warehouse_store",
      "furniture_store",
      "hardware_store",
      "building_materials_store",
      "home_improvement_store",
      "gift_shop",
    ].includes(pt)
  ) {
    return {
      bucket: "discovery_unmapped",
      proposedCategory: "generic-retail",
      proposedCategoryLabel: "Торговая точка без явной категории",
      confidence: "low",
      reason: `generic_primaryType:${pt}`,
    };
  }

  return null;
}

async function googleSearchText(
  apiKey: string,
  textQuery: string,
  includeRatings: boolean,
): Promise<{ places: GooglePlace[]; error?: string }> {
  const body = {
    textQuery,
    languageCode: "ru",
    regionCode: "KG",
    locationBias: {
      circle: {
        center: { latitude: DORDOI_LAT, longitude: DORDOI_LNG },
        radius: FILTER_RADIUS_M,
      },
    },
  };
  const res = await fetch(PLACES_SEARCH_TEXT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask(includeRatings),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    return { places: [], error: `${res.status} ${text.slice(0, 400)}` };
  }
  try {
    const j = JSON.parse(text) as { places?: GooglePlace[] };
    return { places: j.places ?? [] };
  } catch {
    return { places: [], error: `parse_error ${text.slice(0, 200)}` };
  }
}

async function googleSearchNearby(
  apiKey: string,
  center: { latitude: number; longitude: number },
  radius: number,
  includedTypes: readonly string[],
  includeRatings: boolean,
): Promise<{ places: GooglePlace[]; error?: string }> {
  const body = {
    languageCode: "ru",
    regionCode: "KG",
    rankPreference: "DISTANCE",
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: center.latitude, longitude: center.longitude },
        radius,
      },
    },
    includedTypes: [...includedTypes],
  };
  const res = await fetch(PLACES_SEARCH_NEARBY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask(includeRatings),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    return { places: [], error: `${res.status} ${text.slice(0, 400)}` };
  }
  try {
    const j = JSON.parse(text) as { places?: GooglePlace[] };
    return { places: j.places ?? [] };
  } catch {
    return { places: [], error: `parse_error ${text.slice(0, 200)}` };
  }
}

function ensureDirs() {
  const gen = join(root, "data", "generated");
  if (!existsSync(gen)) mkdirSync(gen, { recursive: true });
}

function stripRatings<T extends { rating?: unknown; reviewCount?: unknown }>(o: T): T {
  const { rating: _r, reviewCount: _rc, ...rest } = o;
  return rest as T;
}

function discoveryDryRunPlan(opts: CliOpts) {
  const nearbyGroups = resolveDiscoveryNearbyGroups(opts.discoveryGroup);
  const grid = buildGridCenters(opts.discoveryGrid);
  const textN = opts.includeTextSearch ? DISCOVERY_TEXT_QUERIES.length : 0;
  const nearbyN = nearbyGroups.length * grid.length * opts.discoveryRadiiM.length;
  const totalN = textN + nearbyN;
  return {
    textN,
    nearbyN,
    totalN,
    gridN: grid.length,
    groupN: nearbyGroups.length,
    nearbyGroups,
    radiiCount: opts.discoveryRadiiM.length,
    radiiList: [...opts.discoveryRadiiM],
  };
}

function printDiscoveryDryRunConsole(opts: CliOpts) {
  const plan = discoveryDryRunPlan(opts);
  const { textN, nearbyN, totalN, gridN, groupN, nearbyGroups, radiiList } = plan;
  const overMax = totalN > MAX_REQUESTS_PER_RUN;
  const outputTag = resolveDiscoveryOutputTag(opts);
  const rel = discoveryOutputRelativePaths(outputTag);
  const tagNote = opts.outputTag?.trim() ? "из --output-tag=" : "авто (discovery-{group}-{grid}-{radii})";
  console.log("\n=== Dordoi.help — Discovery (DRY-RUN) ===\n");
  console.log(`Режим: discovery | dry-run: ${opts.dryRun} | limit: ${opts.limit}`);
  console.log(`include-ratings: ${opts.includeRatings} (по умолчанию false — рейтинги не запрашиваются)`);
  console.log(`discovery-group: ${opts.discoveryGroup}`);
  console.log(`include-text-search: ${opts.includeTextSearch}`);
  console.log(`grid: ${opts.discoveryGrid} (${gridN} точек)`);
  console.log(`radii (м): ${radiiList.join(",")}`);
  console.log(`output-tag: ${outputTag} (${tagNote})\n`);
  console.log("Файлы при реальном запуске (--dry-run=false):");
  console.log(`  ${rel.rawJson}`);
  console.log(`  ${rel.catalogMatchedJson}`);
  console.log(`  ${rel.discoveryUnmappedJson}`);
  console.log(`  ${rel.excludedJson}`);
  console.log(`  ${rel.summaryCsv}`);
  console.log(`  ${rel.reportMd}\n`);
  console.log(`Text Search запросов (запланировано): ${textN}`);
  console.log(`Nearby Search запросов (запланировано): ${nearbyN}`);
  console.log(`  (= групп типов ${groupN} × точек сетки ${gridN} × радиусов ${radiiList.length})`);
  console.log(`Всего запросов (план): ${totalN}`);
  if (overMax) {
    console.log(
      `\nВНИМАНИЕ: планируемое число запросов (${totalN}) больше MAX_REQUESTS_PER_RUN=${MAX_REQUESTS_PER_RUN}. Рекомендуется уменьшить объём (группа, grid, radii, --include-text-search=false) или выполнить несколько прогонов.`,
    );
  }
  console.log(`\nГруппы includedTypes (Nearby) в этом прогоне:`);
  for (const g of nearbyGroups) {
    console.log(`  [${g.id}] ${g.label}: ${g.includedTypes.join(", ")}`);
  }
  console.log(`\nBlacklist типов (пример, всего ${DISCOVERY_BLACKLIST_PLACE_TYPES.size}):`);
  console.log([...DISCOVERY_BLACKLIST_PLACE_TYPES].slice(0, 25).join(", "), "…");
  console.log(`\nBlacklist ключевых слов (фрагмент):`);
  console.log(DISCOVERY_BLACKLIST_KEYWORDS.slice(0, 20).join(", "), "…");
  console.log(
    "\nDry-run записывает заглушки по тем же путям (с тем же тегом), без HTTP к Places API.\n",
  );
}

function writeDiscoveryDryRunReport(opts: CliOpts) {
  const plan = discoveryDryRunPlan(opts);
  const { textN, nearbyN, totalN, gridN, groupN, nearbyGroups, radiiList } = plan;
  const overMax = totalN > MAX_REQUESTS_PER_RUN;
  const outputTag = resolveDiscoveryOutputTag(opts);
  const rel = discoveryOutputRelativePaths(outputTag);
  const tagNote = opts.outputTag?.trim()
    ? "задан в `--output-tag=`"
    : "автоматически: `discovery-{discovery-group}-{grid}-{radii}`";
  const warnBlock = overMax
    ? [
        "## Предупреждение",
        "",
        `Запланировано **${totalN}** HTTP-запросов — это больше **MAX_REQUESTS_PER_RUN=${MAX_REQUESTS_PER_RUN}**. Рекомендуется разбить прогон (параметры CLI) или выполнить несколько запусков, чтобы не получать неполную выборку при ограничениях по времени/квоте.`,
        "",
      ]
    : [];
  const lines: string[] = [
    "# Dordoi.help — Google Places Discovery",
    "",
    `**Режим:** dry-run (HTTP к Places **не** выполнялись).`,
    `**Дата:** ${new Date().toISOString()}`,
    `**limit:** ${opts.limit} | **include-ratings:** ${opts.includeRatings}`,
    "",
    "## Параметры прогона",
    "",
    `- **discovery-group:** \`${opts.discoveryGroup}\``,
    `- **include-text-search:** ${opts.includeTextSearch}`,
    `- **grid:** \`${opts.discoveryGrid}\` (${gridN} точек: ${opts.discoveryGrid === "compact" ? "центр + N,S,E,W" : "центр + 8 направлений"})`,
    `- **radii (м):** ${radiiList.join(", ")}`,
    `- **output-tag:** \`${outputTag}\` (${tagNote})`,
    "",
    "## Выходные файлы (этот прогон)",
    "",
    `- \`${rel.rawJson}\``,
    `- \`${rel.catalogMatchedJson}\``,
    `- \`${rel.discoveryUnmappedJson}\``,
    `- \`${rel.excludedJson}\``,
    `- \`${rel.summaryCsv}\``,
    `- \`${rel.reportMd}\``,
    "",
    "## План запросов",
    "",
    `- **Text Search:** ${textN}`,
    `- **Nearby Search:** ${nearbyN} (${groupN} групп × ${gridN} точек × ${radiiList.length} радиуса)`,
    `- **Всего (план):** ${totalN}`,
    "",
    ...warnBlock,
    "## Группы includedTypes (Nearby) в этом прогоне",
    "",
    ...nearbyGroups.map(
      (g) => `- **${g.id}** (${g.label}): \`${g.includedTypes.join("`, `")}\``,
    ),
    "",
    "## Blacklist",
    "",
    "### Типы (часть множества)",
    "",
    `\`${[...DISCOVERY_BLACKLIST_PLACE_TYPES].sort().join("`, `")}\``,
    "",
    "### Ключевые слова (фрагмент)",
    "",
    DISCOVERY_BLACKLIST_KEYWORDS.join(", "),
    "",
    "## Файлы при реальном запуске (`--dry-run=false`)",
    "",
    "Имена совпадают с разделом **Выходные файлы** выше (по `output-tag`). Старые фиксированные имена без тега для discovery **не** используются.",
    "",
    "Три корзины: **catalog_matched**, **discovery_unmapped**, **excluded**.",
    "",
  ];
  const paths = discoveryOutputPaths(outputTag);
  const out = paths.reportMd;
  if (!existsSync(dirname(out))) mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, lines.join("\n"), "utf8");
  console.log(`Записан отчёт (dry-run): ${out}`);

  ensureDirs();
  const stubMeta = {
    runMode: "discovery",
    dryRun: true,
    outputTag,
    outputTagExplicit: Boolean(opts.outputTag?.trim()),
    generatedAt: new Date().toISOString(),
    note: "Заглушка dry-run: данные Places не загружались.",
    discoveryGroup: opts.discoveryGroup,
    includeTextSearch: opts.includeTextSearch,
    discoveryGrid: opts.discoveryGrid,
    discoveryRadiiM: radiiList,
    plannedTextSearchRequests: textN,
    plannedNearbySearchRequests: nearbyN,
    plannedTotalRequests: totalN,
    maxRequestsPerRun: MAX_REQUESTS_PER_RUN,
    plannedExceedsMaxRequestsPerRun: overMax,
  };
  writeFileSync(
    paths.rawJson,
    JSON.stringify({ ...stubMeta, entries: [] }, null, 2),
    "utf8",
  );
  writeFileSync(paths.catalogMatchedJson, JSON.stringify([], null, 2), "utf8");
  writeFileSync(paths.discoveryUnmappedJson, JSON.stringify([], null, 2), "utf8");
  writeFileSync(paths.excludedJson, JSON.stringify([], null, 2), "utf8");
  const csvHeader =
    "googlePlaceId,bucket,title,proposedCategory,confidence,distanceFromDordoiMeters,primaryType,types,matchedQueries,status,reason\n";
  writeFileSync(paths.summaryCsv, csvHeader, "utf8");
}

type AccumPlace = ReturnType<typeof normalizePlace> & {
  matchedQueries: string[];
  sourceModes: string[];
  sourceGridPoints: string[];
};

function mergePlace(into: AccumPlace, add: AccumPlace) {
  const pick = <T>(a: T | null | undefined, b: T | null | undefined) =>
    b != null && String(b).length > String(a ?? "").length ? b : a;
  into.title = pick(into.title, add.title) as string;
  into.address = pick(into.address, add.address) as string | null;
  into.googleMapsUri = pick(into.googleMapsUri, add.googleMapsUri) as string | null;
  into.location = into.location ?? add.location;
  into.types = add.types.length > into.types.length ? add.types : into.types;
  into.primaryType = pick(into.primaryType, add.primaryType) as string | null;
}

async function runDiscoveryLive(apiKey: string, opts: CliOpts) {
  ensureDirs();
  const outputTag = resolveDiscoveryOutputTag(opts);
  const paths = discoveryOutputPaths(outputTag);
  const nearbyGroups = resolveDiscoveryNearbyGroups(opts.discoveryGroup);
  const grid = buildGridCenters(opts.discoveryGrid);
  const radii = opts.discoveryRadiiM;
  const byId = new Map<string, AccumPlace>();
  const apiErrors: string[] = [];
  let requests = 0;

  const bumpRequests = () => {
    requests += 1;
  };

  const addRaw = (
    p: GooglePlace,
    meta: { query?: string; mode: string; grid?: string },
  ) => {
    if (!p.id) return;
    const n = normalizePlace(p);
    const ap: AccumPlace = {
      ...n,
      matchedQueries: meta.query ? [meta.query] : [],
      sourceModes: [meta.mode],
      sourceGridPoints: meta.grid ? [meta.grid] : [],
    };
    const prev = byId.get(p.id);
    if (!prev) {
      byId.set(p.id, ap);
    } else {
      if (meta.query && !prev.matchedQueries.includes(meta.query)) prev.matchedQueries.push(meta.query);
      if (!prev.sourceModes.includes(meta.mode)) prev.sourceModes.push(meta.mode);
      if (meta.grid && !prev.sourceGridPoints.includes(meta.grid)) prev.sourceGridPoints.push(meta.grid);
      mergePlace(prev, ap);
    }
  };

  if (opts.includeTextSearch) {
    for (const q of DISCOVERY_TEXT_QUERIES) {
      if (requests >= MAX_REQUESTS_DISCOVERY) break;
      bumpRequests();
      await sleepRequestDelay();
      const { places, error } = await googleSearchText(apiKey, q, opts.includeRatings);
      if (error) apiErrors.push(`text:"${q}": ${error}`);
      for (const pl of places) addRaw(pl, { query: q, mode: "discovery-text" });
    }
  }

  discoveryNearby: for (const grp of nearbyGroups) {
    for (const pt of grid) {
      for (const r of radii) {
        if (requests >= MAX_REQUESTS_DISCOVERY) break discoveryNearby;
        bumpRequests();
        await sleepRequestDelay();
        const gridId = `${pt.id}:${pt.lat.toFixed(5)},${pt.lng.toFixed(5)}|r${r}`;
        const { places, error } = await googleSearchNearby(
          apiKey,
          { latitude: pt.lat, longitude: pt.lng },
          r,
          grp.includedTypes,
          opts.includeRatings,
        );
        if (error) {
          apiErrors.push(`nearby:${grp.id}@${gridId}: ${error}`);
          continue;
        }
        for (const pl of places) {
          addRaw(pl, { mode: "discovery-nearby", grid: `${grp.id}|${gridId}` });
        }
      }
    }
  }

  const center = { latitude: DORDOI_LAT, longitude: DORDOI_LNG };
  const rawEntries: unknown[] = [];
  const catalogMatched: unknown[] = [];
  const discoveryUnmapped: unknown[] = [];
  const excluded: unknown[] = [];

  for (const pl of byId.values()) {
    const dist =
      pl.location != null ? metersBetween(center, pl.location) : null;
    const base = {
      ...pl,
      distanceFromDordoiMeters: dist,
    };
    rawEntries.push(
      opts.includeRatings ? { ...base, source: "pre-filter" } : stripRatings({ ...base, source: "pre-filter" }),
    );

    if (dist != null && dist > FILTER_RADIUS_M) {
      excluded.push({
        ...stripRatings(base),
        exclusionReason: `distance>${FILTER_RADIUS_M}m`,
      });
      continue;
    }

    const bl = isBlacklistedDiscovery(pl);
    if (bl) {
      excluded.push({ ...stripRatings(base), exclusionReason: bl });
      continue;
    }

    const cls = classifyAfterBlacklist(pl);
    if (!cls) {
      excluded.push({
        ...stripRatings(base),
        exclusionReason: "unclassified_primary_type",
      });
      continue;
    }

    const underLimit = catalogMatched.length + discoveryUnmapped.length < opts.limit;
    if (cls.bucket === "catalog_matched") {
      if (underLimit) {
        catalogMatched.push(
          stripRatings({
            ...base,
            catalogMainId: cls.catalogMainId,
            catalogMainLabel: cls.catalogMainLabel,
            guessedCategory: cls.guessedCategory,
            subcategory: null,
            subcategoryLabel: null,
            matchedQueries: pl.matchedQueries,
            sourceModes: pl.sourceModes,
            sourceGridPoints: pl.sourceGridPoints,
            status: "public_unverified",
            classificationReason: cls.reason,
          }),
        );
      } else {
        excluded.push({
          ...stripRatings(base),
          exclusionReason: `over_cli_limit:${opts.limit}`,
        });
      }
    } else if (underLimit) {
      discoveryUnmapped.push(
        stripRatings({
          ...base,
          proposedCategory: cls.proposedCategory,
          proposedCategoryLabel: cls.proposedCategoryLabel,
          confidence: cls.confidence,
          reason: cls.reason,
          matchedQueries: pl.matchedQueries,
          sourceModes: pl.sourceModes,
          sourceGridPoints: pl.sourceGridPoints,
          status: "needs_manual_category_review",
        }),
      );
    } else {
      excluded.push({
        ...stripRatings(base),
        exclusionReason: `over_cli_limit:${opts.limit}`,
      });
    }
  }

  writeFileSync(
    paths.rawJson,
    JSON.stringify(
      {
        runMode: "discovery",
        dryRun: false,
        outputTag,
        outputTagExplicit: Boolean(opts.outputTag?.trim()),
        generatedAt: new Date().toISOString(),
        requestCount: requests,
        uniquePlaces: byId.size,
        apiErrors,
        entries: rawEntries,
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(paths.catalogMatchedJson, JSON.stringify(catalogMatched, null, 2), "utf8");
  writeFileSync(paths.discoveryUnmappedJson, JSON.stringify(discoveryUnmapped, null, 2), "utf8");
  writeFileSync(paths.excludedJson, JSON.stringify(excluded, null, 2), "utf8");

  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "googlePlaceId,bucket,title,proposedCategory,confidence,distanceFromDordoiMeters,primaryType,types,matchedQueries,status,reason",
  ];
  for (const row of catalogMatched as Array<Record<string, unknown>>) {
    csvLines.push(
      [
        row.googlePlaceId,
        "catalog_matched",
        esc(String(row.title ?? "")),
        "",
        "",
        row.distanceFromDordoiMeters ?? "",
        row.primaryType ?? "",
        esc((row.types as string[])?.join("|") ?? ""),
        esc((row.matchedQueries as string[])?.join("|") ?? ""),
        row.status ?? "",
        esc(String(row.classificationReason ?? "")),
      ].join(","),
    );
  }
  for (const row of discoveryUnmapped as Array<Record<string, unknown>>) {
    csvLines.push(
      [
        row.googlePlaceId,
        "discovery_unmapped",
        esc(String(row.title ?? "")),
        row.proposedCategory ?? "",
        row.confidence ?? "",
        row.distanceFromDordoiMeters ?? "",
        row.primaryType ?? "",
        esc((row.types as string[])?.join("|") ?? ""),
        esc((row.matchedQueries as string[])?.join("|") ?? ""),
        row.status ?? "",
        esc(String(row.reason ?? "")),
      ].join(","),
    );
  }
  writeFileSync(paths.summaryCsv, csvLines.join("\n"), "utf8");

  const rep = paths.reportMd;
  const rel = discoveryOutputRelativePaths(outputTag);
  const repBody = [
    "# Dordoi.help — Google Places Discovery",
    "",
    `**output-tag:** \`${outputTag}\``,
    "",
    `Сгенерировано: ${new Date().toISOString()}`,
    "",
    `- Запросов API: ${requests}`,
    `- Уникальных мест (сырых): ${byId.size}`,
    `- catalog_matched: ${catalogMatched.length}`,
    `- discovery_unmapped: ${discoveryUnmapped.length}`,
    `- excluded: ${excluded.length}`,
    "",
    "## Выходные файлы",
    "",
    `- \`${rel.rawJson}\``,
    `- \`${rel.catalogMatchedJson}\``,
    `- \`${rel.discoveryUnmappedJson}\``,
    `- \`${rel.excludedJson}\``,
    `- \`${rel.summaryCsv}\``,
    `- \`${rel.reportMd}\``,
    "",
    "## Ошибки API",
    "",
    ...(apiErrors.length ? apiErrors.map((e) => `- ${e}`) : ["- (нет)"]),
    "",
  ].join("\n");
  writeFileSync(rep, repBody, "utf8");

  console.log(
    `\nDiscovery завершён: output-tag=${outputTag} matched=${catalogMatched.length} unmapped=${discoveryUnmapped.length} excluded=${excluded.length} requests=${requests}`,
  );
  console.log(`Отчёт: ${rep}`);
  console.log(`CSV: ${paths.summaryCsv}\n`);
}

function validateCatalogArgs(map: DordoiCategorySearchMap, opts: CliOpts) {
  const cat = opts.category;
  if (!cat || !map[cat]) {
    console.error(
      "Неверная или отсутствует --category=. Доступные:",
      Object.keys(map).join(", "),
    );
    process.exit(1);
  }
  if (opts.subcategory) {
    const sub = map[cat].subcategories[opts.subcategory];
    if (!sub) {
      console.error(
        "Неверная --subcategory=. Доступные для",
        cat + ":",
        Object.keys(map[cat].subcategories).join(", "),
      );
      process.exit(1);
    }
  }
}

async function runCatalogLive(apiKey: string, opts: CliOpts) {
  const map = DORDOI_CATEGORY_SEARCH_MAP;
  validateCatalogArgs(map, opts);
  const catEntry = map[opts.category!];
  const subs = opts.subcategory
    ? { [opts.subcategory]: catEntry.subcategories[opts.subcategory] }
    : catEntry.subcategories;

  ensureDirs();
  const grid = buildGridCenters("full");
  const byId = new Map<string, AccumPlace>();
  const apiErrors: string[] = [];
  let requests = 0;

  const add = (p: GooglePlace, meta: { query?: string; mode: string; grid?: string }) => {
    if (!p.id) return;
    const n = normalizePlace(p);
    const ap: AccumPlace = {
      ...n,
      matchedQueries: meta.query ? [meta.query] : [],
      sourceModes: [meta.mode],
      sourceGridPoints: meta.grid ? [meta.grid] : [],
    };
    const prev = byId.get(p.id);
    if (!prev) byId.set(p.id, ap);
    else {
      if (meta.query && !prev.matchedQueries.includes(meta.query)) prev.matchedQueries.push(meta.query);
      if (!prev.sourceModes.includes(meta.mode)) prev.sourceModes.push(meta.mode);
      if (meta.grid && !prev.sourceGridPoints.includes(meta.grid)) prev.sourceGridPoints.push(meta.grid);
      mergePlace(prev, ap);
    }
  };

  const runText = opts.mode === "all" || opts.mode === "text";
  const runNear = opts.mode === "all" || opts.mode === "nearby";

  if (runText) {
    for (const sub of Object.values(subs)) {
      for (const q of sub.queries) {
        if (requests >= MAX_REQUESTS_CATALOG) break;
        requests += 1;
        await sleepRequestDelay();
        const { places, error } = await googleSearchText(apiKey, q, opts.includeRatings);
        if (error) apiErrors.push(`text:${q}: ${error}`);
        for (const pl of places) add(pl, { query: q, mode: "text" });
      }
    }
  }

  const included = [
    ...new Set([
      ...catEntry.allowedPlaceTypes,
      ...(opts.subcategory
        ? subs[opts.subcategory].allowedPlaceTypes ?? []
        : []),
    ]),
  ].filter((t) => !CATALOG_FORBIDDEN_PLACE_TYPES.has(t));

  if (runNear) {
    for (const pt of grid) {
      for (const r of CATALOG_NEARBY_RADII_M) {
        if (requests >= MAX_REQUESTS_CATALOG) break;
        requests += 1;
        await sleepRequestDelay();
        const gridId = `${pt.id}|r${r}`;
        const { places, error } = await googleSearchNearby(
          apiKey,
          { latitude: pt.lat, longitude: pt.lng },
          r,
          included,
          opts.includeRatings,
        );
        if (error) apiErrors.push(`nearby:${gridId}: ${error}`);
        for (const pl of places) add(pl, { mode: "nearby", grid: gridId });
      }
    }
  }

  const center = { latitude: DORDOI_LAT, longitude: DORDOI_LNG };
  const neg = new Set(
    [
      ...catEntry.negativeKeywords,
      ...(opts.subcategory
        ? subs[opts.subcategory].negativeKeywords ?? []
        : []),
    ].map((s) => s.toLowerCase()),
  );

  const filtered: unknown[] = [];
  const excluded: unknown[] = [];
  const raw: unknown[] = [];

  let countFiltered = 0;
  for (const pl of byId.values()) {
    const dist = pl.location ? metersBetween(center, pl.location) : null;
    const card = {
      googlePlaceId: pl.googlePlaceId,
      title: pl.title,
      address: pl.address,
      location: pl.location,
      googleMapsUri: pl.googleMapsUri,
      businessStatus: pl.businessStatus,
      types: pl.types,
      primaryType: pl.primaryType,
      category: opts.category,
      categoryLabel: catEntry.label,
      subcategory: opts.subcategory ?? null,
      subcategoryLabel: opts.subcategory
        ? subs[opts.subcategory].label
        : null,
      matchedQueries: pl.matchedQueries,
      sourceModes: pl.sourceModes,
      sourceGridPoints: pl.sourceGridPoints,
      guessedCategory: opts.category,
      status: "public_unverified" as const,
      distanceFromDordoiMeters: dist,
      ...(opts.includeRatings ? { rating: pl.rating, reviewCount: pl.reviewCount } : {}),
    };

    raw.push({ ...card, phase: "pre-filter" });

    let ex: string | null = null;
    if (dist != null && dist > FILTER_RADIUS_M) ex = "distance>1500m";
    else if (pl.primaryType && CATALOG_FORBIDDEN_PLACE_TYPES.has(pl.primaryType))
      ex = `forbidden_primary:${pl.primaryType}`;
    else if (pl.types.some((t) => CATALOG_FORBIDDEN_PLACE_TYPES.has(t)))
      ex = `forbidden_type:${pl.types.find((t) => CATALOG_FORBIDDEN_PLACE_TYPES.has(t))}`;
    else {
      const allowed = new Set(catEntry.allowedPlaceTypes);
      const okType =
        (pl.primaryType && allowed.has(pl.primaryType)) ||
        pl.types.some((t) => allowed.has(t));
      if (!okType) ex = "type_not_allowed";
    }
    if (!ex) {
      const hay = `${pl.title} ${pl.address ?? ""} ${pl.types.join(" ")}`.toLowerCase();
      for (const nk of neg) {
        if (hay.includes(nk)) {
          ex = `negative_keyword:${nk}`;
          break;
        }
      }
    }

    if (ex) {
      excluded.push({ ...stripRatings(card), exclusionReason: ex });
    } else {
      if (countFiltered < opts.limit) {
        filtered.push(opts.includeRatings ? card : stripRatings(card));
        countFiltered += 1;
      }
    }
  }

  writeFileSync(join(root, "data", "generated", "dordoi-google-places.raw.json"), JSON.stringify(raw, null, 2), "utf8");
  writeFileSync(
    join(root, "data", "generated", "dordoi-google-places.filtered.json"),
    JSON.stringify(filtered, null, 2),
    "utf8",
  );

  const csvHeader =
    "googlePlaceId,title,category,subcategory,address,googleMapsUri,primaryType,types,matchedQueries,distanceFromDordoiMeters,status\n";
  const csvRows = (filtered as Array<Record<string, unknown>>).map((row) =>
    [
      row.googlePlaceId,
      `"${String(row.title).replace(/"/g, '""')}"`,
      row.category,
      row.subcategory ?? "",
      `"${String(row.address ?? "").replace(/"/g, '""')}"`,
      row.googleMapsUri ?? "",
      row.primaryType ?? "",
      `"${(row.types as string[]).join("|").replace(/"/g, '""')}"`,
      `"${(row.matchedQueries as string[]).join("|").replace(/"/g, '""')}"`,
      row.distanceFromDordoiMeters ?? "",
      row.status,
    ].join(","),
  );
  writeFileSync(
    join(root, "data", "generated", "dordoi-google-places.filtered.csv"),
    csvHeader + csvRows.join("\n"),
    "utf8",
  );

  const rep = join(root, "reports", "dordoi-google-places-summary.md");
  writeFileSync(
    rep,
    [
      "# Каталог — Google Places",
      "",
      `- Категория: ${opts.category}`,
      `- Подкатегория: ${opts.subcategory ?? "—"}`,
      `- Запросов: ${requests}`,
      `- Уникальных: ${byId.size}`,
      `- В filtered: ${filtered.length}`,
      `- Исключено: ${excluded.length}`,
      "",
      "## Ошибки API",
      ...(apiErrors.length ? apiErrors.map((e) => `- ${e}`) : ["- (нет)"]),
      "",
    ].join("\n"),
    "utf8",
  );
}

function catalogDryRunPlan(opts: CliOpts) {
  const map = DORDOI_CATEGORY_SEARCH_MAP;
  if (!opts.category || !map[opts.category]) return null;
  const cat = map[opts.category];
  const subs = opts.subcategory
    ? { [opts.subcategory]: cat.subcategories[opts.subcategory] }
    : cat.subcategories;
  let text = 0;
  for (const s of Object.values(subs)) text += s.queries.length;
  const gridN = buildGridCenters("full").length;
  const nearby = (opts.mode === "all" || opts.mode === "nearby") ? gridN * CATALOG_NEARBY_RADII_M.length : 0;
  const textN = opts.mode === "all" || opts.mode === "text" ? text : 0;
  return { textN, nearbyN: nearby, includedTypes: cat.allowedPlaceTypes };
}

async function main() {
  loadEnvLocal();
  const opts = parseCli();
  const apiKey = (process.env.GOOGLE_MAPS_API_KEY ?? "").trim();

  if (opts.discoveryGridInvalid != null) {
    console.error(
      `Неверный --grid=${JSON.stringify(opts.discoveryGridInvalid)}. Допустимо: compact, full`,
    );
    process.exit(1);
  }

  if (opts.mode === "discovery") {
    const g = opts.discoveryGroup.trim().toLowerCase();
    const nearbyGroups = resolveDiscoveryNearbyGroups(g);
    if (g !== "all" && g !== "" && nearbyGroups.length === 0) {
      console.error("Неверный --discovery-group=. Допустимо:", discoveryGroupCliHelp());
      process.exit(1);
    }
    if (opts.dryRun) {
      printDiscoveryDryRunConsole(opts);
      writeDiscoveryDryRunReport(opts);
      return;
    }
    if (!apiKey) {
      console.error(
        "Для --dry-run=false нужен GOOGLE_MAPS_API_KEY в .env.local (или окружении). Сейчас dry-run=false не используется по политике запуска.",
      );
      process.exit(1);
    }
    await runDiscoveryLive(apiKey, opts);
    return;
  }

  if (opts.dryRun) {
    const plan = catalogDryRunPlan(opts);
    if (!plan) {
      console.error("Укажите --category= для dry-run каталога.");
      process.exit(1);
    }
    console.log("\n=== Каталог (DRY-RUN) ===\n");
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (!apiKey) {
    console.error("Отсутствует GOOGLE_MAPS_API_KEY. Задайте ключ для --dry-run=false.");
    process.exit(1);
  }
  await runCatalogLive(apiKey, opts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
