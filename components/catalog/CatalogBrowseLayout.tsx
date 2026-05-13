import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CatalogCategoryFilter,
  CatalogCategoryFilterFallback,
} from "@/components/catalog/CatalogCategoryFilter";
import { CatalogBrowseCardGrid } from "@/components/catalog/CatalogBrowseCardGrid";
import { CatalogBuyerSpotlight } from "@/components/catalog/CatalogBuyerSpotlight";
import { CatalogPaginationNav } from "@/components/catalog/CatalogPaginationNav";
import type { ProviderSlug } from "@/data/provider-registry";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { fetchBuyerFavoriteKeySet } from "@/lib/favorites/buyer-favorites";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";
import { filterPublishedVendorsBySubcategorySlugs } from "@/lib/catalog/catalog-category-filter";
import {
  buildCatalogCardSourceRowForPublishedVendor,
  fetchPublishedVendorsCatalogPage,
  fetchPublishedVendorsForCatalog,
  type CatalogCardSourceRow,
} from "@/lib/catalog/published-vendors";

const SAMPLE_IDS = ["0", "1", "2", "3", "4", "5"] as const;
const CATALOG_PAGE_SIZE = 12;

/** Profile slugs for sample rows — aligns with `data/provider-registry`. */
const SAMPLE_PROFILE_SLUGS: (ProviderSlug | undefined)[] = [
  "container-04-12",
  "tkani-dordoi",
  undefined,
  undefined,
  undefined,
  undefined,
];

type CatalogBrowseLayoutProps = {
  page?: number | string;
  /** Slug подкатегорий из `?cat=` (после нормализации). */
  categorySlugs?: string[];
  /**
   * Debug: после реальных карточек добавляет sample-строки из переводов.
   * Включается через `/catalog?compare=1`.
   */
  compareWithPreview?: boolean;
};

