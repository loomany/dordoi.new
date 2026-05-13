import { Link } from "@/i18n/navigation";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import type { CoreSeoLanding } from "@/lib/seo/core-seo-landings";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { baseUrl } from "@/lib/site";

type SeoCoreLandingProps = {
  locale: RouteLocale;
  landing: CoreSeoLanding;
  labels: {
    breadcrumbNav: string;
    breadcrumbHome: string;
    ctaCatalog: string;
    ctaBuyers: string;
    ctaCargo: string;
    quickLinksTitle: string;
    quickLinkCatalog: string;
    quickLinkCategories: string;
    quickLinkBuyers: string;
    quickLinkCargo: string;
    faqTitle: string;
  };
};

export function SeoCoreLanding({ locale, landing, labels }: SeoCoreLandingProps) {
  const faq = landing.faqByLocale[locale];
  const bodyParagraphs = landing.bodyByLocale[locale];

  const quickLinks = [
    { href: "/catalog" as const, label: labels.quickLinkCatalog },
    { href: "/catalog" as const, label: labels.quickLinkCategories },
    { href: "/buyers" as const, label: labels.quickLinkBuyers },
    { href: "/kargo-dordoi" as const, label: labels.quickLinkCargo },
  ];

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-12">
      <SeoBreadcrumbs
        navLabel={labels.breadcrumbNav}
        locale={locale}
        currentPageUrl={`${baseUrl()}/${locale}${landing.path}`}
        items={[
          { label: labels.breadcrumbHome, href: "/" },
          { label: landing.h1ByLocale[locale] },
        ]}
      />

      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {landing.h1ByLocale[locale]}
        </h1>
      </header>

      <p className="text-base leading-relaxed text-muted-foreground">
        {landing.introByLocale[locale]}
      </p>

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
        {landing.id !== "kargo-dordoi" ? (
          <Link
            href="/kargo-dordoi"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            {labels.ctaCargo}
          </Link>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {labels.quickLinksTitle}
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {quickLinks.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {bodyParagraphs.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
          {bodyParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
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
