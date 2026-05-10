import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminVendorEditSeenRecorder } from "@/components/cabinet/AdminVendorEditSeenRecorder";
import { VendorProfileEditForm } from "@/components/cabinet/VendorProfileEditForm";
import { buildPageMetadata } from "@/lib/seo";
import { fetchVendorApplicationByIdForAdmin } from "@/lib/vendor/admin-queue";
import type { VendorProfileEditShop } from "@/lib/vendor/vendor-profile-edit-shop";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { VENDOR_PENDING_STATUS } from "@/lib/vendor/status";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function toProfileEditShop(v: VendorApplicationRecord): VendorProfileEditShop {
  return {
    id: v.id,
    store_name: v.store_name,
    location_row: v.location_row,
    description: v.description,
    description_detail: v.description_detail,
    categories: v.categories,
    min_batch: v.min_batch,
    payment_methods: v.payment_methods,
    delivery_help: v.delivery_help,
    whatsapp_1: v.whatsapp_1,
    whatsapp_2: v.whatsapp_2,
    instagram_url: v.instagram_url,
    telegram_url: v.telegram_url,
    samples_available: v.samples_available,
    samples_note: v.samples_note,
    returns_policy: v.returns_policy,
    phone_number: v.phone_number.trim() ? v.phone_number.trim() : null,
  };
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/admin/vendor/edit",
    title: t("vendorEditMetaTitle"),
    description: t("vendorEditMetaDescription"),
  });
}

export default async function AdminVendorPendingEditPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!z.string().uuid().safeParse(id).success) {
    redirect(`/${locale}/cabinet/admin`);
  }

  const t = await getTranslations({ locale, namespace: "Cabinet.admin" });
  const row = await fetchVendorApplicationByIdForAdmin(id);

  if (!row || row.status !== VENDOR_PENDING_STATUS) {
    redirect(`/${locale}/cabinet/admin`);
  }

  const shop = toProfileEditShop(row);

  return (
    <>
      <AdminVendorEditSeenRecorder vendorId={row.id} />
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("vendorEditTitle", { store: row.store_name?.trim() || t("cardUntitledStore") })}
        </h1>
      </header>
      <VendorProfileEditForm
        shop={shop}
        locale={locale}
        lead={t("vendorEditLead")}
        photosHint={t("vendorEditPhotosHint")}
        backHref="/cabinet/admin"
        backLabel={t("vendorEditBack")}
      />
    </>
  );
}
