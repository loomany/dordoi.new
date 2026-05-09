import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/faq", "Seo.faq");
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages.faq");
  const tl = await getTranslations("LegalDisclaimer");

  const items = [
    { q: "q1" as const, a: "a1" as const },
    { q: "q2" as const, a: "a2" as const },
    { q: "q3" as const, a: "a3" as const },
  ];

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t("h1")}</h1>
        <h2 className="text-xl text-muted-foreground">{t("h2")}</h2>
      </header>
      <dl className="space-y-8">
        {items.map((item) => (
          <div key={item.q} className="space-y-2">
            <dt className="text-lg font-semibold text-foreground">{t(item.q)}</dt>
            <dd className="leading-relaxed text-muted-foreground">{t(item.a)}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-[var(--d-radius-xl)] border border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
        {tl("short")}
      </p>
    </article>
  );
}
