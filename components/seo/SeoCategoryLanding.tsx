import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { SeoCategoryRoute } from "@/lib/catalog/seo-category-routes";
import {
  getRelatedSeoCategories,
  seoCategoryPath,
} from "@/lib/catalog/seo-category-routes";
import type { RouteLocale } from "@/lib/seo/route-locale";

type SeoCategoryLandingProps = {
  locale: RouteLocale;
  route: SeoCategoryRoute;
  vendorCount: number;
  vendorGrid: ReactNode | null;
  labels: {
    breadcrumbNav: string;
    breadcrumbHome: string;
    breadcrumbCatalog: string;
    statVendors: (count: number) => string;
    statCategory: string;
    statContact: string;
    vendorPreviewTitle: string;
    vendorPreviewBody: string;
    ctaCatalog: string;
    ctaBuyers: string;
    relatedTitle: string;
    seoTextTitle: string;
    faqTitle: string;
  };
};

export function SeoCategoryLanding({
  locale,
  route,
  vendorCount,
  vendorGrid,
  labels,
}: SeoCategoryLandingProps) {
  const related = getRelatedSeoCategories(route, 6);
  const faq = route.faqByLocale[locale];
  const guideParagraphs = route.seoTextByLocale[locale];

  return (
    <article className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-8">
        <header className="space-y-4">
          <SeoBreadcrumbs
            navLabel={labels.breadcrumbNav}
            items={[
              { label: labels.breadcrumbHome, href: "/" },
              { label: labels.breadcrumbCatalog, href: "/catalog" },
              { label: route.h1ByLocale[locale] },
            ]}
          />

          <div className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {route.h1ByLocale[locale]}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {route.introByLocale[locale]}
              </p>
            </div>

            <ul className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <li className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
                {labels.statVendors(vendorCount)}
              </li>
              <li className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
                {labels.statCategory}: {route.categoryNameByLocale[locale]}
              </li>
              <li className="rounded-full border border-border/70 bg-muted/30 px-3 py-1">
                {labels.statContact}
              </li>
            </ul>
          </div>
        </header>

        <section className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{labels.vendorPreviewTitle}</h2>
            {labels.vendorPreviewBody ? (
              <p className="text-sm text-muted-foreground">{labels.vendorPreviewBody}</p>
            ) : null}
          </div>
          {vendorGrid}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {labels.ctaCatalog}
            </Link>
            <Link
              href="/buyers"
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50"
            >
              {labels.ctaBuyers}
            </Link>
          </div>
        </section>

        <div className="space-y-6 border-t border-border/70 pt-8">
          <section className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-muted/20 p-5 shadow-[var(--d-shadow-soft)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">{labels.seoTextTitle}</h2>
            <div className="space-y-3">
              {guideParagraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight">{labels.relatedTitle}</h2>
              <ul className="flex flex-wrap gap-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={seoCategoryPath(locale, item)}
                      className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
                    >
                      {item.h1ByLocale[locale]}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">{labels.faqTitle}</h2>
            <FaqAccordion items={faq} defaultOpenIndex={0} ariaLabel={labels.faqTitle} />
          </section>
        </div>

        <FaqJsonLd items={faq} />
      </div>
    </article>
  );
}
