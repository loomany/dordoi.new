import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SeoInternalLinkList } from "@/components/seo/SeoInternalLinkList";
import {
  FOOTER_CATEGORY_IDS,
  SEO_HUB_LINKS,
  seoCategoryLinksForLocale,
} from "@/lib/seo/seo-internal-links";
import type { RouteLocale } from "@/lib/seo/route-locale";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tb = await getTranslations("brand");
  const locale = (await getLocale()) as RouteLocale;

  const legal = [
    { href: "/about", key: "about" as const },
    { href: "/help", key: "help" as const },
    { href: "/faq", key: "faq" as const },
    { href: "/contact", key: "contact" as const },
    { href: "/privacy", key: "privacy" as const },
    { href: "/terms", key: "terms" as const },
    { href: "/refund", key: "refund" as const },
  ];

  const hubLinks = SEO_HUB_LINKS.map((item) => ({
    href: item.href,
    label: t(`seoHub.${item.labelKey}`),
  }));

  const categoryLinks = seoCategoryLinksForLocale(
    locale,
    FOOTER_CATEGORY_IDS,
    (id) => t(`seoCategories.${id}`),
  );

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex shrink-0" aria-label={tb("name")}>
              <BrandLogo name={tb("name")} size="md" />
            </Link>
          </div>

          <nav aria-label={t("seoDordoiTitle")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("seoDordoiTitle")}
            </p>
            <SeoInternalLinkList
              links={hubLinks}
              className="mt-3 flex flex-col gap-2"
              linkClassName="text-xs text-muted-foreground transition-colors hover:text-foreground"
            />
          </nav>

          <nav aria-label={t("seoCategoriesTitle")} className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("seoCategoriesTitle")}
            </p>
            <SeoInternalLinkList
              links={categoryLinks}
              className="mt-3 grid gap-2 sm:grid-cols-2"
              linkClassName="text-xs text-muted-foreground transition-colors hover:text-foreground"
            />
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/60 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {tb("name")}
          </p>
          <nav
            className="flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-end"
            aria-label={tb("name")}
          >
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(`links.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
