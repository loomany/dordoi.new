import { ArrowRight } from "lucide-react";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { BlogPostingJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { Link } from "@/i18n/navigation";
import { blogAnswer } from "@/lib/seo/ai-answer-content";
import type { BlogPostContent } from "@/lib/seo/stage2-content";
import {
  CORE_LINKS,
  COUNTRY_LINKS,
  POPULAR_CATEGORY_LINKS,
} from "@/lib/seo/stage2-content";
import {
  localizeLinkItems,
  stage4Copy,
} from "@/lib/seo/stage4-localized-content";
import { baseUrl } from "@/lib/site";

type Props = {
  locale: string;
  post: BlogPostContent;
};

const cardClass =
  "rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)]";

export function BlogGuidePage({ locale, post }: Props) {
  const copy = stage4Copy(locale);
  const labels = {
    nav: copy?.nav ?? "Навигация",
    home: copy?.home ?? "Главная",
    blog: copy?.blog ?? "Блог",
    guideEyebrow: copy?.guideEyebrow ?? "Гид Dordoi.help",
    faq: copy?.faq ?? "FAQ",
    mainSections: copy?.mainSections ?? "Основные разделы",
    relatedLinks: copy?.usefulLinks ?? "Полезные ссылки",
    categories: copy?.categories ?? "Категории",
    countries: copy?.countries ?? "Страны",
    openCatalog: copy?.openCatalog ?? "Открыть каталог",
  };
  const coreLinks = localizeLinkItems(locale, CORE_LINKS.slice(0, 5));
  const categoryLinks = localizeLinkItems(locale, POPULAR_CATEGORY_LINKS);
  const countryLinks = localizeLinkItems(locale, COUNTRY_LINKS);
  const articleLinks = localizeLinkItems(locale, post.relatedLinks ?? []);
  const answer = blogAnswer(locale, post.h1);

  return (
    <article className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
      <BlogPostingJsonLd
        locale={locale}
        path={post.path}
        headline={post.h1}
        description={post.description}
        datePublished={post.datePublished}
        dateModified={post.dateModified}
        keywords={post.keywords}
      />
      <FaqJsonLd items={post.faq} />

      <SeoBreadcrumbs
        navLabel={labels.nav}
        locale={locale}
        currentPageUrl={`${baseUrl()}/${locale}${post.path}`}
        items={[
          { label: labels.home, href: "/" },
          { label: labels.blog, href: "/blog" },
          { label: post.h1 },
        ]}
      />

      <header className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-[#FAFAF8] p-6 shadow-[var(--d-shadow-soft)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {labels.guideEyebrow}
        </p>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {post.h1}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {post.excerpt}
        </p>
      </header>

      <AiAnswerBlock {...answer} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-5">
          {post.sections.map((section) => (
            <section key={section.title} className={cardClass}>
              <h2 className="text-2xl font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.body ? (
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 72)}
                      className="leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}
              {section.items ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4"
                    >
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          <section className={cardClass}>
            <h2 className="text-2xl font-semibold tracking-tight">{labels.faq}</h2>
            <dl className="mt-4 space-y-4">
              {post.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-medium text-foreground">{item.question}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {articleLinks.length > 0 ? (
            <RelatedLinks title={labels.relatedLinks} links={articleLinks} />
          ) : null}
          <RelatedLinks title={labels.mainSections} links={coreLinks} />
          <RelatedLinks title={labels.categories} links={categoryLinks} />
          <RelatedLinks title={labels.countries} links={countryLinks} />
          <Link
            href="/catalog"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {labels.openCatalog}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </aside>
      </div>
    </article>
  );
}

function RelatedLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section className={cardClass}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
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
  );
}
