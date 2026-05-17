import { setRequestLocale } from "next-intl/server";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { createLoader } from "nuqs/server";
import { CatalogBrowseLayout } from "@/components/catalog/CatalogBrowseLayout";
import { buildCatalogPageMetadata } from "@/lib/catalog/catalog-page-seo";
import { normalizeCatalogCategorySlugs } from "@/lib/catalog/catalog-category-filter";
import { catalogQueryParsers } from "@/lib/catalog/catalog-query-parsers";
import { catalogAnswer } from "@/lib/seo/ai-answer-content";

/** Список каталога: пагинированный Supabase fetch (`fetchPublishedVendorsCatalogPage`). */
export const dynamic = "force-dynamic";

const loadCatalogSearchParams = createLoader(catalogQueryParsers);

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  const answer = catalogAnswer(locale);
  return (
    <>
      <SafePageSchemaJsonLd
        type="CollectionPage"
        locale={locale}
        path="/catalog"
        name="Каталог поставщиков Дордой"
        description="Каталог поставщиков рынка Дордой: категории, продавцы, байеры и услуги для оптовых покупателей."
        keywords={["каталог Дордой", "поставщики Дордой", "рынок Дордой"]}
      />
      <div className="mx-auto hidden w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <AiAnswerBlock {...answer} />
      </div>
      <CatalogBrowseLayout
        page={pageParsed ?? undefined}
        categorySlugs={categorySlugs}
        searchQuery={searchParsed ?? ""}
        compareWithPreview={compare === "1"}
      />
    </>
  );
}
