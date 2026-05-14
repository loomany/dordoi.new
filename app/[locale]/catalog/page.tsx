import { setRequestLocale } from "next-intl/server";
import { createLoader } from "nuqs/server";
import { CatalogBrowseLayout } from "@/components/catalog/CatalogBrowseLayout";
import { buildCatalogPageMetadata } from "@/lib/catalog/catalog-page-seo";
import { normalizeCatalogCategorySlugs } from "@/lib/catalog/catalog-category-filter";
import { catalogQueryParsers } from "@/lib/catalog/catalog-query-parsers";

/** Список каталога: пагинированный Supabase fetch (`fetchPublishedVendorsCatalogPage`). */
export const dynamic = "force-dynamic";

const loadCatalogSearchParams = createLoader(catalogQueryParsers);

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; compare?: string; cat?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  return buildCatalogPageMetadata(locale, sp);
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const { compare } = sp;
  const { page: pageParsed, cat: catParsed, search: searchParsed } =
    loadCatalogSearchParams(sp);
  setRequestLocale(locale);
  const categorySlugs = normalizeCatalogCategorySlugs(catParsed ?? []);
  return (
    <CatalogBrowseLayout
      page={pageParsed ?? undefined}
      categorySlugs={categorySlugs}
      searchQuery={searchParsed ?? ""}
      compareWithPreview={compare === "1"}
    />
  );
}
