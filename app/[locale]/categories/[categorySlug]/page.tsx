import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogBrowseCardGrid } from "@/components/catalog/CatalogBrowseCardGrid";
import { SeoCategoryLanding } from "@/components/seo/SeoCategoryLanding";
import { buildSeoCategoryMetadata } from "@/lib/catalog/seo-category-metadata";
import { getSeoCategoryVendorPageData } from "@/lib/catalog/seo-category-vendors";
import {
  buildCatalogCardSourceRowForPublishedVendor,
} from "@/lib/catalog/published-vendors";
import {
  getAllSeoCategoryStaticParams,
  resolveSeoCategoryBySlug,
} from "@/lib/catalog/seo-category-routes";
import { seoCategoryPageLabels } from "@/lib/seo/seo-page-labels";
import { isRouteLocale, type RouteLocale } from "@/lib/seo/route-locale";

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>;
};

export function generateStaticParams() {
  return getAllSeoCategoryStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const route = resolveSeoCategoryBySlug(locale, categorySlug);
  if (!route) return { title: "404" };
  const { totalCount } = await getSeoCategoryVendorPageData(route);
  return buildSeoCategoryMetadata(locale, route, totalCount);
}

export default async function SeoCategoryPage({ params }: Props) {
  const { locale, categorySlug } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);

  const route = resolveSeoCategoryBySlug(locale, categorySlug);
  if (!route) notFound();

  const routeLocale = locale as RouteLocale;
  const { vendors, totalCount } = await getSeoCategoryVendorPageData(route);
  const tBrowse = await getTranslations("Pages.catalogBrowse");
  const tTree = await getTranslations("catalogCategoryTree");
  const labels = seoCategoryPageLabels(routeLocale);

  const cards = vendors.map((v) =>
    buildCatalogCardSourceRowForPublishedVendor(v, {
      tBrowse,
      tTreeCategory: (key) => tTree(key),
      locale,
    }),
  );

  const vendorGrid =
    cards.length > 0 ? (
      <CatalogBrowseCardGrid
        cards={cards}
        favoriteKeys={[]}
        gridAriaLabel={labels.vendorPreviewTitle}
        viewProfileLabel={tBrowse("vendorCard.profileCta")}
        aboutStoreLabel={tBrowse("vendorCard.aboutStore")}
        collapseLabel={tBrowse("vendorCard.collapse")}
        expandLabel={tBrowse("vendorCard.expand")}
      />
    ) : null;

  return (
    <SeoCategoryLanding
      locale={routeLocale}
      route={route}
      vendorCount={totalCount}
      vendorGrid={vendorGrid}
      labels={{
        ...labels,
        vendorPreviewBody:
          totalCount > 0
            ? labels.vendorPreviewBodyWithVendors(totalCount)
            : labels.vendorPreviewBodyEmpty,
      }}
    />
  );
}
