import { setRequestLocale } from "next-intl/server";
import { TermsOfServicePage } from "@/components/legal/TermsOfServicePage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/terms", "Seo.terms");
}

export default async function TermsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsOfServicePage />;
}
