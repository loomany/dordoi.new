import { getLocale, getTranslations } from "next-intl/server";
import { ChevronDown, LayoutGrid, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import type { ProviderSlug } from "@/data/provider-registry";
import {
  formatListingUpdatedToday,
  formatProviderAddedDate,
} from "@/lib/provider-dates";

const SAMPLE_IDS = ["0", "1", "2", "3", "4", "5"] as const;

/** Profile slugs for sample rows — aligns with `data/provider-registry`. */
const SAMPLE_PROFILE_SLUGS: (ProviderSlug | undefined)[] = [
  "container-04-12",
  "tkani-dordoi",
  undefined,
  undefined,
  undefined,
  undefined,
];

/** Full catalog browse chrome: header, filters, responsive card grid. */
export async function CatalogBrowseLayout() {
  const t = await getTranslations("Pages.catalogBrowse");
  const locale = await getLocale();
  const listedNow = new Date();
  const addedLine = t("listingAdded", {
    date: formatProviderAddedDate(listedNow.toISOString(), locale),
  });
  const updatedLine = t("listingUpdated", {
    relative: formatListingUpdatedToday(locale),
  });

  const cards = SAMPLE_IDS.map((id, index) => {
    const slug = SAMPLE_PROFILE_SLUGS[index];

    return {
      id,
      href: slug ? `/catalog/${slug}` : undefined,
      title: t(`samples.${id}.title`),
      description: t(`samples.${id}.description`),
      addedLine,
      updatedLine,
    };
  });

  const cardCount = cards.length;
  const nf = new Intl.NumberFormat(locale);
  const statsLine = t("stats", {
    from: nf.format(cardCount > 0 ? 1 : 0),
    to: nf.format(cardCount),
    total: nf.format(cardCount),
  });

  return (
    <div className="bg-gray-50/80 pb-12 pt-5 sm:pt-6">
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
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none ring-orange-200 transition-shadow focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60"
                  autoComplete="off"
                />
              </label>

              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <LayoutGrid className="size-4 text-gray-500" aria-hidden />
                {t("categories")}
                <ChevronDown className="size-4 text-gray-400" aria-hidden />
              </button>
            </div>
        </div>

        <section
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          aria-label={t("gridAria")}
        >
          {cards.map((c) => (
            <CatalogCard
              key={c.id}
              href={c.href}
              title={c.title}
              description={c.description}
              addedLine={c.addedLine}
              updatedLine={c.updatedLine}
              viewProfileLabel={t("viewProfile")}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
