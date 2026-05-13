import { getTranslations, setRequestLocale } from "next-intl/server";

import { VendorAIPlayground } from "@/components/admin/VendorAIPlayground";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/admin/vendor-ai",
    title: t("vendorAiPlaygroundMetaTitle"),
    description: t("vendorAiPlaygroundMetaDescription"),
    privateArea: true,
  });
}

export default async function VendorAiPlaygroundPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="mx-auto max-w-6xl px-1 sm:px-0">
      <VendorAIPlayground />
    </section>
  );
}
