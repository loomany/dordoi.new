/**
 * Витринный заголовок карточки каталога (SaaS):
 * 1) Из `store_name` снимаем хвост «, магазин/бутик …» — остаётся бренд («Mila shop»).
 * 2) Если название — чистая заглушка — бренд из ИИ `catalogBrandName` или из пути Instagram (без точного ника).
 */

const WOMENS_CLOTHING_RE = /женск\w*\s+одежд/i;

const INVISIBLE_CHARS_RE = /[\u200B-\u200D\uFEFF]/g;

function normalizeStoreTitleInput(name: string): string {
  return name.normalize("NFKC").replace(INVISIBLE_CHARS_RE, "").trim();
}

/** Категория/ниша вместо бренда — не показываем как заголовок и не берём из ИИ. */
export function isGenericCategoryLabel(name: string | null | undefined): boolean {
  if (isPlaceholderCatalogStoreName(name)) return true;
  const t = typeof name === "string" ? normalizeStoreTitleInput(name).toLowerCase() : "";
  if (!t) return true;
  if (/^(?:авто)?аксессуар/u.test(t)) return true;
  if (/^техника\s+для/u.test(t)) return true;
  if (/^товары?\s+(?:для|из)\b/u.test(t)) return true;
  if (/^продажа\s/u.test(t)) return true;
  if (/^оптовая\s+продажа/u.test(t)) return true;
  if (/^модная\s+одежда/u.test(t)) return true;
  if (/^стильная\s+/u.test(t)) return true;
  if (/^широкий\s+ассортимент/u.test(t)) return true;
  return false;
}

