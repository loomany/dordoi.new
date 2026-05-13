/**
 * Витринный заголовок карточки каталога (SaaS):
 * 1) Из `store_name` снимаем хвост «, магазин женской одежды» и аналоги — остаётся только бренд («Asso»).
 * 2) Если после снятия всё ещё заглушка / пусто — заголовок из ИИ `catalogBrandName` (снимок в `parsed_ai_data`, в т.ч. с подсказкой Instagram при генерации).
 */

const WOMENS_CLOTHING_RE = /женск\w*\s+одежд/i;

/** Хвосты шаблонов: «Asso, магазин женской одежды» → «Asso». */
const GENERIC_SHOP_TITLE_SUFFIXES: RegExp[] = [
  /,\s*магазин\s+женской\s+одежды$/iu,
  /,\s*магазин\s+мужской\s+одежды$/iu,
  /,\s*магазин\s+детской\s+одежды$/iu,
  /,\s*магазин\s+оптовой\s+женской\s+одежды$/iu,
  /,\s*магазин\s+оптовой\s+мужской\s+одежды$/iu,
  /,\s*магазин\s+уходовой\s+косметики$/iu,
  /,\s*магазин\s+корейской\s+косметики$/iu,
  /,\s*оптовый\s+магазин\s+корейской\s+косметики$/iu,
  /,\s*точка\s+оптовой\s+продажи$/iu,
];

/**
 * Убирает типовые хвосты «, магазин …» (несколько проходов подряд).
 */
export function stripGenericShopSuffixFromStoreTitle(name: string): string {
  let t = name.normalize("NFKC").trim();
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const re of GENERIC_SHOP_TITLE_SUFFIXES) {
      const next = t.replace(re, "").trim();
      if (next !== t) {
        t = next;
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  return t.replace(/\s{2,}/g, " ").trim();
}

/**
 * Типичные заглушки бота/импорта — сюда подставляем нейтральное имя из ИИ.
 */
export function isPlaceholderCatalogStoreName(name: string | null | undefined): boolean {
  const t = typeof name === "string" ? name.trim().toLowerCase() : "";
  if (!t || t.length < 4) return true;
  if (/^магазин(\s+оптовой)?(\s+женск|\s+мужск|\s+детск)/i.test(t)) return true;
  if (/^магазин\s*,?\s*$/i.test(t)) return true;
  return false;
}

/**
 * Убирает следы ников/URL; не даёт восстановить точный Instagram-handle.
 */
export function sanitizeAiCatalogBrandName(raw: string): string | null {
  let s = raw.normalize("NFKC").trim();
  if (!s) return null;
  s = s.replace(/https?:\/\/\S+/gi, " ");
  s = s.replace(/\bwww\./gi, " ");
  s = s.replace(/@\w[\w.]*/g, " ");
  s = s.replace(/instagram\.com\/[\w._-]+/gi, " ");
  s = s.replace(/[\u0000-\u001F]/g, " ");
  s = s.replace(/\s*[_-](kg|kgs|official|shop|store|brand|moda)\b/giu, " ");
  s = s.replace(/[_]{1,}/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length < 2 || s.length > 56) return null;
  return s;
}

/**
 * Не дублируем «Магазин женской одежды» + «Оптовый магазин женской одежды».
 */
export function dedupeCatalogSubtitle(
  title: string,
  subtitle: string | null | undefined,
): string | null {
  if (!subtitle?.trim()) return null;
  const s = subtitle.trim();
  const tNorm = title.toLowerCase().replace(/[,.\s]+/g, " ").trim();
  const sNorm = s.toLowerCase().replace(/[,.\s]+/g, " ").trim();
  if (tNorm === sNorm) return null;
  if (WOMENS_CLOTHING_RE.test(tNorm) && WOMENS_CLOTHING_RE.test(sNorm)) return null;
  if (
    tNorm.includes("магазин") &&
    sNorm.startsWith("оптов") &&
    WOMENS_CLOTHING_RE.test(sNorm)
  ) {
    return null;
  }
  return s;
}

/**
 * Заголовок карточки: каноническое имя из БД или витринное из ИИ при «шаблонном» названии.
 */
export function resolveCatalogStoreTitleForCard(opts: {
  dbStoreName: string;
  fallbackTitle: string;
  catalogBrandNameFromAi: string | null | undefined;
}): { storeTitle: string; catalogBrandName: string | null } {
  const rawDb = opts.dbStoreName.trim();
  const stripped = stripGenericShopSuffixFromStoreTitle(rawDb);
  const base = stripped || opts.fallbackTitle.trim() || "Магазин";

  if (stripped.length > 0 && !isPlaceholderCatalogStoreName(stripped)) {
    return { storeTitle: stripped, catalogBrandName: null };
  }

  const brand = sanitizeAiCatalogBrandName(opts.catalogBrandNameFromAi ?? "");
  const useAi = Boolean(brand) && isPlaceholderCatalogStoreName(base);
  return {
    storeTitle: useAi ? brand! : base,
    catalogBrandName: brand || null,
  };
}
