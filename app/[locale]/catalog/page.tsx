import { setRequestLocale, getTranslations } from "next-intl/server";
import { CATALOG_CATEGORY_IDS } from "@/data/catalog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/catalog", "Seo.catalog");
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages.catalog");
  const tc = await getTranslations("catalogCategories");

  return (
    <article className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t("h1")}</h1>
        <h2 className="text-xl text-muted-foreground">{t("h2")}</h2>
        <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG_CATEGORY_IDS.map((id) => (
          <Card
            key={id}
            className="rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <CardTitle className="text-lg font-medium">{tc(id)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </article>
  );
}
