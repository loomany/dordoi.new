import { setRequestLocale } from "next-intl/server";
import { ArticlePage } from "@/components/content/ArticlePage";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/buyer-service", "Seo.buyerService");
}

export default async function BuyerServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SafePageSchemaJsonLd
        locale={locale}
        path="/buyer-service"
        name="Байер на рынке Дордой"
        description="Сервисная страница для покупателей, которым нужна помощь байера на рынке Дордой: проверка товара, фотоотчет, выкуп и передача партии."
        service={{
          name: "Байер на рынке Дордой",
          serviceType: "Buyer agent assistance",
          audience: "Wholesale buyers",
        }}
        keywords={["байер Дордой", "выкуп товара Дордой", "проверка товара Дордой"]}
      />
      <ArticlePage namespace="buyerService" />
    </>
  );
}
