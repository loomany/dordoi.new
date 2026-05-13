import { getLocale, getTranslations } from "next-intl/server";
import { SeoInternalLinkList } from "@/components/seo/SeoInternalLinkList";
import {
  CATALOG_POPULAR_CATEGORY_IDS,
  seoCategoryLinksForLocale,
} from "@/lib/seo/seo-internal-links";
import type { RouteLocale } from "@/lib/seo/route-locale";

/** Crawlable popular category links on catalog browse. */
export async function CatalogPopularCategories() {
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
      className="mt-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3"
    >
      <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
      <SeoInternalLinkList
        links={links}
        className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5"
        linkClassName="text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      />
    </nav>
  );
}
