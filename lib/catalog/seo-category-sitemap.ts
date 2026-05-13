import { fetchPublishedVendorsCatalogPage } from "@/lib/catalog/published-vendors";
import {
  SEO_CATEGORY_ROUTES,
  type SeoCategoryRoute,
} from "@/lib/catalog/seo-category-route-data";

export async function getSeoCategoryVendorCount(
  route: SeoCategoryRoute,
): Promise<number> {
  const result = await fetchPublishedVendorsCatalogPage({
    page: 1,
    pageSize: 1,
    subcategorySlugs: route.sourceCategoryIds,
  });
  return result.totalCount;
}

export function isSeoCategoryIndexableForSitemap(
  route: SeoCategoryRoute,
  vendorCount: number,
): boolean {
  if (!route.sitemapEnabled) return false;
  if (route.indexPolicy === "noindex") return false;
  return vendorCount >= route.minVendorsToIndex;
}

/** Categories eligible for sitemap (vendor count checked per route). */
export async function getIndexableSeoCategoriesForSitemap(): Promise<
  SeoCategoryRoute[]
> {
  const counts = await Promise.all(
    SEO_CATEGORY_ROUTES.map(async (route) => ({
      route,
      count: await getSeoCategoryVendorCount(route),
    })),
  );
  return counts
    .filter(({ route, count }) => isSeoCategoryIndexableForSitemap(route, count))
    .map(({ route }) => route);
}
