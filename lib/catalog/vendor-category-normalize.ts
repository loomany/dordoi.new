import {
  CATALOG_CATEGORY_TREE,
  CATALOG_MAIN_CATEGORY_ID_SET,
} from "@/lib/constants/categories";

/** Технический мусор — не маппим и не показываем. */
const DROPPED_VENDOR_CATEGORY_TOKENS = new Set(["1", "2", "3"]);

function normalizeLookupKey(raw: string): string {
  return raw.trim().toLowerCase();
}

const VENDOR_CATEGORY_SYNONYM_TO_MAIN: Record<string, string> = (() => {
  const pairs: Array<[string, string]> = [
    ["Женская одежда", "womens"],
    ["жен", "womens"],
    ["Верхняя одежда", "womens"],
    ["Мужская одежда", "mens"],
    ["Детская одежда", "kids"],
    ["Нижнее белье", "underwear-swim"],
    ["Обувь", "footwear"],
    ["Сумки и Аксессуары", "accessories"],
    ["Чулочно-носочные изделия", "underwear-swim"],
  ];
  const out: Record<string, string> = {};
  for (const [k, main] of pairs) {
    out[normalizeLookupKey(k)] = main;
  }
  return out;
})();

function canonicalMainFromToken(trimmed: string): string | null {
  const key = normalizeLookupKey(trimmed);
  if (!key) return null;
  if (DROPPED_VENDOR_CATEGORY_TOKENS.has(key)) return null;
  const syn = VENDOR_CATEGORY_SYNONYM_TO_MAIN[key];
  if (syn) return syn;
  if (CATALOG_MAIN_CATEGORY_ID_SET.has(trimmed)) return trimmed;
  if (CATALOG_MAIN_CATEGORY_ID_SET.has(key)) return key;
  return null;
}

const MAIN_ORDER_INDEX: Record<string, number> = Object.fromEntries(
  CATALOG_CATEGORY_TREE.map((m, i) => [m.id, i]),
);

/**
 * Нормализация `vendors.categories` → уникальные каноничные main slug-и (порядок как в дереве каталога).
 * Без записи в БД.
 */
export function normalizeVendorCategoryMainSlugs(raw: string[] | null | undefined): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const t = typeof item === "string" ? item.trim() : "";
    if (!t) continue;
    const main = canonicalMainFromToken(t);
    if (!main || seen.has(main)) continue;
    seen.add(main);
    out.push(main);
  }
  out.sort((a, b) => (MAIN_ORDER_INDEX[a] ?? 99) - (MAIN_ORDER_INDEX[b] ?? 99));
  return out;
}

/**
 * Локализованные подписи основных категорий для карточки / списков.
 */
export function localizedMainCategoryLabels(
  raw: string[] | null | undefined,
  tMain: (mainId: string) => string,
): string[] {
  return normalizeVendorCategoryMainSlugs(raw).map((id) => tMain(id));
}
