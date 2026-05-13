import { Link } from "@/i18n/navigation";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import type { SeoCategoryRoute } from "@/lib/catalog/seo-category-routes";
import {
  getRelatedSeoCategories,
  seoCategoryPath,
} from "@/lib/catalog/seo-category-routes";
import type { RouteLocale } from "@/lib/seo/route-locale";

type SeoCategoryLandingProps = {
  locale: RouteLocale;
  route: SeoCategoryRoute;
  labels: {
    breadcrumbNav: string;
    breadcrumbHome: string;
    breadcrumbCatalog: string;
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
  labels,
}: SeoCategoryLandingProps) {
  const related = getRelatedSeoCategories(route, 6);
  const faq = route.faqByLocale[locale];

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6">
      <SeoBreadcrumbs
        navLabel={labels.breadcrumbNav}
        items={[
          { label: labels.breadcrumbHome, href: "/" },
          { label: labels.breadcrumbCatalog, href: "/catalog" },
          { label: route.h1ByLocale[locale] },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{route.h1ByLocale[locale]}</h1>
      </header>

      <p className="leading-relaxed text-muted-foreground">{route.introByLocale[locale]}</p>

      <section className="rounded-[var(--d-radius-xl)] border border-border/80 bg-muted/30 p-6 space-y-3">
        <h2 className="text-xl font-semibold">{labels.vendorPreviewTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{labels.vendorPreviewBody}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {labels.ctaCatalog}
          </Link>
          <Link
            href="/buyers"
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            {labels.ctaBuyers}
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{labels.seoTextTitle}</h2>
        <p className="leading-relaxed text-muted-foreground">{route.seoTextByLocale[locale]}</p>
      </section>

      {related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{labels.relatedTitle}</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={seoCategoryPath(locale, item)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {item.h1ByLocale[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{labels.faqTitle}</h2>
        <dl className="space-y-4">
          {faq.map((item) => (
            <div key={item.question}>
              <dt className="font-medium text-foreground">{item.question}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <FaqJsonLd items={faq} />
    </article>
  );
}
