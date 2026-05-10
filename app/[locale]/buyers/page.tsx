import { setRequestLocale } from "next-intl/server";
import { BuyersDirectoryLayout } from "@/components/buyers/BuyersDirectoryLayout";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/buyers", "Seo.buyers");
}

export default async function BuyersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BuyersDirectoryLayout />;
}
