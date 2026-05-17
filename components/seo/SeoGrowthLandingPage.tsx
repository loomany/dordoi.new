import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { Stage3TrustSections } from "@/components/seo/Stage3TrustSections";
import { Link } from "@/i18n/navigation";
import { growthPageAnswer } from "@/lib/seo/ai-answer-content";
import { getStage3TrustContent } from "@/lib/seo/stage3-trust-content";
import {
  localizeLinkItem,
  localizeRelatedGroupTitle,
} from "@/lib/seo/stage4-localized-content";
import { getStage5GuidesForCountry } from "@/lib/seo/stage5-guides";
import type { SeoGrowthPageContent } from "@/lib/seo/stage2-content";
import { baseUrl } from "@/lib/site";

type Props = {
  locale: string;
  content: SeoGrowthPageContent;
  relatedLinks?: Array<{
    title: string;
    links: Array<{ href: string; label: string }>;
  }>;
};

const cardClass =
  "rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)]";

export function SeoGrowthLandingPage({
  locale,
  content,
  relatedLinks = [],
}: Props) {
  const trustContent = getStage3TrustContent(locale, content.id);
  const faq = trustContent?.faq.length
    ? [...content.faq, ...trustContent.faq]
    : content.faq;
  const localizedPrimaryLinks = content.primaryLinks.map((link) =>
    localizeLinkItem(locale, link),
  );
  const answer = growthPageAnswer(locale, content.id);
  const stage5GuideLinks = locale === "ru" ? getStage5GuidesForCountry(content.id) : [];
  const relatedGroups =
    stage5GuideLinks.length > 0
      ? [...relatedLinks, { title: "Гайды", links: stage5GuideLinks }]
      : relatedLinks;
  const localizedRelatedLinks = relatedGroups.map((group) => ({
    title: localizeRelatedGroupTitle(locale, group.title),
    links: group.links.map((link) => localizeLinkItem(locale, link)),
  }));

  return (
    <article className="bg-background">
      <SafePageSchemaJsonLd
        type={content.schemaType}
        locale={locale}
        path={content.path}
        name={content.h1}
        description={content.description}
        keywords={content.keywords}
        service={content.service}
      />
      <FaqJsonLd items={faq} />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <SeoBreadcrumbs
          navLabel="Навигация"
          locale={locale}
          currentPageUrl={`${baseUrl()}/${locale}${content.path}`}
          items={[
            { label: "Главная", href: "/" },
            { label: content.h1 },
          ]}
        />

        <header className="space-y-5 rounded-[var(--d-radius-2xl)] border border-border/60 bg-[#FAFAF8] p-6 shadow-[var(--d-shadow-soft)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {content.eyebrow}
          </p>
          <div className="max-w-4xl space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {content.h1}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {content.intro}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {localizedPrimaryLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  index === 0
                    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    : "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50"
                }
              >
                {link.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            ))}
          </div>
        </header>

        <AiAnswerBlock {...answer} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="space-y-5">
            {content.sections.map((section) => (
              <section key={section.title} className={cardClass}>
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                {section.body ? (
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 72)}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}
                {section.items ? (
                  <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {section.items.map((item) => (
                      <div
                        key={item.title}
                        className="border-t border-border/60 pt-3"
                      >
                        <div className="flex gap-2">
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden
                          />
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold">
                              {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {item.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            <Stage3TrustSections sections={trustContent?.sections ?? []} />

            <section className={cardClass}>
              <h2 className="text-xl font-semibold tracking-tight">
                Частые вопросы
              </h2>
              <dl className="mt-4 space-y-4">
                {faq.map((item) => (
                  <div key={item.question}>
                    <dt className="font-medium text-foreground">
                      {item.question}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {localizedRelatedLinks.length > 0 ? (
            <aside className="space-y-4 lg:sticky lg:top-20">
              {localizedRelatedLinks.map((group) => (
                <section key={group.title} className={cardClass}>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
