import { setRequestLocale } from "next-intl/server";
import { PrivacyPolicyPage } from "@/components/legal/PrivacyPolicyPage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/privacy", "Seo.privacy");
}

export default async function PrivacyRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPolicyPage />;
}
