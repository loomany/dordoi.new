import { catalogFilterSlugsToMainIds } from "@/lib/catalog/catalog-category-filter";
import { dedupeCatalogSubtitle } from "@/lib/catalog/catalog-card-title";
import { normalizeVendorCategoryMainSlugs } from "@/lib/catalog/vendor-category-normalize";
import { CATALOG_CATEGORY_TREE } from "@/lib/constants/categories";

const MAIN_IDS = CATALOG_CATEGORY_TREE.map((m) => m.id);

const SUBTITLE_MAIN_KEYWORDS: Array<[string, RegExp]> = [
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

function exactMainIdFromSubtitle(
  subtitle: string,
  tMainCategory: (mainId: string) => string,
): string | null {
  const normalized = subtitle.trim().toLowerCase();
  for (const id of MAIN_IDS) {
    if (normalized === tMainCategory(id).trim().toLowerCase()) {
      return id;
    }
  }
  return null;
}

/** Какие main-категории явно читаются из подзаголовка (точная метка или ключевые слова). */
export function impliedMainCategoryIdsFromSubtitle(
  subtitle: string | null | undefined,
  tMainCategory: (mainId: string) => string,
): string[] {
  if (!subtitle?.trim()) return [];
  const exact = exactMainIdFromSubtitle(subtitle, tMainCategory);
  if (exact) return [exact];
  const hits: string[] = [];
  for (const [id, re] of SUBTITLE_MAIN_KEYWORDS) {
    if (re.test(subtitle)) hits.push(id);
  }
  return hits;
}

/** Main-категория вендора, совпадающая с активным фильтром (порядок — как в URL). */
export function resolveMatchedMainCategoryForFilter(
  categories: string[] | null | undefined,
  categoryFilterSlugs: readonly string[],
): string | null {
  const filterMains = [...catalogFilterSlugsToMainIds([...categoryFilterSlugs])];
  if (filterMains.length === 0) return null;
  const vendorMains = normalizeVendorCategoryMainSlugs(categories);
  for (const mainId of filterMains) {
    if (vendorMains.includes(mainId)) return mainId;
  }
  return null;
}

/**
 * Подзаголовок карточки с учётом `?cat=`: при несовпадении категорийной метки с фильтром
 * подставляем локализованную main-категорию из пересечения фильтра и вендора.
 * Нейтральные ИИ-подзаголовки («Производство в Бишкеке») не трогаем.
 */
export function resolveCatalogCardSubtitleForCategoryFilter(opts: {
  storeTitle: string;
  categories: string[] | null | undefined;
  categoryFilterSlugs: readonly string[];
  aiOrFallbackSubtitle: string | null | undefined;
  tMainCategory: (mainId: string) => string;
}): string | null {
  const base = dedupeCatalogSubtitle(
    opts.storeTitle,
    opts.aiOrFallbackSubtitle ?? null,
  );
  const matchedMain = resolveMatchedMainCategoryForFilter(
    opts.categories,
    opts.categoryFilterSlugs,
  );
  if (!matchedMain) return base;

  const filterLabel = opts.tMainCategory(matchedMain);
  if (!base) {
    return dedupeCatalogSubtitle(opts.storeTitle, filterLabel);
  }

  const implied = impliedMainCategoryIdsFromSubtitle(base, opts.tMainCategory);
  if (implied.length === 0) {
    return base;
  }
  if (implied.length === 1 && implied[0] === matchedMain) {
    return base;
  }
  if (!implied.includes(matchedMain)) {
    return dedupeCatalogSubtitle(opts.storeTitle, filterLabel);
  }
  return base;
}
