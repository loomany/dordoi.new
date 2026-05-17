import { ArrowRight } from "lucide-react";
import { AiAnswerBlock } from "@/components/seo/AiAnswerBlock";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { SeoBreadcrumbs } from "@/components/seo/SeoBreadcrumbs";
import { Link } from "@/i18n/navigation";
import { blogAnswer } from "@/lib/seo/ai-answer-content";
import type { BlogPostContent } from "@/lib/seo/stage2-content";
import { stage4Copy } from "@/lib/seo/stage4-localized-content";
import { baseUrl } from "@/lib/site";

type Props = {
  locale: string;
  posts: BlogPostContent[];
};

function blogIntroForLocale(locale: string): string {
  switch (locale) {
    case "kk":
      return "Дордой нарығы, жеткізушілер, байер, карго және көтерме сатып алу бойынша практикалық материалдар.";
    case "kg":
      return "Дордой базары, жеткирүүчүлөр, байер, карго жана оптом сатып алуу боюнча практикалык материалдар.";
    case "uz":
      return "Dordoy bozori, yetkazib beruvchilar, xaridor-agent, kargo va ulgurji xarid bo'yicha amaliy materiallar.";
    case "tj":
      return "Маводи амалӣ дар бораи бозори Дордой, таъминкунандагон, байер, карго ва хариди яклухт.";
    default:
      return "Практические материалы для покупателей, продавцов, байеров и тех, кто организует закупку с рынка Дордой.";
  }
}

function clusterTitleForLocale(locale: string, cluster: string): string {
  const key = cluster.toLowerCase();
  const normalized =
    key.includes("cargo") || key.includes("карго") || key.includes("РєР°СЂРіРѕ")
      ? "cargo"
      : key.includes("marketplace") || key.includes("wildberries")
        ? "marketplace"
        : key.includes("production") || key.includes("шве") || key.includes("С€РІ")
          ? "production"
          : key.includes("price") || key.includes("contact") || key.includes("контакт") || key.includes("С†РµРЅ")
            ? "prices"
            : key.includes("bayer") || key.includes("байер") || key.includes("Р±Р°Р№РµСЂ")
              ? "bayer"
              : key.includes("катег") || key.includes("РєР°С‚РµРі")
                ? "categories"
                : "wholesale";

  const labels: Record<string, Record<string, string>> = {
    ru: {
      wholesale: "Дордой оптом",
      categories: "Категории товаров",
      cargo: "Карго и доставка",
      bayer: "Байеры",
      marketplace: "Маркетплейсы",
      production: "Производство",
      prices: "Цены и безопасные контакты",
    },
    kk: {
      wholesale: "Дордой көтерме",
      categories: "Тауар санаттары",
      cargo: "Карго және жеткізу",
      bayer: "Байер",
      marketplace: "Маркетплейстер",
      production: "Өндіріс",
      prices: "Баға және қауіпсіз контактілер",
    },
    kg: {
      wholesale: "Дордой оптом",
      categories: "Товар категориялары",
      cargo: "Карго жана жеткирүү",
      bayer: "Байер",
      marketplace: "Маркетплейстер",
      production: "Өндүрүш",
      prices: "Баалар жана коопсуз контакттар",
    },
    uz: {
      wholesale: "Dordoy ulgurji",
      categories: "Tovar toifalari",
      cargo: "Kargo va yetkazish",
      bayer: "Bayer",
      marketplace: "Marketpleyslar",
      production: "Ishlab chiqarish",
      prices: "Narxlar va xavfsiz kontaktlar",
    },
    tj: {
      wholesale: "Дордой яклухт",
      categories: "Категорияҳои мол",
      cargo: "Карго ва интиқол",
      bayer: "Байер",
      marketplace: "Marketplace",
      production: "Истеҳсол",
      prices: "Нархҳо ва контактҳои бехатар",
    },
  };

  return labels[locale]?.[normalized] ?? labels.ru[normalized] ?? cluster;
}

export function BlogHubPage({ locale, posts }: Props) {
  const copy = stage4Copy(locale);
  const labels = {
    nav: copy?.nav ?? "Навигация",
    home: copy?.home ?? "Главная",
    blog: copy?.blog ?? "Блог",
    eyebrow: copy?.guide ?? "Гиды и инструкции",
    h1: copy ? `${copy.blog} Dordoi.help` : "Блог Dordoi.help",
    intro: blogIntroForLocale(locale),
    guide: copy?.guide ?? "Гид",
    read: copy?.read ?? "Читать",
  };
  const answer = blogAnswer(locale, labels.h1);

  const groupedPosts = posts.reduce<Array<{ cluster: string; posts: BlogPostContent[] }>>(
    (groups, post) => {
      const cluster = post.cluster ?? "Dordoi wholesale";
      const group = groups.find((item) => item.cluster === cluster);
      if (group) {
        group.posts.push(post);
      } else {
        groups.push({ cluster, posts: [post] });
      }
      return groups;
    },
    [],
  );

  return (
    <article className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
      <SafePageSchemaJsonLd
        type="CollectionPage"
        locale={locale}
        path="/blog"
        name={labels.h1}
        description={labels.intro}
        keywords={["Dordoi.help", "Dordoi Market", "Dordoi cargo"]}
      />

      <SeoBreadcrumbs
        navLabel={labels.nav}
        locale={locale}
        currentPageUrl={`${baseUrl()}/${locale}/blog`}
        items={[
          { label: labels.home, href: "/" },
          { label: labels.blog },
        ]}
      />

      <header className="space-y-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-[#FAFAF8] p-6 shadow-[var(--d-shadow-soft)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {labels.eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          {labels.h1}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {labels.intro}
        </p>
      </header>

      <AiAnswerBlock {...answer} />

      <div className="space-y-8">
        {groupedPosts.map((group) => (
          <section key={group.cluster} className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {clusterTitleForLocale(locale, group.cluster)}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {group.posts.map((post) => (
                <Link
                  key={post.slug}
                  href={post.path}
                  className="group flex min-h-64 flex-col justify-between rounded-[var(--d-radius-2xl)] border border-border/60 bg-card p-5 shadow-[var(--d-shadow-soft)] transition-colors hover:border-primary/40"
                >
                  <span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {labels.guide}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">
                      {post.h1}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {labels.read}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
