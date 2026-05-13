import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SeoInternalLinkList } from "@/components/seo/SeoInternalLinkList";
import {
  HOME_SEO_CATEGORY_IDS,
  HOME_SEO_HUB_LINKS,
  seoCategoryLinksForLocale,
} from "@/lib/seo/seo-internal-links";
import type { RouteLocale } from "@/lib/seo/route-locale";

/** Crawlable hub + category links on the home landing. */
export async function HomePopularSectionsBlock({
  titleClass,
  blockGap,
}: {
  titleClass: string;
  blockGap: string;
}) {
  const t = await getTranslations("Pages.home.sections.popularSections");
  const locale = (await getLocale()) as RouteLocale;

  const hubLinks = HOME_SEO_HUB_LINKS.map((item) => ({
    href: item.href,
    label: t(`hub.${item.labelKey}`),
  }));

  const categoryLinks = seoCategoryLinksForLocale(
    locale,
    HOME_SEO_CATEGORY_IDS,
    (id) => t(`categories.${id}`),
  );

  const outer = "mx-auto max-w-6xl px-4 sm:px-6";
  const card =
    "rounded-[var(--d-radius-2xl)] border border-border/60 bg-background/80 px-5 py-5 shadow-[var(--d-shadow-soft)] sm:px-6 sm:py-6";

  return (
    <div className={`${outer} ${blockGap}`}>
      <div className={card}>
        <h2 className={`${titleClass} text-center font-semibold`}>{t("title")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
          {t("lead")}
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("hubTitle")}
            </p>
            <SeoInternalLinkList links={hubLinks} className="mt-2 flex flex-col gap-1.5" />
          </section>
          <section>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("categoriesTitle")}
            </p>
            <SeoInternalLinkList
              links={categoryLinks}
              className="mt-2 flex flex-col gap-1.5"
            />
          </section>
        </div>
        <div className="mt-5 flex justify-center">
          <Link
            href="/catalog"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t("catalogCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
