import { routing } from "@/i18n/routing";
import { baseUrl } from "@/lib/site";

/**
 * URL segment locales (next-intl) vs HTML `lang` / BCP 47 language tags.
 * Routes stay `/kg` and `/tj`; HTML and hreflang use `ky` and `tg`.
 */
const ROUTE_LOCALE_TO_HTML_LANG: Record<string, string> = {
  ru: "ru",
  kk: "kk",
  kg: "ky",
  uz: "uz",
  tj: "tg",
};

/** hreflang values (not URL segments). */
const ROUTE_LOCALE_TO_HREFLANG: Record<string, string> = {
  ru: "ru",
  kk: "kk",
  kg: "ky",
  uz: "uz",
  tj: "tg",
};

/** Open Graph locale tags (language_territory). */
const ROUTE_LOCALE_TO_OG_LOCALE: Record<string, string> = {
  ru: "ru_RU",
  kk: "kk_KZ",
  kg: "ky_KG",
  uz: "uz_UZ",
  tj: "tg_TJ",
};

export function htmlLangFromRouteLocale(routeLocale: string): string {
  return ROUTE_LOCALE_TO_HTML_LANG[routeLocale] ?? routeLocale;
}

export function ogLocaleFromRouteLocale(routeLocale: string): string {
  return ROUTE_LOCALE_TO_OG_LOCALE[routeLocale] ?? routeLocale;
}

function normalizePath(pathWithoutLocale: string): string {
  if (pathWithoutLocale === "/" || pathWithoutLocale === "") return "";
  return pathWithoutLocale.startsWith("/")
    ? pathWithoutLocale
    : `/${pathWithoutLocale}`;
}

/**
 * hreflang alternates + x-default (always Russian URL = final 200, no locale-less redirect).
 */
export function hreflangAlternatesForPath(pathWithoutLocale: string): Record<string, string> {
  const path = normalizePath(pathWithoutLocale);
  const root = baseUrl();
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const tag = ROUTE_LOCALE_TO_HREFLANG[locale] ?? locale;
    languages[tag] = `${root}/${locale}${path}`;
  }
  languages["x-default"] = `${root}/ru${path}`;
  return languages;
}

export function ogAlternateLocalesForRouteLocale(routeLocale: string): string[] {
  return routing.locales
    .filter((l) => l !== routeLocale)
    .map((l) => ogLocaleFromRouteLocale(l));
}

/**
 * hreflang when each route locale has its own path (e.g. localized category slugs).
 * `pathsByRouteLocale` values are paths without locale prefix, e.g. `/categories/zhenskaya-odezhda-optom`.
 */
export function hreflangAlternatesFromLocalePaths(
  pathsByRouteLocale: Record<string, string>,
): Record<string, string> {
  const root = baseUrl();
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const path = normalizePath(pathsByRouteLocale[locale] ?? "");
    const tag = ROUTE_LOCALE_TO_HREFLANG[locale] ?? locale;
    languages[tag] = `${root}/${locale}${path}`;
  }
  const ruPath = normalizePath(pathsByRouteLocale.ru ?? "");
  languages["x-default"] = `${root}/ru${ruPath}`;
  return languages;
}
