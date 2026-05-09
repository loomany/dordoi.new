import { setRequestLocale } from "next-intl/server";
import { ArticlePage } from "@/components/content/ArticlePage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/terms", "Seo.terms");
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ArticlePage namespace="terms" disclaimer />;
}
