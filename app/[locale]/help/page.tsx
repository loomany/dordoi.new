import { setRequestLocale } from "next-intl/server";
import { HelpCenterPage } from "@/components/help/HelpCenterPage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/help", "Seo.help");
}

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HelpCenterPage />;
}
