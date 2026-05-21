import type { RouteLocale } from "@/lib/seo/route-locale";
import { isRouteLocale } from "@/lib/seo/route-locale";
import {
  resolveSeoCategoryById,
  resolveSeoCategoryBySlug,
  seoCategoryPath,
} from "@/lib/catalog/seo-category-routes";

/** Footer hub links — compact subset (4). */
export const FOOTER_HUB_LINKS = [
  { href: "/catalog", labelKey: "catalog" },
  { href: "/suppliers", labelKey: "suppliers" },
  { href: "/buyers", labelKey: "buyers" },
  { href: "/kargo-dordoi", labelKey: "cargo" },
] as const;

/** Footer / home hub links (same path segment across locales). */
export const SEO_HUB_LINKS = [
  { href: "/catalog", labelKey: "catalog" },
  { href: "/suppliers", labelKey: "suppliers" },
  { href: "/rynok-dordoi", labelKey: "market" },
  { href: "/dordoi-optom", labelKey: "wholesale" },
  { href: "/buyers", labelKey: "buyers" },
  { href: "/kargo-dordoi", labelKey: "cargo" },
] as const;

/** Top commercial categories for footer. */
export const FOOTER_CATEGORY_IDS = [
  "womens",
  "mens",
  "kids",
  "footwear",
  "fabrics-notions",
  "bags-leather",
  "underwear-swim",
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


export type SeoInternalLink = {
  href: string;
  label: string;
};

const CATEGORY_HREF_RE = /^\/categories\/([^/?#]+)$/;

/** Map legacy RU category paths in link seeds to locale-specific SEO category URLs. */
export function localizedCategoryHref(locale: string, href: string): string {
  if (!isRouteLocale(locale)) return href;
  const match = href.match(CATEGORY_HREF_RE);
  if (!match) return href;
  const route = resolveSeoCategoryBySlug("ru", match[1]);
  if (!route) return href;
  return seoCategoryPath(locale, route);
}

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
