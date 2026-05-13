import { cache } from "react";

import { fetchPublishedVendorsCatalogPage } from "@/lib/catalog/published-vendors";
import type { SeoCategoryRoute } from "@/lib/catalog/seo-category-route-data";

const SEO_CATEGORY_VENDOR_PAGE_SIZE = 12;

export type SeoCategoryVendorPageData = {
  vendors: Awaited<ReturnType<typeof fetchPublishedVendorsCatalogPage>>["vendors"];
  totalCount: number;
};

/** Shared fetch for category page render + metadata (React cache dedupes per request). */
export const getSeoCategoryVendorPageData = cache(
  async (route: SeoCategoryRoute): Promise<SeoCategoryVendorPageData> => {
    const result = await fetchPublishedVendorsCatalogPage({
      page: 1,
      pageSize: SEO_CATEGORY_VENDOR_PAGE_SIZE,
      subcategorySlugs: route.sourceCategoryIds,
    });
    return {
      vendors: result.vendors,
      totalCount: result.totalCount,
    };
  },
);