function parsePositivePage(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") {
    return 1;
  }
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Full catalog browse chrome: header, filters, responsive card grid. */
export async function CatalogBrowseLayout({
  page,
  categorySlugs = [],
  compareWithPreview = false,
}: CatalogBrowseLayoutProps) {
  const t = await getTranslations("Pages.catalogBrowse");
  const tTree = await getTranslations("catalogCategoryTree");
  const locale = await getLocale();
  const profile = await getSessionProfile();
  const favoriteKeys = profile
    ? await fetchBuyerFavoriteKeySet(profile.userId)
    : new Set<string>();
  const listedNow = new Date();
  const addedLine = t("listingAdded", {
    date: formatProviderAddedDate(listedNow.toISOString(), locale),
  });
  const updatedLine = t("listingUpdated", {
    relative: formatListingUpdatedToday(locale),
  });

  const sampleCards: CatalogCardSourceRow[] = SAMPLE_IDS.map((id, index) => {
    const slug = SAMPLE_PROFILE_SLUGS[index];
    return {
      id,
      slug,
      href: slug ? `/catalog/${slug}` : undefined,
      display: {
        storeTitle: t(`samples.${id}.title`),
        subtitle: null,
        description: t(`samples.${id}.description`),
        tradeType: "hybrid",
        commerce: {},
        logoUrl: null,
        categories: [],
        instagramUrl: null,
      },
      photoUrls: undefined,
      featured: false,
      addedLine,
      updatedLine,
    };
  });

  const nf = new Intl.NumberFormat(locale);
  let visibleCards: CatalogCardSourceRow[];
  let totalPages: number;
  let currentPage: number;
  let cardCount: number;
  let pageStart: number;
  let pageEnd: number;

  if (compareWithPreview) {
    // Debug `/catalog?compare=1` — прежний full fetch + sample rows в памяти.
    const publishedVendors = await fetchPublishedVendorsForCatalog();
    const publishedVendorsFiltered = filterPublishedVendorsBySubcategorySlugs(
      publishedVendors,
      categorySlugs,
    );
    const realCards: CatalogCardSourceRow[] = publishedVendorsFiltered.map((v) =>
      buildCatalogCardSourceRowForPublishedVendor(v, {
        tBrowse: t,
        tTreeCategory: (key) => tTree(key),
        locale,
      }),
    );
    const cards = [...realCards, ...sampleCards];
    cardCount = cards.length;
    totalPages = Math.max(1, Math.ceil(cardCount / CATALOG_PAGE_SIZE));
    currentPage = Math.min(parsePositivePage(page), totalPages);
    pageStart = (currentPage - 1) * CATALOG_PAGE_SIZE;
    pageEnd = pageStart + CATALOG_PAGE_SIZE;
    visibleCards = cards.slice(pageStart, pageEnd);
  } else {
    const requestedPage = parsePositivePage(page);
    let catalogPage = await fetchPublishedVendorsCatalogPage({
      page: requestedPage,
      pageSize: CATALOG_PAGE_SIZE,
      subcategorySlugs: categorySlugs,
    });

    cardCount = catalogPage.totalCount;
    totalPages = Math.max(1, Math.ceil(cardCount / CATALOG_PAGE_SIZE));
    currentPage = catalogPage.page;

    if (cardCount > 0 && requestedPage > totalPages) {
      catalogPage = await fetchPublishedVendorsCatalogPage({
        page: totalPages,
        pageSize: CATALOG_PAGE_SIZE,
        subcategorySlugs: categorySlugs,
      });
      currentPage = totalPages;
    }

    const realCards: CatalogCardSourceRow[] = catalogPage.vendors.map((v) =>
      buildCatalogCardSourceRowForPublishedVendor(v, {
        tBrowse: t,
        tTreeCategory: (key) => tTree(key),
        locale,
      }),
    );

    if (cardCount === 0) {
      visibleCards = sampleCards;
      cardCount = sampleCards.length;
      totalPages = 1;
      currentPage = 1;
      pageStart = 0;
      pageEnd = sampleCards.length;
    } else {
      visibleCards = realCards;
      pageStart = (currentPage - 1) * CATALOG_PAGE_SIZE;
      pageEnd = pageStart + visibleCards.length;
    }
  }

  const statsLine = t("stats", {
    from: nf.format(cardCount > 0 ? pageStart + 1 : 0),
    to: nf.format(Math.min(pageEnd, cardCount)),
    total: nf.format(cardCount),
  });

  return (
    <div className="bg-[#FAFAF8] pb-12 pt-5 sm:pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-4">
          <nav aria-label={t("breadcrumbNav")} className="text-xs text-gray-400">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="transition-colors hover:text-gray-600">
                  {t("breadcrumbHome")}
                </Link>
              </li>
              <li aria-hidden className="text-gray-300">
                /
              </li>
              <li className="text-gray-500">{t("breadcrumbCatalog")}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start lg:gap-x-6">
            <div className="flex flex-col gap-3 lg:col-span-2">
              <header>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                  {t("title")}
                </h1>
                <p className="mt-3 max-w-3xl text-gray-500">{t("subtitle")}</p>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-500">
                  {t("intro")}
                </p>
                <p className="mt-4 text-sm text-gray-400">{statsLine}</p>
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex min-h-11 min-w-0 flex-1 items-center">
                  <span className="sr-only">{t("searchLabel")}</span>
                  <span className="pointer-events-none absolute left-4 text-gray-400">
                    <Search className="size-4 stroke-[1.5]" aria-hidden />
                  </span>
                  <input
                    type="search"
                    name="catalog-q"
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchLabel")}
                    className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground/70 outline-none transition-shadow focus:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)]"
                    autoComplete="off"
                  />
                </label>

                <Suspense fallback={<CatalogCategoryFilterFallback />}>
                  <CatalogCategoryFilter />
                </Suspense>
              </div>
            </div>

            <CatalogBuyerSpotlight className="lg:col-start-3 lg:row-span-2 lg:row-start-1" />
          </div>
        </div>

        <div className="mt-6">
          <CatalogBrowseCardGrid
            key={currentPage}
            cards={visibleCards}
            favoriteKeys={[...favoriteKeys]}
            gridAriaLabel={t("gridAria")}
            viewProfileLabel={t("viewProfile")}
            aboutStoreLabel={t("cardAboutStore")}
            collapseLabel={t("cardCollapse")}
            expandLabel={t("cardExpand")}
          />

          {totalPages > 1 ? (
            <div className="mt-8 sm:mt-10">
              <div
                className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent dark:via-border/80"
                aria-hidden
              />
              <CatalogPaginationNav
                totalPages={totalPages}
                currentPage={currentPage}
                categorySlugs={categorySlugs}
                compareWithPreview={compareWithPreview}
                locale={locale}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
