import { getTranslations, setRequestLocale } from "next-intl/server";

import { PhotoBatchModerationView } from "@/components/cabinet/PhotoBatchModerationView";
import { VendorModerationView } from "@/components/cabinet/VendorModerationView";
import { getPendingPhotoBatches } from "@/lib/actions/vendor-photo-batch-moderation";
import { getPendingVendors } from "@/lib/actions/vendor-moderation";
import { buildPageMetadata } from "@/lib/seo";
import { fetchVendorsForModeration } from "@/lib/vendor/admin-queue";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string; updated?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/admin",
    title: t("metaTitle"),
    description: t("metaDescription"),
    privateArea: true,
  });
}

export default async function AdminCabinetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filter = sp.filter === "all" ? "all" : "pending";

  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  const [vendors, pendingPhotoBatches] = await Promise.all([
    filter === "pending"
      ? getPendingVendors()
      : fetchVendorsForModeration({ filter: "all" }),
    getPendingPhotoBatches(),
  ]);

  return (
    <section className="flex flex-col gap-8">
      {sp.updated === "1" ? (
        <div
          className="rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/35 dark:text-emerald-50"
          role="status"
        >
          {t("vendorSavedBanner")}
        </div>
      ) : null}

      <PhotoBatchModerationView items={pendingPhotoBatches} locale={locale} />

      <VendorModerationView vendors={vendors} filter={filter} />
    </section>
  );
}
