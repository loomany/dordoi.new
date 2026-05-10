import { setRequestLocale } from "next-intl/server";
import { createLoader } from "nuqs/server";
import { CatalogBrowseLayout } from "@/components/catalog/CatalogBrowseLayout";
import { buildSeoMetadata } from "@/lib/build-seo";
import { normalizeCatalogCategorySlugs } from "@/lib/catalog/catalog-category-filter";
import { catalogQueryParsers } from "@/lib/catalog/catalog-query-parsers";

const loadCatalogSearchParams = createLoader(catalogQueryParsers);

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; compare?: string; cat?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/catalog", "Seo.catalog");
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const { compare } = sp;
  const { page: pageParsed, cat: catParsed } = loadCatalogSearchParams(sp);
  setRequestLocale(locale);
  const categorySlugs = normalizeCatalogCategorySlugs(catParsed ?? []);
  return (
    <CatalogBrowseLayout
      page={pageParsed ?? undefined}
      categorySlugs={categorySlugs}
      compareWithPreview={compare === "1"}
    />
  );
}
