import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Cabinet.buyer",
  });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/buyer",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function BuyerCabinetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Cabinet.buyer" });

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        {t("lead")}
      </p>
    </section>
  );
}
