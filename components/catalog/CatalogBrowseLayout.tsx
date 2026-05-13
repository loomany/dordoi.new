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
  buildCatalogCardSourceRowForPublishedVendor,
  fetchPublishedVendorsForCatalog,
  type CatalogCardSourceRow,
} from "@/lib/catalog/published-vendors";

const SAMPLE_IDS = ["0", "1", "2", "3", "4", "5"] as const;
const CATALOG_PAGE_SIZE = 12;
/** First page numbers always listed before an ellipsis (SaaS-style trail). */
const PAGINATION_LEADING_PAGES = 7;

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

/** Compact page list: `1 2 … 5 6 7 … 39` or `1–7 … 39` at start — one row, no wrap. */
type CatalogPaginationItem = number | "ellipsis";

function getCatalogPaginationItems(
  totalPages: number,
  currentPage: number,
  delta = 1,
): CatalogPaginationItem[] {
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const range: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === totalPages ||
      i <= PAGINATION_LEADING_PAGES ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }
  const out: CatalogPaginationItem[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        out.push(prev + 1);
      } else if (i - prev > 2) {
        out.push("ellipsis");
      }
    }
    out.push(i);
    prev = i;
  }
  return out;
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

  // 1) Реальные опубликованные продавцы из БД (admin одобрил → видно в каталоге).
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

  // 2) Плейсхолдеры из переводов — если в БД ещё нет approved или включён compare.
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

        <div className="mt-10">
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
              <nav
                className="flex flex-nowrap items-center justify-center gap-1 pt-8 sm:gap-1.5 sm:pt-10"
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
                  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card px-2 text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground",
                  currentPage === 1 && "pointer-events-none opacity-45",
                )}
              >
                <ChevronLeft className="size-4" aria-hidden />
                <span className="sr-only">Предыдущая страница</span>
              </Link>

              <div className="flex min-w-0 flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
                {getCatalogPaginationItems(totalPages, currentPage).map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${idx}`}
                      className="inline-flex h-9 shrink-0 select-none items-center px-1 text-sm text-muted-foreground/80"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={buildCatalogBrowsePath({
                        page: item,
                        categorySlugs,
                        compareWithPreview,
                      })}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={cn(
                        "inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border px-2 text-sm font-medium tabular-nums transition-colors",
                        item === currentPage
                          ? "border-primary/35 bg-primary text-primary-foreground shadow-sm"
                          : "border-border/80 bg-card text-card-foreground shadow-sm hover:bg-muted/50",
                      )}
                    >
                      {nf.format(item)}
                    </Link>
                  ),
                )}
              </div>

              <Link
                href={buildCatalogBrowsePath({
                  page: Math.min(totalPages, currentPage + 1),
                  categorySlugs,
                  compareWithPreview,
                })}
                aria-disabled={currentPage === totalPages}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card px-2 text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground",
                  currentPage === totalPages && "pointer-events-none opacity-45",
                )}
              >
                <ChevronRight className="size-4" aria-hidden />
                <span className="sr-only">Следующая страница</span>
              </Link>
            </nav>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
