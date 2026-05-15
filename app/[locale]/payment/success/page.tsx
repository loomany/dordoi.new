import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PaymentSuccessView } from "@/components/payment/PaymentSuccessView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages.paymentSuccess" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function PaymentSuccessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PaymentSuccessView />;
}
