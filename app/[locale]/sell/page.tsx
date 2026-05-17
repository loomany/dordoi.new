import { setRequestLocale } from "next-intl/server";
import { SellVendorLanding } from "@/components/sell/SellVendorLanding";
import { SafePageSchemaJsonLd } from "@/components/seo/SafePageSchemaJsonLd";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/sell", "Seo.sell");
}

export default async function SellPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SafePageSchemaJsonLd
        locale={locale}
        path="/sell"
        name="Размещение продавца в Dordoi.help"
        description="Страница для продавцов рынка Дордой: цифровая витрина, заявки покупателей и размещение в каталоге."
        service={{
          name: "Размещение продавца в каталоге Dordoi.help",
          serviceType: "Vendor directory listing",
          audience: "Dordoi market sellers",
        }}
        keywords={["продавцам Дордой", "разместить магазин Дордой", "каталог продавцов Дордой"]}
      />
      <SellVendorLanding />
    </>
  );
}
