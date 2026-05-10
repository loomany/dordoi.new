import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticlePage } from "@/components/content/ArticlePage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/about", "Seo.about");
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages.about");
  return (
    <ArticlePage namespace="about" disclaimer>
      <div className="space-y-4 leading-relaxed text-muted-foreground">
        <p>{t("p1")}</p>
        <p>{t("p2")}</p>
        <p>{t("p3")}</p>
        <p>{t("p4")}</p>
        <p>{t("p5")}</p>
      </div>
    </ArticlePage>
  );
}
