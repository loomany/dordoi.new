/**
 * SEO-slug для карточки продавца в каталоге (/catalog/{slug}).
 *
 * Stage 1+: новые slug строятся из категории + короткий суффикс из UUID,
 * без store_name / Instagram / телефона. Старые slug не меняются.
 */

const TRANSLIT_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ң: "ng", ө: "o", ү: "u",
};

const SLUG_MAX_LEN = 80;

const CATEGORY_PREFIX_RULES: { test: RegExp; prefix: string }[] = [
  { test: /women|женск|womens|woman/i, prefix: "postavshik-zhenskoy-odezhdy" },
  { test: /men|мужск|mens/i, prefix: "postavshik-muzhskoy-odezhdy" },
  { test: /kid|дет|children/i, prefix: "postavshik-detskoy-odezhdy" },
  { test: /shoe|обув|footwear|boot/i, prefix: "postavshik-obuvi" },
  { test: /bag|сумк|leather/i, prefix: "postavshik-sumok" },
  { test: /fabric|ткан|textile|notion/i, prefix: "postavshik-tkani" },
  { test: /accessor|аксессуар/i, prefix: "postavshik-aksessuarov" },
  { test: /home.?text|текстил|bedding/i, prefix: "postavshik-tekstilya" },
  { test: /sport|спорт/i, prefix: "postavshik-sporta" },
  { test: /underwear|бель/i, prefix: "postavshik-belya" },
];

/** @deprecated Используется только в скриптах/legacy; новые slug — через buildVendorSlug. */
function transliterate(input: string): string {
  const lower = input.normalize("NFKD").toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (Object.prototype.hasOwnProperty.call(TRANSLIT_MAP, ch)) {
      out += TRANSLIT_MAP[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else {
      out += " ";
    }
  }
  return out;
}

/** @deprecated Legacy slugify from title — не для новых публикаций. */
export function slugifyVendorTitle(title: string | null | undefined): string {
  if (!title) return "";
  const translit = transliterate(String(title));
  return translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LEN)
    .replace(/-+$/g, "");
}

export function categoryPrefixFromVendorCategories(
  categories: string[] | null | undefined,
): string {
  const hay = (categories ?? []).join(" ").toLowerCase();
  for (const rule of CATEGORY_PREFIX_RULES) {
    if (rule.test.test(hay)) return rule.prefix;
  }
  return "postavshik";
}

function suffixFromVendorId(vendorId: string, length: 4 | 6): string {
  const compact = vendorId.replace(/-/g, "");
  return length === 4 ? compact.slice(-4) : compact.slice(0, 6);
}

/**
 * Безопасный slug для новой публикации: category-prefix + 4 символа из UUID.
 */
export function buildVendorSlug(opts: {
  storeName?: string | null | undefined;
  vendorId: string;
  categories?: string[] | null;
}): string {
  const prefix = categoryPrefixFromVendorCategories(opts.categories);
  return `${prefix}-${suffixFromVendorId(opts.vendorId, 4)}`;
}

/** При коллизии — более длинный детерминированный суффикс. */
export function buildVendorSlugWithIdSuffix(opts: {
  storeName?: string | null | undefined;
  vendorId: string;
  categories?: string[] | null;
}): string {
  const prefix = categoryPrefixFromVendorCategories(opts.categories);
  return `${prefix}-${suffixFromVendorId(opts.vendorId, 6)}`;
}
