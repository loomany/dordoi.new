import { getLocale, getTranslations } from "next-intl/server";
import { SeoInternalLinkList } from "@/components/seo/SeoInternalLinkList";
import {
  CATALOG_POPULAR_CATEGORY_IDS,
  seoCategoryLinksForLocale,
} from "@/lib/seo/seo-internal-links";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { cn } from "@/lib/utils";

type CatalogPopularCategoriesProps = {
  className?: string;
};

/** Crawlable popular category links on catalog browse. */
export async function CatalogPopularCategories({
  className,
}: CatalogPopularCategoriesProps = {}) {
  const t = await getTranslations("Pages.catalogBrowse.popularCategories");
  const locale = (await getLocale()) as RouteLocale;
  const links = seoCategoryLinksForLocale(
    locale,
    CATALOG_POPULAR_CATEGORY_IDS,
    (id) => t(`categories.${id}`),
  );

  return (
    <nav
      aria-label={t("navAria")}
      className={cn(
        "space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6",
        className,
      )}
    >
      <h2 className="text-center text-lg font-semibold tracking-tight text-foreground">
        {t("title")}
      </h2>
      <SeoInternalLinkList
        links={links}
        className="flex flex-wrap gap-2"
        linkClassName="inline-flex items-center rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
      />
    </nav>
  );
}
