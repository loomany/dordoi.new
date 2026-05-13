import type { RouteLocale } from "@/lib/seo/route-locale";
import {
  resolveSeoCategoryById,
  seoCategoryPath,
} from "@/lib/catalog/seo-category-routes";

/** Footer / home hub links (same path segment across locales). */
export const SEO_HUB_LINKS = [
  { href: "/catalog", labelKey: "catalog" },
  { href: "/suppliers", labelKey: "suppliers" },
  { href: "/rynok-dordoi", labelKey: "market" },
  { href: "/dordoi-optom", labelKey: "wholesale" },
  { href: "/buyers", labelKey: "buyers" },
  { href: "/kargo-dordoi", labelKey: "cargo" },
] as const;

/** Top categories for footer (8). */
export const FOOTER_CATEGORY_IDS = [
  "womens",
  "mens",
  "kids",
  "footwear",
  "bags-leather",
  "fabrics-notions",
  "home-textiles",
  "accessories",
] as const;

/** Popular categories on catalog browse (8). */
export const CATALOG_POPULAR_CATEGORY_IDS = [
  "womens",
  "mens",
  "kids",
  "footwear",
  "bags-leather",
  "fabrics-notions",
  "home-textiles",
  "accessories",
] as const;

/** Home page SEO deep links. */
export const HOME_SEO_HUB_LINKS = [
  { href: "/catalog", labelKey: "catalog" },
  { href: "/suppliers", labelKey: "suppliers" },
  { href: "/rynok-dordoi", labelKey: "market" },
  { href: "/dordoi-optom", labelKey: "wholesale" },
  { href: "/kargo-dordoi", labelKey: "cargo" },
] as const;

export const HOME_SEO_CATEGORY_IDS = [
  "womens",
  "footwear",
  "bags-leather",
] as const;

export type SeoInternalLink = {
  href: string;
  label: string;
};

export function seoCategoryLinksForLocale(
  locale: RouteLocale,
  categoryIds: readonly string[],
  labelForId: (id: string) => string,
): SeoInternalLink[] {
  const out: SeoInternalLink[] = [];
  for (const id of categoryIds) {
    const route = resolveSeoCategoryById(id);
    if (!route) continue;
    out.push({
      href: seoCategoryPath(locale, route),
      label: labelForId(id),
    });
  }
  return out;
}
