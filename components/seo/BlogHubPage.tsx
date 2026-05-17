import { ArrowRight } from "lucide-react";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { Link } from "@/i18n/navigation";
import type { BlogPostContent } from "@/lib/seo/stage2-content";
import { baseUrl } from "@/lib/site";

type Props = {
  locale: string;
  posts: BlogPostContent[];
};

export function BlogHubPage({ locale, posts }: Props) {
  return (
    <article className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
      <SafePageSchemaJsonLd
        type="CollectionPage"
        locale={locale}
        path="/blog"
        name="Блог Dordoi.help"
        description="Практические гиды по рынку Дордой: поставщики, оптовая закупка, байеры, карго и доставка."
        keywords={["Дордой блог", "поставщики Дордой", "карго Дордой"]}
      />

      <SeoBreadcrumbs
        navLabel="Навигация"
        locale={locale}
        currentPageUrl={`${baseUrl()}/${locale}/blog`}
        items={[
          { label: "Главная", href: "/" },
          { label: "Блог" },
        ]}
      />

      <header className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-[#FAFAF8] p-6 shadow-[var(--d-shadow-soft)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Гиды и инструкции
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Блог Dordoi.help
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Практические материалы для покупателей, продавцов, байеров и тех, кто
          организует закупку с рынка Дордой.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={post.path}
            className="group flex min-h-64 flex-col justify-between rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] transition-colors hover:border-primary/40"
          >
            <span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Гид
              </span>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                {post.h1}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Читать
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        ))}
      </section>
    </article>
  );
}
