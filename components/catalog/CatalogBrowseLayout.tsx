import { CatalogBrowseResultsGate } from "@/components/catalog/CatalogBrowseResultsGate";
import { CatalogBrowseRefreshShell } from "@/components/catalog/CatalogBrowseRefreshShell";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  CatalogCategoryFilter,
  CatalogCategoryFilterFallback,
} from "@/components/catalog/CatalogCategoryFilter";
import {
  CatalogBrowseSearch,
  CatalogBrowseSearchFallback,
} from "@/components/catalog/CatalogBrowseSearch";
import { CatalogBrowseCardGrid } from "@/components/catalog/CatalogBrowseCardGrid";
import { CatalogCheckoutResume } from "@/components/catalog/CatalogCheckoutResume";
import { CatalogPopularCategories } from "@/components/catalog/CatalogPopularCategories";
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
import { filterVendorsByCatalogSearch } from "@/lib/catalog/catalog-vendor-search";
import { hasFullCatalogAccess } from "@/lib/catalog/catalog-access";
import { guestFreeCatalogCardLimit } from "@/lib/catalog/catalog-guest-access";
import {
  countMainCatalogHubFreePreview,
  orderVendorsForMainCatalogHub,
} from "@/lib/catalog/catalog-main-hub-order";
import { applyCatalogAccessToVendors } from "@/lib/catalog/catalog-vendor-access";
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
  /** Поисковый запрос из `?search=`. */
  searchQuery?: string;
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
  searchQuery = "",
  compareWithPreview = false,
}: CatalogBrowseLayoutProps) {
  const t = await getTranslations("Pages.catalogBrowse");
  const tTree = await getTranslations("catalogCategoryTree");
  const locale = await getLocale();
  const profile = await getSessionProfile();
  const catalogAccessUnlocked = await hasFullCatalogAccess(profile);
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
  const categoryFilterActive = categorySlugs.length > 0;
  const activeSearch = searchQuery.trim();
  let visibleCards: CatalogCardSourceRow[];
  let totalPages: number;
  let currentPage: number;
  let cardCount: number;
  let pageStart: number;
  let pageEnd: number;
  let guestFreeCardLimit = guestFreeCatalogCardLimit(categoryFilterActive, {
    categoryFilterSlugs: categorySlugs,
  });

  if (compareWithPreview) {
    // Debug `/catalog?compare=1` — прежний full fetch + sample rows в памяти.
    const publishedVendors = await fetchPublishedVendorsForCatalog();
    const publishedVendorsFiltered = filterPublishedVendorsBySubcategorySlugs(
      publishedVendors,
      categorySlugs,
    );
    const searchFiltered = activeSearch
      ? filterVendorsByCatalogSearch(publishedVendorsFiltered, activeSearch)
      : publishedVendorsFiltered;
    const orderedVendors =
      categoryFilterActive || activeSearch
        ? searchFiltered
        : orderVendorsForMainCatalogHub(searchFiltered);
    guestFreeCardLimit = guestFreeCatalogCardLimit(categoryFilterActive, {
      categoryFilterSlugs: categorySlugs,
      totalVendorsInFilter: orderedVendors.length,
      mainHubFreePreviewCount:
        !categoryFilterActive && !activeSearch
          ? countMainCatalogHubFreePreview(orderedVendors)
          : undefined,
    });
    const accessibleVendors = applyCatalogAccessToVendors(
      orderedVendors,
      {
        hasFullAccess: catalogAccessUnlocked,
        globalOffset: 0,
        freeLimit: guestFreeCardLimit,
      },
    );
    const realCards: CatalogCardSourceRow[] = accessibleVendors.map((v) =>
      buildCatalogCardSourceRowForPublishedVendor(v, {
        tBrowse: t,
        tTreeCategory: (key) => tTree(key),
        locale,
        categoryFilterSlugs: categorySlugs,
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
      searchQuery: activeSearch || undefined,
    });

    cardCount = catalogPage.totalCount;
    guestFreeCardLimit = guestFreeCatalogCardLimit(categoryFilterActive, {
      categoryFilterSlugs: categorySlugs,
      totalVendorsInFilter: cardCount,
      mainHubFreePreviewCount: catalogPage.mainHubFreePreviewCount,
    });
    totalPages = Math.max(1, Math.ceil(cardCount / CATALOG_PAGE_SIZE));
    currentPage = catalogPage.page;

    if (cardCount > 0 && requestedPage > totalPages) {
      catalogPage = await fetchPublishedVendorsCatalogPage({
        page: totalPages,
        pageSize: CATALOG_PAGE_SIZE,
        subcategorySlugs: categorySlugs,
        searchQuery: activeSearch || undefined,
      });
      currentPage = totalPages;
    }

    const pageOffset = (currentPage - 1) * CATALOG_PAGE_SIZE;
    const accessibleVendors = applyCatalogAccessToVendors(catalogPage.vendors, {
      hasFullAccess: catalogAccessUnlocked,
      globalOffset: pageOffset,
      freeLimit: guestFreeCardLimit,
    });
    const realCards: CatalogCardSourceRow[] = accessibleVendors.map((v) =>
      buildCatalogCardSourceRowForPublishedVendor(v, {
        tBrowse: t,
        tTreeCategory: (key) => tTree(key),
        locale,
        categoryFilterSlugs: categorySlugs,
      }),
    );

    if (cardCount === 0 && activeSearch) {
      visibleCards = [];
      totalPages = 1;
      currentPage = 1;
      pageStart = 0;
      pageEnd = 0;
    } else if (cardCount === 0) {
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
    <CatalogBrowseRefreshShell>
    <>
      <CatalogCheckoutResume />
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
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
                  {t("introBuyers")}
                </p>
                <p className="mt-4 text-sm text-gray-400">{statsLine}</p>
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Suspense fallback={<CatalogBrowseSearchFallback />}>
                  <CatalogBrowseSearch />
                </Suspense>

                <Suspense fallback={<CatalogCategoryFilterFallback />}>
                  <CatalogCategoryFilter />
                </Suspense>
              </div>
            </div>

            <CatalogBuyerSpotlight className="lg:col-start-3 lg:row-span-2 lg:row-start-1" />
          </div>
        </div>

        <div className="mt-6">
          <CatalogBrowseResultsGate
            skeletonCount={Math.max(visibleCards.length, CATALOG_PAGE_SIZE)}
            showPaginationSkeleton={totalPages > 1}
          >
            <CatalogBrowseCardGrid
            key={currentPage}
            cards={visibleCards}
            favoriteKeys={[...favoriteKeys]}
            cardGlobalOffset={pageStart}
            hasFullCatalogAccess={catalogAccessUnlocked}
            guestFreeCardLimit={guestFreeCardLimit}
            paywallCopy={{
              title: t("paywall.title"),
              body: t("paywall.body"),
              ctaPayment: t("paywall.ctaPayment"),
              closeDialog: t("paywall.closeDialog"),
              planMonthlyPrice: t("paywall.planMonthlyPrice"),
              checkoutError: t("paywall.checkoutError"),
              checkoutLoading: t("paywall.checkoutLoading"),
            }}
            lockedCardUnlockLabel={t("paywall.unlockCard")}
            gridAriaLabel={t("gridAria")}
            viewProfileLabel={t("viewProfile")}
            aboutStoreLabel={t("cardAboutStore")}
            collapseLabel={t("cardCollapse")}
            expandLabel={t("cardExpand")}
          />

          {cardCount === 0 && activeSearch ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("searchNoResults", { query: activeSearch })}
            </p>
          ) : null}

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
                searchQuery={activeSearch}
                compareWithPreview={compareWithPreview}
                locale={locale}
              />
              <CatalogPopularCategories className="mt-8" />
            </div>
          ) : (
            <div className="mt-8 sm:mt-10">
              <CatalogPopularCategories />
            </div>
          )}
          </CatalogBrowseResultsGate>
        </div>
      </div>
    </div>
    </>
    </CatalogBrowseRefreshShell>
  );
}
