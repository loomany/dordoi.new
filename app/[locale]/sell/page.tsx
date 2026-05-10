import { setRequestLocale } from "next-intl/server";
import { ServiceHeroPage } from "@/components/content/ServiceHeroPage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/sell", "Seo.sell");
}

export default async function SellPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServiceHeroPage namespace="sell" />;
}
