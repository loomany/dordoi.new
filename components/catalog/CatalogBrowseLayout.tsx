import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  CatalogCategoryFilter,
  CatalogCategoryFilterFallback,
} from "@/components/catalog/CatalogCategoryFilter";
import { CatalogBrowseCardGrid } from "@/components/catalog/CatalogBrowseCardGrid";
import type { ProviderSlug } from "@/data/provider-registry";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { fetchBuyerFavoriteKeySet } from "@/lib/favorites/buyer-favorites";
import { cn } from "@/lib/utils";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";
import { filterPublishedVendorsBySubcategorySlugs } from "@/lib/catalog/catalog-category-filter";
import {
  fetchPublishedVendorsForCatalog,
  vendorToCatalogCardSource,
  type CatalogCardSourceRow,
} from "@/lib/catalog/published-vendors";
import { mapVendorCategoryLabelsForLocale } from "@/lib/catalog/map-vendor-category-labels";
import { getShowcaseCatalogFields } from "@/lib/catalog/showcase-vendor-i18n";

const SAMPLE_IDS = ["0", "1", "2", "3", "4", "5"] as const;
const CATALOG_PAGE_SIZE = 10;

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

function buildCatalogBrowsePath(opts: {
  page?: number;
  categorySlugs: string[];
  compareWithPreview?: boolean;
}): string {
  const params = new URLSearchParams();
  if (opts.page != null && opts.page > 1) {
    params.set("page", String(opts.page));
  }
  if (opts.categorySlugs.length > 0) {
    params.set("cat", opts.categorySlugs.join(","));
  }
  if (opts.compareWithPreview) {
    params.set("compare", "1");
  }
  const q = params.toString();
  return q.length > 0 ? `/catalog?${q}` : "/catalog";
}

/** Full catalog browse chrome: header, filters, responsive card grid. */
export async function CatalogBrowseLayout({
  page,
  categorySlugs = [],
  compareWithPreview = false,
}: CatalogBrowseLayoutProps) {
  const t = await getTranslations("Pages.catalogBrowse");
  const tCatalog = await getTranslations("catalogCategories");
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

  // 1) Реальные опубликованные продавцы из БД (admin одобрил → видно в каталоге).
  const publishedVendors = await fetchPublishedVendorsForCatalog();
  const publishedVendorsFiltered = filterPublishedVendorsBySubcategorySlugs(
    publishedVendors,
    categorySlugs,
  );
  const fallbackStore = t("fallbackStoreTitle");
  const realCards: CatalogCardSourceRow[] = publishedVendorsFiltered.map((v) => {
    const row = vendorToCatalogCardSource({
      vendor: v,
      fallbackTitle: fallbackStore,
      addedLine: t("listingAdded", {
        date: formatProviderAddedDate(v.created_at, locale),
      }),
      updatedLine,
    });
    const showcase = getShowcaseCatalogFields(v.slug, t);
    if (showcase) {
      return { ...row, ...showcase };
    }
    return {
      ...row,
      categories: mapVendorCategoryLabelsForLocale(row.categories, (key) =>
        tCatalog(key),
      ),
    };
  });

  // 2) Плейсхолдеры из переводов — если в БД ещё нет approved или включён compare.
  const sampleCards: CatalogCardSourceRow[] = SAMPLE_IDS.map((id, index) => {
    const slug = SAMPLE_PROFILE_SLUGS[index];
    return {
      id,
      slug,
      href: slug ? `/catalog/${slug}` : undefined,
      title: t(`samples.${id}.title`),
      tagline: null,
      description: t(`samples.${id}.description`),
      categories: [],
      avatarUrl: null,
      hideAvatar: false,
      photoUrls: undefined,
      featured: false,
      addedLine,
      updatedLine,
    };
  });

  const cards: CatalogCardSourceRow[] = compareWithPreview
    ? [...realCards, ...sampleCards]
    : realCards.length > 0
      ? realCards
      : sampleCards;
  const cardCount = cards.length;
  const totalPages = Math.max(1, Math.ceil(cardCount / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(parsePositivePage(page), totalPages);
  const pageStart = (currentPage - 1) * CATALOG_PAGE_SIZE;
  const pageEnd = pageStart + CATALOG_PAGE_SIZE;
  const visibleCards = cards.slice(pageStart, pageEnd);
  const nf = new Intl.NumberFormat(locale);
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

            <header>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{t("title")}</h1>
              <p className="mt-3 max-w-3xl text-gray-500">{t("subtitle")}</p>
              <p className="mt-4 text-sm text-gray-400">{statsLine}</p>
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex min-h-11 flex-1 items-center">
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

        <div className="mt-10 space-y-6">
          <CatalogBrowseCardGrid
            key={currentPage}
            cards={visibleCards}
            favoriteKeys={[...favoriteKeys]}
            gridAriaLabel={t("gridAria")}
            viewProfileLabel={t("viewProfile")}
            aboutStoreLabel={t("cardAboutStore")}
            collapseLabel={t("cardCollapse")}
            expandLabel={t("cardExpand")}
            cardCategoryOne={t("cardCategoryOne")}
            cardCategoriesMany={t("cardCategoriesMany")}
          />

          {totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
              aria-label="Страницы каталога"
            >
              <Link
                href={buildCatalogBrowsePath({
                  page: Math.max(1, currentPage - 1),
                  categorySlugs,
                  compareWithPreview,
                })}
                aria-disabled={currentPage === 1}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-card text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] hover:bg-secondary/60",
                  currentPage === 1 && "pointer-events-none opacity-45",
                )}
              >
                <ChevronLeft className="size-4" aria-hidden />
                <span className="sr-only">Предыдущая страница</span>
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const active = pageNumber === currentPage;

                return (
                  <Link
                    key={pageNumber}
                    href={buildCatalogBrowsePath({
                      page: pageNumber,
                      categorySlugs,
                      compareWithPreview,
                    })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition-colors",
                      active
                        ? "border-primary/30 bg-secondary text-secondary-foreground"
                        : "border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-card text-card-foreground hover:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] hover:bg-secondary/60",
                    )}
                  >
                    {nf.format(pageNumber)}
                  </Link>
                );
              })}

              <Link
                href={buildCatalogBrowsePath({
                  page: Math.min(totalPages, currentPage + 1),
                  categorySlugs,
                  compareWithPreview,
                })}
                aria-disabled={currentPage === totalPages}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-card text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] hover:bg-secondary/60",
                  currentPage === totalPages && "pointer-events-none opacity-45",
                )}
              >
                <ChevronRight className="size-4" aria-hidden />
                <span className="sr-only">Следующая страница</span>
              </Link>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
