import { SEO_CATEGORY_ROUTES, type SeoCategoryRoute } from "@/lib/catalog/seo-category-route-data";
import { ROUTE_LOCALES, type RouteLocale, isRouteLocale } from "@/lib/seo/route-locale";

export type { SeoCategoryRoute } from "@/lib/catalog/seo-category-route-data";
export { SEO_CATEGORY_ROUTES } from "@/lib/catalog/seo-category-route-data";

const ROUTE_BY_ID = new Map(SEO_CATEGORY_ROUTES.map((r) => [r.id, r]));

const SLUG_INDEX = new Map<string, SeoCategoryRoute>();
for (const route of SEO_CATEGORY_ROUTES) {
  for (const locale of ROUTE_LOCALES) {
    SLUG_INDEX.set(`${locale}:${route.slugsByLocale[locale]}`, route);
  }
}

const MAIN_ID_INDEX = new Map<string, SeoCategoryRoute>();
for (const route of SEO_CATEGORY_ROUTES) {
  for (const mainId of route.sourceCategoryIds) {
    if (!MAIN_ID_INDEX.has(mainId)) {
      MAIN_ID_INDEX.set(mainId, route);
    }
  }
}

export function resolveSeoCategoryBySlug(
  locale: string,
  slug: string,
): SeoCategoryRoute | undefined {
  if (!isRouteLocale(locale)) return undefined;
  return SLUG_INDEX.get(`${locale}:${slug.trim()}`);
}

export function resolveSeoCategoryById(id: string): SeoCategoryRoute | undefined {
  return ROUTE_BY_ID.get(id);
}

export function resolveSeoCategoryForMainId(mainId: string): SeoCategoryRoute | undefined {
  return MAIN_ID_INDEX.get(mainId);
}

export function seoCategoryPath(locale: RouteLocale, route: SeoCategoryRoute): string {
  return `/categories/${route.slugsByLocale[locale]}`;
}

export function seoCategoryPathsByLocale(route: SeoCategoryRoute): Record<RouteLocale, string> {
  const out = {} as Record<RouteLocale, string>;
  for (const locale of ROUTE_LOCALES) {
    out[locale] = seoCategoryPath(locale, route);
  }
  return out;
}

export function getRelatedSeoCategories(
  route: SeoCategoryRoute,
  limit = 6,
): SeoCategoryRoute[] {
  const out: SeoCategoryRoute[] = [];
  for (const id of route.relatedCategoryIds) {
    const related = resolveSeoCategoryById(id);
    if (related) out.push(related);
    if (out.length >= limit) break;
  }
  return out;
}

export function getAllSeoCategoryStaticParams(): Array<{
  locale: RouteLocale;
  categorySlug: string;
}> {
  const params: Array<{ locale: RouteLocale; categorySlug: string }> = [];
  for (const locale of ROUTE_LOCALES) {
    for (const route of SEO_CATEGORY_ROUTES) {
      params.push({ locale, categorySlug: route.slugsByLocale[locale] });
    }
  }
  return params;
}
