import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

const FAQ_KEYS = ["0", "1", "2"] as const;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/suppliers", "Seo.suppliers");
}

export default async function SuppliersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages.suppliers");

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-16 sm:px-6">
      <SafePageSchemaJsonLd
        type="CollectionPage"
        locale={locale}
        path="/suppliers"
        name={t("h1")}
        description={t("body")}
        keywords={["поставщики Дордой", "каталог поставщиков", "оптовые продавцы"]}
      />
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t("h1")}</h1>
      </header>

      <p className="leading-relaxed text-muted-foreground">{t("body")}</p>

      <p>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("ctaCatalog")}
        </Link>
      </p>

      <section className="rounded-[var(--d-radius-xl)] border border-border/80 bg-muted/30 p-6 space-y-3">
        <h2 className="text-xl font-semibold">{t("sellerBlockTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("sellerBlockBody")}</p>
        <Link
          href="/sell"
          className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("ctaSell")}
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("faqTitle")}</h2>
        <dl className="space-y-4">
          {FAQ_KEYS.map((key) => (
            <div key={key}>
              <dt className="font-medium text-foreground">{t(`faq.${key}.question`)}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t(`faq.${key}.answer`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
