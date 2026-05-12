"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { cabinetShell } from "@/components/cabinet/cabinet-tokens";
import {
  updatePendingVendorProfileAsAdminAction,
  type VendorAdminPendingEditActionState,
} from "@/lib/actions/vendor-admin-pending-edit";
import {
  CATEGORY_LABEL_MAX_CHARS,
  CONTACT_FIELD_MAX_CHARS,
  DESCRIPTION_CARD_MAX_CHARS,
  DESCRIPTION_CARD_RECOMMENDED_CHARS,
  DESCRIPTION_DETAIL_MAX_CHARS,
  LOCATION_ROW_MAX_CHARS,
  MIN_BATCH_MAX_CHARS,
  PAYMENT_MAX_CHARS,
  RETURNS_POLICY_MAX_CHARS,
  SAMPLES_NOTE_MAX_CHARS,
  STORE_NAME_MAX_CHARS,
  VENDOR_CATEGORY_LIST_MAX,
} from "@/lib/vendor/vendor-field-limits";
import type { VendorProfileEditShop } from "@/lib/vendor/vendor-profile-edit-shop";
import { formatPhoneDisplay } from "@/lib/phone";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function inputClassName() {
  return cn(
    "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none",
    "ring-primary/15 placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/20",
    "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50",
  );
}

export function VendorProfileEditForm({
  shop,
  locale,
  lead,
  photosHint,
  backHref,
  backLabel,
}: {
  shop: VendorProfileEditShop;
  locale: string;
  lead: string;
  photosHint: string;
  backHref: string;
  backLabel: string;
}) {
  const t = useTranslations("Cabinet.vendor");
  const [state, formAction, pending] = useActionState<
    VendorAdminPendingEditActionState | null,
    FormData
  >(updatePendingVendorProfileAsAdminAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-8 pb-10">
      <input type="hidden" name="vendor_id" value={shop.id} />
      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="vendor_application_source"
        value={shop.application_source ?? "telegram"}
      />

      {state?.ok === false ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{lead}</p>

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        {photosHint}
      </div>

      <section className={cn(cabinetShell.surface, "px-5 py-5 sm:px-6")}>
        <h2 className={cabinetShell.sectionTitle}>{t("edit.sectionIdentity")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.storeName")}</span>
            <input
              name="store_name"
              required
              maxLength={STORE_NAME_MAX_CHARS}
              defaultValue={shop.store_name ?? ""}
              className={inputClassName()}
              autoComplete="organization"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t("edit.storeNameHint", { max: STORE_NAME_MAX_CHARS })}
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.location")}</span>
            <input
              name="location_row"
              required
              maxLength={LOCATION_ROW_MAX_CHARS}
              defaultValue={shop.location_row ?? ""}
              className={inputClassName()}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.description")}</span>
            <textarea
              name="description"
              required
              rows={5}
              maxLength={DESCRIPTION_CARD_MAX_CHARS}
              defaultValue={shop.description ?? ""}
              className={cn(inputClassName(), "min-h-[120px] resize-y")}
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t("edit.descriptionHint", {
                max: DESCRIPTION_CARD_MAX_CHARS,
                recommended: DESCRIPTION_CARD_RECOMMENDED_CHARS,
              })}
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("edit.descriptionDetail")}
            </span>
            <textarea
              name="description_detail"
              rows={4}
              maxLength={DESCRIPTION_DETAIL_MAX_CHARS}
              defaultValue={shop.description_detail ?? ""}
              className={cn(inputClassName(), "min-h-[96px] resize-y")}
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {t("edit.descriptionDetailHint", { max: DESCRIPTION_DETAIL_MAX_CHARS })}
            </span>
          </label>
        </div>
      </section>

      <section className={cn(cabinetShell.surface, "px-5 py-5 sm:px-6")}>
        <h2 className={cabinetShell.sectionTitle}>{t("edit.categories")}</h2>
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
          {t("edit.categoriesHint", {
            max: CATEGORY_LABEL_MAX_CHARS,
            maxCount: VENDOR_CATEGORY_LIST_MAX,
          })}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: VENDOR_CATEGORY_LIST_MAX }, (_, i) => (
            <label key={i} className="block text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                {t("edit.categoryRowLabel", { n: i + 1 })}
              </span>
              <input
                type="text"
                name="categories"
                maxLength={CATEGORY_LABEL_MAX_CHARS}
                defaultValue={shop.categories[i] ?? ""}
                placeholder={t("edit.categoryPlaceholder")}
                className={inputClassName()}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={cn(cabinetShell.surface, "px-5 py-5 sm:px-6")}>
        <h2 className={cabinetShell.sectionTitle}>{t("edit.sectionTerms")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.minBatch")}</span>
            <input
              name="min_batch"
              required
              maxLength={MIN_BATCH_MAX_CHARS}
              defaultValue={shop.min_batch ?? ""}
              className={inputClassName()}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.payment")}</span>
            <input
              name="payment_methods"
              required
              maxLength={PAYMENT_MAX_CHARS}
              defaultValue={shop.payment_methods ?? ""}
              className={inputClassName()}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="delivery_help"
              defaultChecked={shop.delivery_help}
              className="size-4 rounded border-zinc-300 text-primary dark:border-zinc-600"
            />
            {t("edit.deliveryHelp")}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="samples_available"
              defaultChecked={shop.samples_available}
              className="size-4 rounded border-zinc-300 text-primary dark:border-zinc-600"
            />
            {t("edit.samplesAvailable")}
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.samplesNote")}</span>
            <textarea
              name="samples_note"
              rows={2}
              maxLength={SAMPLES_NOTE_MAX_CHARS}
              defaultValue={shop.samples_note ?? ""}
              className={cn(inputClassName(), "min-h-[72px] resize-y")}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.returns")}</span>
            <textarea
              name="returns_policy"
              required
              rows={4}
              maxLength={RETURNS_POLICY_MAX_CHARS}
              defaultValue={shop.returns_policy ?? ""}
              className={cn(inputClassName(), "min-h-[100px] resize-y")}
            />
          </label>
        </div>
      </section>

      <section className={cn(cabinetShell.surface, "px-5 py-5 sm:px-6")}>
        <h2 className={cabinetShell.sectionTitle}>{t("edit.sectionContacts")}</h2>
        {shop.phone_number?.trim() ? (
          <div className="mb-4 rounded-xl border border-zinc-200/90 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs font-medium text-muted-foreground">{t("edit.loginPhoneReadonly")}</p>
            <p className="mt-1 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {formatPhoneDisplay(shop.phone_number.trim())}
            </p>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.whatsapp1")}</span>
            <input
              name="whatsapp_1"
              required
              defaultValue={formatPhoneDisplay(shop.whatsapp_1 ?? "")}
              className={inputClassName()}
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.whatsapp2")}</span>
            <input
              name="whatsapp_2"
              defaultValue={formatPhoneDisplay(shop.whatsapp_2 ?? "")}
              className={inputClassName()}
              autoComplete="tel"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.instagram")}</span>
            <input
              name="instagram_url"
              maxLength={CONTACT_FIELD_MAX_CHARS}
              defaultValue={shop.instagram_url ?? ""}
              placeholder="https://… или @ник"
              className={inputClassName()}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{t("edit.telegram")}</span>
            <input
              name="telegram_url"
              maxLength={CONTACT_FIELD_MAX_CHARS}
              defaultValue={shop.telegram_url ?? ""}
              placeholder="t.me/… или @channel"
              className={inputClassName()}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? t("edit.saving") : t("edit.save")}
        </Button>
        <Link href={backHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          {backLabel}
        </Link>
      </div>
    </form>
  );
}