function polishDisplayStoreTitle(title: string): string {
  let t = normalizeStoreTitleInput(title);
  if (!/_/.test(t)) return t;
  return t
    .split(/_+/)
    .filter((w) => w.length > 0)
    .map((w) => {
      if (/^\d+$/.test(w)) return w;
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

/** После запятой: «магазин детской обуви», «бутик женской одежды», «оптовый магазин»… */
function isGenericShopDescriptorTail(tail: string): boolean {
  const s = tail.normalize("NFKC").trim().toLowerCase();
  if (!s) return false;
  return /^(?:магазин|магазины|бутик|шоурум|showroom|оптовый|интернет-магазин|обувной\s+магазин|точка\s+оптовой|швейная\s+фабрика|швейных\s+цех|текстильная\s+компания)(?:\s|$|[,.])/u.test(
    s,
  );
}

/** Хвосты без запятой или узкие шаблоны. */
const GENERIC_SHOP_TITLE_SUFFIXES: RegExp[] = [
  /,\s*бутик\s+женской\s+одежды$/iu,
  /,\s*бутик\s+мужской\s+одежды$/iu,
  /,\s*бутик\s+детской\s+одежды$/iu,
  /,\s*магазин\s+женской\s+одежды$/iu,
  /,\s*магазин\s+мужской\s+одежды$/iu,
  /,\s*магазин\s+детской\s+одежды$/iu,
  /,\s*магазин\s+оптовой\s+женской\s+одежды$/iu,
  /,\s*магазин\s+оптовой\s+мужской\s+одежды$/iu,
  /,\s*магазин\s+уходовой\s+косметики$/iu,
  /,\s*магазин\s+корейской\s+косметики$/iu,
  /,\s*оптовый\s+магазин\s+корейской\s+косметики$/iu,
  /,\s*точка\s+оптовой\s+продажи$/iu,
  /,\s*магазин\s+одежды$/iu,
  /,\s*магазин\s+обуви$/iu,
  /,\s*магазин\s+косметики$/iu,
  /,\s*магазин\s+тканей$/iu,
  /,\s*магазин\s+текстиля$/iu,
  /,\s*магазин\s+посуды$/iu,
  /,\s*магазин\s+игрушек$/iu,
  /,\s*магазин\s+нижнего\s+белья$/iu,
  /,\s*магазин\s+бытовой\s+техники$/iu,
  /,\s*магазин\s+люстр$/iu,
  /,\s*магазин\s+канцтоваров$/iu,
  /,\s*магазин\s+ковров$/iu,
  /,\s*магазин\s+спортивной\s+одежды$/iu,
  /,\s*магазин\s+домашнего\s+текстиля$/iu,
  /,\s*оптовый\s+магазин$/iu,
  /,\s*интернет-магазин$/iu,
  /,\s*обувной\s+магазин$/iu,
  /,\s*текстильная\s+компания$/iu,
  /,\s*швейная\s+фабрика$/iu,
  /,\s*швейных\s+цех$/iu,
  /,\s*магазин$/iu,
  /,\s*бутик$/iu,
  /,\s*шоурум$/iu,
  /,\s*showroom$/iu,
];

/**
 * Убирает типовые хвосты «, магазин/бутик …» (универсально + узкие regex).
 */
export function stripGenericShopSuffixFromStoreTitle(name: string): string {
  let t = normalizeStoreTitleInput(name);

  const commaIdx = t.indexOf(",");
  if (commaIdx > 0) {
    const left = t.slice(0, commaIdx).trim();
    const right = t.slice(commaIdx + 1).trim();
    if (left.length >= 2 && isGenericShopDescriptorTail(right)) {
      t = left;
    }
  }

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
 * Типичные заглушки бота/импорта — сюда подставляем имя из ИИ или Instagram.
 */
export function isPlaceholderCatalogStoreName(name: string | null | undefined): boolean {
  const t =
    typeof name === "string" ? normalizeStoreTitleInput(name).toLowerCase() : "";
  if (!t || t.length < 2) return true;
  if (/^\d{1,4}$/.test(t)) return true;
  if (/^магазин(?:ы)?(?:\s|$)/u.test(t)) return true;
  if (/^бутик(?:\s|$)/u.test(t)) return true;
  if (/^шоурум(?:\s|$)/u.test(t)) return true;
  if (/^оптовый\s+магазин/u.test(t)) return true;
  if (/^интернет-магазин/u.test(t)) return true;
  if (/^(?:авто)?аксессуар/u.test(t)) return true;
  if (/^(?:123|cosmos|тест|пример)\b/i.test(t)) return true;
  if (/^(?:null|undefined|none|n\/a)$/i.test(t)) return true;
  return false;
}

/** Handle из URL профиля Instagram. */
export function extractInstagramHandleFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const m = url.trim().match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const handle = m?.[1]?.replace(/\/+$/u, "").trim();
  return handle && handle.length >= 2 ? handle : null;
}

const IG_HANDLE_GEO_TAIL_RE =
  /(?:[._](?:kg|kgs|kgz|bishkek|bish|kyrgyzstan|optom|official|officiall))+$/iu;

function humanizeInstagramHandle(handle: string): string {
  let h = handle.trim().replace(/^@+/, "");
  h = h.replace(IG_HANDLE_GEO_TAIL_RE, "");
  const words = h.split(/[._]+/).filter((w) => w.length > 0);
  if (words.length === 0) return "";
  return words
    .map((w) => {
      if (/^\d+$/.test(w)) return w;
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

/**
 * Витринное имя из пути Instagram (без точного handle в ответе).
 */
export function brandNameFromInstagramProfileUrl(
  url: string | null | undefined,
): string | null {
  const handle = extractInstagramHandleFromUrl(url);
  if (!handle) return null;
  const name = humanizeInstagramHandle(handle);
  if (name.length < 2 || name.length > 56) return null;
  if (isGenericCategoryLabel(name)) return null;
  return name;
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
  s = stripGenericShopSuffixFromStoreTitle(s);
  if (s.length < 2 || s.length > 56) return null;
  if (isGenericCategoryLabel(s)) return null;
  if (/^(?:null|undefined|none|n\/a)$/i.test(s)) return null;
  return s;
}

/** Телефоны, URL и @ники — только в блоке контактов, не в «О поставщике». */
export function stripPublicContactLeaksFromVendorText(text: string): string {
  let s = text.normalize("NFKC").trim();
  if (!s) return "";
  s = s.replace(/https?:\/\/\S+/gi, " ");
  s = s.replace(/\bwww\.\S+/gi, " ");
  s = s.replace(/@[\w][\w.]*/g, " ");
  s = s.replace(/\+?\d[\d\s\-()]{7,}\d/g, " ");
  s = s.replace(/\b\d{9,15}\b/g, " ");
  s = s.replace(/[\u0000-\u001F]/g, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s.replace(/[\s,.;:!?\-—•·]+$/u, "").trim();
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
 * Заголовок карточки: бренд из store_name, иначе ИИ / Instagram при заглушке.
 */
export function resolveCatalogStoreTitleForCard(opts: {
  dbStoreName: string;
  fallbackTitle: string;
  catalogBrandNameFromAi: string | null | undefined;
  instagramProfileUrl?: string | null;
}): { storeTitle: string; catalogBrandName: string | null } {
  const rawDb = normalizeStoreTitleInput(opts.dbStoreName);
  const stripped = stripGenericShopSuffixFromStoreTitle(rawDb);
  const base = stripped || normalizeStoreTitleInput(opts.fallbackTitle) || "Магазин";

  if (stripped.length > 0 && !isPlaceholderCatalogStoreName(stripped)) {
    return {
      storeTitle: polishDisplayStoreTitle(stripped),
      catalogBrandName: null,
    };
  }

  const brandAiRaw = sanitizeAiCatalogBrandName(opts.catalogBrandNameFromAi ?? "");
  const brandAi =
    brandAiRaw && !isGenericCategoryLabel(brandAiRaw) ? brandAiRaw : null;
  const brandIg = brandNameFromInstagramProfileUrl(opts.instagramProfileUrl);
  const brand = brandAi || brandIg;
  const useBrand = Boolean(brand) && isPlaceholderCatalogStoreName(base);
  return {
    storeTitle: useBrand ? polishDisplayStoreTitle(brand!) : base,
    catalogBrandName: brand || null,
  };
}
