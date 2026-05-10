import { setRequestLocale } from "next-intl/server";
import { RefundPolicyPage } from "@/components/legal/RefundPolicyPage";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/refund", "Seo.refund");
}

export default async function RefundRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RefundPolicyPage />;
}
