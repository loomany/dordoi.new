import { Link } from "@/i18n/navigation";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import type { CoreSeoLanding } from "@/lib/seo/core-seo-landings";
import type { RouteLocale } from "@/lib/seo/route-locale";

type SeoCoreLandingProps = {
  locale: RouteLocale;
  landing: CoreSeoLanding;
  labels: {
    breadcrumbNav: string;
    breadcrumbHome: string;
    ctaCatalog: string;
    ctaBuyers: string;
    ctaCargo: string;
    faqTitle: string;
  };
};

export function SeoCoreLanding({ locale, landing, labels }: SeoCoreLandingProps) {
  const faq = landing.faqByLocale[locale];

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6">
      <SeoBreadcrumbs
        navLabel={labels.breadcrumbNav}
        items={[
          { label: labels.breadcrumbHome, href: "/" },
          { label: landing.h1ByLocale[locale] },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{landing.h1ByLocale[locale]}</h1>
      </header>

      <p className="leading-relaxed text-muted-foreground">{landing.introByLocale[locale]}</p>
      <p className="leading-relaxed text-muted-foreground">{landing.bodyByLocale[locale]}</p>

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
        {landing.id !== "kargo-dordoi" ? (
          <Link
            href="/kargo-dordoi"
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            {labels.ctaCargo}
          </Link>
        ) : null}
      </div>

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
