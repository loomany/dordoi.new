import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  VendorApprovedDashboard,
  VendorPendingFullscreen,
  VendorRejectedNotice,
} from "@/components/cabinet/VendorCabinetViews";
import { buildPageMetadata } from "@/lib/seo";
import { getVendorShopForSession } from "@/lib/vendor/vendor-shop";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cabinet.vendor" });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/vendor",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function VendorCabinetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Cabinet.vendor" });
  const shop = await getVendorShopForSession();

  if (!shop) {
    return (
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {t("lead")}
          </p>
        </header>
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/40">
          {t("noVendorRecord")}
        </p>
      </section>
    );
  }

  if (shop.status === "pending_moderation") {
    return (
      <VendorPendingFullscreen message={t("pendingFullscreenMessage")} />
    );
  }

  if (shop.status === "rejected") {
    return <VendorRejectedNotice message={t("rejectedNotice")} />;
  }

  const displayName = shop.store_name?.trim() || t("storeHeaderFallback");

  return (
    <VendorApprovedDashboard
      storeName={displayName}
      locationRow={shop.location_row?.trim() || null}
      logoUrl={shop.logo_url}
      logoAlt={t("approvedLogoAlt")}
      cardProducts={t("cardProductsSoon")}
      cardOrders={t("cardOrdersSoon")}
      cardSettings={t("cardSettingsSoon")}
    />
  );
}
