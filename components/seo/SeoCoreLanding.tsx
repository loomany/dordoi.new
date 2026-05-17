import { Link } from "@/i18n/navigation";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { Stage3TrustSections } from "@/components/seo/Stage3TrustSections";
import type { CoreSeoLanding } from "@/lib/seo/core-seo-landings";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { coreLandingAnswer } from "@/lib/seo/ai-answer-content";
import { COUNTRY_LINKS } from "@/lib/seo/stage2-content";
import { getStage3TrustContent } from "@/lib/seo/stage3-trust-content";
import { localizeLinkItem, stage4Copy } from "@/lib/seo/stage4-localized-content";
import { getStage5GuidesForCountry } from "@/lib/seo/stage5-guides";
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
  const trustContent = getStage3TrustContent(locale, landing.id);
  const faq = trustContent?.faq.length
    ? [...landing.faqByLocale[locale], ...trustContent.faq]
    : landing.faqByLocale[locale];
  const bodyParagraphs = landing.bodyByLocale[locale];
  const copy = stage4Copy(locale);
  const answer = coreLandingAnswer(locale, landing.id);
  const countryLinksTitle = copy?.countries ?? "Страны доставки";
  const guideLinks = locale === "ru" ? getStage5GuidesForCountry(landing.id) : [];
  const service =
    landing.id === "kargo-dordoi"
      ? {
          name: landing.h1ByLocale[locale],
          serviceType: "Dordoi cargo and delivery guidance",
          audience: "Wholesale buyers",
        }
      : undefined;

  const quickLinks = [
    { href: "/catalog" as const, label: labels.quickLinkCatalog },
    { href: "/catalog" as const, label: labels.quickLinkCategories },
    { href: "/buyers" as const, label: labels.quickLinkBuyers },
    { href: "/kargo-dordoi" as const, label: labels.quickLinkCargo },
  ];
  const countryLinks = COUNTRY_LINKS.map((item) => localizeLinkItem(locale, item));

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 sm:py-12">
      <SafePageSchemaJsonLd
        locale={locale}
        path={landing.path}
        name={landing.h1ByLocale[locale]}
        description={landing.descriptionByLocale[locale]}
        keywords={[landing.id, "Dordoi.help", "Dordoi Market"]}
        service={service}
      />
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

      <AiAnswerBlock {...answer} />

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

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {countryLinksTitle}
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {countryLinks.map((item) => (
            <li key={item.href}>
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

      {guideLinks.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Гайды
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {guideLinks.map((item) => (
              <li key={item.href}>
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
      ) : null}

      {bodyParagraphs.length > 0 ? (
        <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
          {bodyParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ) : null}

      <Stage3TrustSections
        sections={trustContent?.sections ?? []}
        cardClassName="rounded-xl border border-border/60 bg-card p-4 shadow-[var(--d-shadow-soft)] sm:p-5"
      />

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
