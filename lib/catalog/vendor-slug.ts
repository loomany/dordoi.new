/**
 * SEO-slug для карточки продавца в каталоге (/catalog/{slug}).
 *
 * Цели:
 *  - стабильный URL: slug заполняется один раз при approve и далее не меняется;
 *  - кириллица (ru/kg) транслитерируется в латиницу — без `%D1%8B`-знаков в URL;
 *  - результат подходит для всех локалей и попадает в Google/Yandex как читаемый путь;
 *  - при пустом / слишком коротком названии — fallback `store-{idShort}`.
 */

const TRANSLIT_MAP: Record<string, string> = {
  // Базовая ru/kg кириллица
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // KG-специфичные буквы
  ң: "ng", ө: "o", ү: "u",
};

const SLUG_MAX_LEN = 80;

/** Базовая транслитерация: убирает диакритику, приводит к ASCII a-z0-9-. */
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

/**
 * Превращает любой текст в slug-кандидат.
 * Возвращает пустую строку, если ничего пригодного не осталось.
 */
export function slugifyVendorTitle(title: string | null | undefined): string {
  if (!title) {
    return "";
  }
  const translit = transliterate(String(title));
  const slug = translit
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LEN)
    .replace(/-+$/g, "");
  return slug;
}

/**
 * Готовит финальный slug для записи в БД.
 * Если транслит дал пустую/слишком короткую строку — fallback на `store-{idShort}`.
 */
export function buildVendorSlug(opts: {
  storeName: string | null | undefined;
  vendorId: string;
}): string {
  const base = slugifyVendorTitle(opts.storeName);
  const idShort = opts.vendorId.replace(/-/g, "").slice(0, 8);
  if (base.length >= 2) {
    return base;
  }
  return `store-${idShort}`;
}

/**
 * Если выбранный slug уже занят — добавить короткий ID-суффикс
 * (детерминированно, чтобы повторный вызов при approve дал тот же URL).
 */
export function buildVendorSlugWithIdSuffix(opts: {
  storeName: string | null | undefined;
  vendorId: string;
}): string {
  const idShort = opts.vendorId.replace(/-/g, "").slice(0, 6);
  const base = slugifyVendorTitle(opts.storeName);
  if (base.length >= 2) {
    return `${base}-${idShort}`;
  }
  return `store-${idShort}`;
}
