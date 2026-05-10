import { getTranslations, setRequestLocale } from "next-intl/server";

import { VendorModerationView } from "@/components/cabinet/VendorModerationView";
import { getPendingVendors } from "@/lib/actions/vendor-moderation";
import { buildPageMetadata } from "@/lib/seo";
import { fetchVendorsForModeration } from "@/lib/vendor/admin-queue";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/admin",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AdminCabinetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filter = sp.filter === "all" ? "all" : "pending";

  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  const vendors =
    filter === "pending"
      ? await getPendingVendors()
      : await fetchVendorsForModeration({ filter: "all" });

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("moderationTitle")}
        </h2>
        <VendorModerationView vendors={vendors} filter={filter} />
      </div>
    </section>
  );
}
