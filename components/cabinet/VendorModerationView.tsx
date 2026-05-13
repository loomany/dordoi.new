"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ImageIcon,
  Layers,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";
import { useTransition } from "react";

import { ProductPhotosSwipeCarousel } from "@/components/cabinet/ProductPhotosSwipeCarousel";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { updateVendorStatus } from "@/lib/actions/vendor-moderation";
import { localizedMainCategoryLabels } from "@/lib/catalog/vendor-category-normalize";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import {
  formatGooglePlacesIntroTwoLines,
  parseGooglePlacesDescriptionForAdmin,
  type GooglePlacesAdminParsedMeta,
} from "@/lib/vendor/google-places-import-description";
import {
  vendorApplicationToParsedVendorCardData,
} from "@/lib/vendor/vendor-application-catalog-preview";
import { isVendorPendingQueueStatus } from "@/lib/vendor/status";
import { digitsOnly } from "@/lib/phone";
import { useVendorEditSeenIds } from "@/hooks/use-vendor-edit-seen";
import { cn } from "@/lib/utils";
import {
  parseTwoGisFirmIdFromGooglePlaceId,
  resolveGoogleMapsHref,
  twoGisFirmPageUrlFromGooglePlaceId,
} from "@/lib/catalog/vendor-map-links";

type Props = {
  vendors: VendorApplicationRecord[];
  filter: "pending" | "all";
};

export function VendorModerationView({ vendors, filter }: Props) {
  const t = useTranslations("Cabinet.admin");
  const locale = useLocale();
  const router = useRouter();
  const [actionPending, startTransition] = useTransition();
  const vendorEditSeenIds = useVendorEditSeenIds();

  function moderate(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const r = await updateVendorStatus(id, status);
      if (r.ok) {
        router.refresh();
      } else {
        window.alert(r.message);
      }
    });
  }

  const emptyPending = filter === "pending" && vendors.length === 0;
  const emptyAll = filter === "all" && vendors.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center px-1">
        <div
          className={cn(
            "flex max-w-full flex-nowrap items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-2 shadow-sm",
            "dark:border-zinc-700 dark:bg-zinc-900/55",
          )}
        >
          <h2 className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900 sm:text-base dark:text-zinc-50">
            {t("moderationTitle")}
          </h2>
          <div className="flex shrink-0 gap-1 border-l border-zinc-200 pl-2.5 dark:border-zinc-600">
            <Link
              href="/cabinet/admin"
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                filter === "pending"
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100"
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
              )}
            >
              {t("filterPending")}
            </Link>
            <Link
              href="/cabinet/admin?filter=all"
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                filter === "all"
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100"
                  : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
              )}
            >
              {t("filterAll")}
            </Link>
          </div>
        </div>
      </div>

      {emptyPending ? (
        <EmptyPendingIllustration />
      ) : emptyAll ? (
        <p className="text-sm text-muted-foreground">{t("moderationEmpty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {vendors.map((v) => (
            <VendorApplicationCard
              key={v.id}
              vendor={v}
              locale={locale}
              vendorEditSeen={vendorEditSeenIds.has(v.id)}
              showActions={isVendorPendingQueueStatus(v.status)}
              actionPending={actionPending}
              onApprove={() => moderate(v.id, "approved")}
              onReject={() => moderate(v.id, "rejected")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyPendingIllustration() {
  const t = useTranslations("Cabinet.admin");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-sky-50/90 px-6 py-14 text-center shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-sky-950/20 sm:px-10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-800/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/20" />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner dark:bg-emerald-950/80 dark:text-emerald-300">
          <CheckCircle2 className="size-9" strokeWidth={1.75} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("emptyPendingTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("emptyPendingHint")}
        </p>
      </div>
    </div>
  );
}

function VendorCatalogAsInStorePreview({
  vendor,
}: {
  vendor: VendorApplicationRecord;
}) {
  const tAdmin = useTranslations("Cabinet.admin");
  const tBrowse = useTranslations("Pages.catalogBrowse");
  const tTree = useTranslations("catalogCategoryTree");
  const categoryLabels = localizedMainCategoryLabels(vendor.categories, (id) =>
    tTree(`main.${id}`),
  );
  const display = vendorApplicationToParsedVendorCardData(
    vendor,
    categoryLabels,
    { untitledStoreLabel: tAdmin("cardUntitledStore") },
  );
  const photos =
    vendor.product_photos?.filter(
      (u) => typeof u === "string" && u.trim().length > 0,
    ) ?? [];

  return (
    <section className="flex flex-col gap-3 border-b border-zinc-100 pb-5 dark:border-zinc-800">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {tAdmin("vendorCatalogPreviewTitle")}
      </h4>
      <div className="max-w-xl min-w-0">
        <CatalogCard
          display={display}
          href={`/cabinet/admin/vendor/${vendor.id}/edit`}
          viewProfileLabel={tAdmin("vendorCatalogPreviewCta")}
          aboutStoreLabel={tBrowse("cardAboutStore")}
          collapseLabel={tBrowse("cardCollapse")}
          expandLabel={tBrowse("cardExpand")}
          defaultCollapsed={false}
          defaultCollapsedMobile={false}
          photoUrls={photos.length > 0 ? photos : undefined}
        />
      </div>
    </section>
  );
}

function googlePlacesFoundViaLabel(
  kind: GooglePlacesAdminParsedMeta["foundViaKind"],
  tr: (key: string) => string,
): string | null {
  if (kind === "nearby") return tr("googlePlacesFoundNearby");
  if (kind === "text") return tr("googlePlacesFoundText");
  if (kind === "both") return tr("googlePlacesFoundBoth");
  return null;
}

function VendorApplicationCard({
  vendor: v,
  locale,
  vendorEditSeen,
  showActions,
  actionPending,
  onApprove,
  onReject,
}: {
  vendor: VendorApplicationRecord;
  locale: string;
  vendorEditSeen: boolean;
  showActions: boolean;
  actionPending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("Cabinet.admin");
  const photos = v.product_photos ?? [];
  const isGooglePlaces = v.application_source === "google_places";
  const isTwoGisImport = Boolean(parseTwoGisFirmIdFromGooglePlaceId(v.google_place_id));
  const hasAboutSection =
    Boolean(v.description?.trim()) ||
    Boolean(v.description_detail?.trim()) ||
    Boolean(v.moderation_note?.trim());
  const googleParse = isGooglePlaces
    ? parseGooglePlacesDescriptionForAdmin(v.description)
    : null;
  const introRaw = (
    googleParse?.introBeforeJson?.trim() ||
    v.moderation_note?.trim() ||
    ""
  ).trim();
  const introFormatted = introRaw
    ? formatGooglePlacesIntroTwoLines(introRaw)
    : "";
  const hasJsonMarker = Boolean((v.description ?? "").includes("\n\n{"));
  const googleMetaParseFailed =
    Boolean(isGooglePlaces && hasJsonMarker && !googleParse?.meta);
  const googleMeta = googleParse?.meta ?? null;
  const foundViaText = googleMeta
    ? googlePlacesFoundViaLabel(googleMeta.foundViaKind, t)
    : null;
  const showGoogleMetaCard =
    Boolean(googleMeta) &&
    Boolean(
      googleMeta!.categoryDisplay ||
        googleMeta!.primaryType ||
        googleMeta!.typesCompact ||
        foundViaText ||
        googleMeta!.distanceMetersRounded != null ||
        v.location_row?.trim() ||
        googleMeta!.coordsFormatted ||
        v.status === "pending_review",
    );

  return (
    <article
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-zinc-200/95 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40",
      )}
    >
      <header className="flex flex-col gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
              {v.store_name?.trim() || t("cardUntitledStore")}
            </h3>
            {v.location_row ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{v.location_row}</span>
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {v.application_source === "google_places" ? (
              <>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    isTwoGisImport
                      ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-100"
                      : "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/45 dark:text-sky-100",
                  )}
                >
                  {isTwoGisImport
                    ? t("reviewBadgeTwoGis")
                    : t("reviewBadgeGooglePlaces")}
                </span>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100">
                  {t("reviewBadgeManualCheck")}
                </span>
              </>
            ) : vendorEditSeen ? (
              <span
                className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
                title={v.id}
              >
                {t("reviewBadgeApplicationNo", {
                  no: String(v.telegram_chat_id ?? ""),
                })}
              </span>
            ) : (
              <>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100">
                  {t("reviewBadgeNew")}
                </span>
                <span
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-200"
                  title={v.id}
                >
                  {t("reviewBadgeApplicationNo", {
                    no: String(v.telegram_chat_id ?? ""),
                  })}
                </span>
              </>
            )}
            {v.status === "approved" || v.status === "rejected" ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  v.status === "approved" &&
                    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
                  v.status === "rejected" &&
                    "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100",
                )}
              >
                {v.status === "approved"
                  ? t("statusApproved")
                  : t("statusRejected")}
              </span>
            ) : v.status === "pending_review" ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100">
                {t("statusPendingReview")}
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("cardSubmitted")}{" "}
          {formatDate(v.created_at, locale)} · {v.language.toUpperCase()}
        </p>
      </header>

      <VendorCatalogAsInStorePreview vendor={v} />

      {v.application_source === "google_places" ? (
        <GooglePlacesReviewHint v={v} t={t} />
      ) : null}

      {isGooglePlaces && hasAboutSection ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("cardDescription")}
          </h4>
          {introFormatted ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {introFormatted}
            </p>
          ) : null}
          {googleMetaParseFailed ? (
            <p className="text-sm text-muted-foreground">
              {t("googlePlacesMetaParseFailed")}
            </p>
          ) : null}
          {showGoogleMetaCard && googleMeta ? (
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/90 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(
                  isTwoGisImport
                    ? "twoGisDataTitle"
                    : "googlePlacesDataTitle",
                )}
              </p>
              <dl className="mt-2 space-y-2 text-sm text-zinc-800 dark:text-zinc-200">
                {googleMeta.categoryDisplay ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelCategory")}
                    </dt>
                    <dd className="min-w-0 font-medium break-words">
                      {googleMeta.categoryDisplay}
                    </dd>
                  </div>
                ) : null}
                {googleMeta.primaryType ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelPrimaryType")}
                    </dt>
                    <dd className="min-w-0 font-medium break-words">
                      {googleMeta.primaryType}
                    </dd>
                  </div>
                ) : null}
                {googleMeta.typesCompact ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelTypes")}
                    </dt>
                    <dd className="min-w-0 font-medium break-words">
                      {googleMeta.typesCompact}
                    </dd>
                  </div>
                ) : null}
                {foundViaText ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelFoundVia")}
                    </dt>
                    <dd className="min-w-0 font-medium break-words">
                      {foundViaText}
                    </dd>
                  </div>
                ) : null}
                {googleMeta.distanceMetersRounded != null ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelDistance")}
                    </dt>
                    <dd className="min-w-0 font-medium">
                      {t("googlePlacesDistanceMeters", {
                        meters: googleMeta.distanceMetersRounded,
                      })}
                    </dd>
                  </div>
                ) : null}
                {v.location_row?.trim() ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelAddress")}
                    </dt>
                    <dd className="min-w-0 font-medium break-words">
                      {v.location_row.trim()}
                    </dd>
                  </div>
                ) : null}
                {googleMeta.coordsFormatted ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelCoords")}
                    </dt>
                    <dd className="min-w-0 font-medium break-all">
                      {googleMeta.coordsFormatted}
                    </dd>
                  </div>
                ) : null}
                {v.status === "pending_review" ? (
                  <div className="grid gap-0.5 sm:grid-cols-[minmax(0,10.5rem)_1fr] sm:gap-x-2">
                    <dt className="text-muted-foreground">
                      {t("googlePlacesLabelStatus")}
                    </dt>
                    <dd className="min-w-0 font-medium">
                      {t("googlePlacesStatusNeedsReview")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
          {v.description_detail?.trim() ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {v.description_detail.trim()}
            </p>
          ) : null}
        </section>
      ) : v.description?.trim() || v.description_detail?.trim() ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("cardDescription")}
          </h4>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {[v.description?.trim(), v.description_detail?.trim()]
              .filter(Boolean)
              .join("\n\n")}
          </p>
        </section>
      ) : null}

      {v.categories.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("cardCategories")}
          </h4>
          <ul className="flex flex-wrap gap-2">
            {v.categories.map((cat, i) => (
              <li
                key={`${i}-${cat}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
              >
                {cat}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("cardContacts")}
        </h4>
        <ul className="flex flex-col gap-2 text-sm">
          {v.phone_number?.trim() ? (
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-zinc-400" />
              <a
                href={`tel:${digitsOnly(v.phone_number)}`}
                className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                {v.phone_number}
              </a>
            </li>
          ) : v.application_source === "google_places" ? (
            <li className="flex items-start gap-2 text-muted-foreground">
              <Phone className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              <span>{t("googlePlacesNoPhoneYet")}</span>
            </li>
          ) : null}
          {v.whatsapp_1 ? (
            <li className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                WA 1
              </span>
              <a
                href={waHref(v.whatsapp_1)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                {v.whatsapp_1}
              </a>
            </li>
          ) : null}
          {v.whatsapp_2 ? (
            <li className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                WA 2
              </span>
              <a
                href={waHref(v.whatsapp_2)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                {v.whatsapp_2}
              </a>
            </li>
          ) : null}
          {v.instagram_url ? (
            <li>
              <a
                href={ensureHttp(v.instagram_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                Instagram → {v.instagram_url}
              </a>
            </li>
          ) : null}
          {v.telegram_url ? (
            <li>
              <a
                href={tgHref(v.telegram_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                Telegram → {v.telegram_url}
              </a>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="grid gap-3 rounded-xl bg-zinc-50/90 p-4 dark:bg-zinc-900/50">
        <DetailRow
          icon={<Package className="size-4 text-zinc-500" />}
          label={t("cardMinBatch")}
          value={v.min_batch ?? "—"}
        />
        <DetailRow
          icon={<CreditCard className="size-4 text-zinc-500" />}
          label={t("cardPayment")}
          value={v.payment_methods ?? "—"}
        />
        <DetailRow
          icon={<Truck className="size-4 text-zinc-500" />}
          label={t("cardDelivery")}
          value={
            v.delivery_help ? t("cardDeliveryYes") : t("cardDeliveryNo")
          }
        />
        <div className="flex gap-3 text-sm">
          <Layers className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              {t("cardSamples")}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
              {v.samples_note?.trim()
                ? v.samples_note.trim()
                : v.samples_available
                  ? t("cardSamplesYes")
                  : t("cardSamplesNo")}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              {t("cardReturns")}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
              {v.returns_policy?.trim() || "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ImageIcon className="size-4" />
          {t("cardMedia")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaSlot
            label={t("cardLogo")}
            url={v.logo_url}
            alt={t("cardLogoAlt")}
          />
          <MediaSlot
            label={t("cardContainer")}
            url={v.container_photo_url}
            alt={t("cardContainerAlt")}
          />
        </div>
        {photos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("cardProductGallery")}
            </p>
            <ProductPhotosSwipeCarousel
              urls={photos}
              ariaLabel={t("cardProductGallery")}
              getAlt={(i) => t("cardProductPhotoAlt", { n: i + 1 })}
              openLabel={t("photoViewerOpen")}
              closeLabel={t("photoViewerClose")}
            />
          </div>
        ) : null}
      </section>

      {showActions ? (
        <div className="flex flex-nowrap items-stretch gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Link
            href={`/cabinet/admin/vendor/${v.id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-w-0 shrink flex-1 justify-center",
            )}
          >
            {t("editVendor")}
          </Link>
          <Button
            type="button"
            size="sm"
            disabled={actionPending}
            className="min-w-0 shrink flex-1 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={onApprove}
          >
            {t("approve")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={actionPending}
            className="min-w-0 shrink flex-1"
            onClick={onReject}
          >
            {t("reject")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </p>
        <p className="mt-0.5 text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function MediaSlot({
  label,
  url,
  alt,
}: {
  label: string;
  url: string | null;
  alt: string;
}) {
  const t = useTranslations("Cabinet.admin");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {url ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
          <Image
            src={url}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            unoptimized={url.includes("localhost")}
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 text-xs text-muted-foreground dark:border-zinc-700 dark:bg-zinc-900/40">
          {t("cardNoImage")}
        </div>
      )}
    </div>
  );
}

/** Подсказка для кандидатов из импорта (Google Places или 2GIS в том же `application_source`). */
function GooglePlacesReviewHint({
  v,
  t,
}: {
  v: VendorApplicationRecord;
  t: (key: string) => string;
}) {
  const twoGis = twoGisFirmPageUrlFromGooglePlaceId(v.google_place_id);
  const google = resolveGoogleMapsHref(v.google_maps_uri, v.google_place_id);
  const href = twoGis ?? google;
  if (!href) return null;

  return (
    <div className="rounded-xl border border-sky-200/90 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-50">
      <p>
        {twoGis ? t("twoGisAutoFoundHint") : t("googlePlacesAutoFoundHint")}
      </p>
      <p className="mt-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-200"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          {twoGis ? t("openIn2Gis") : t("openInGoogleMaps")}
        </a>
      </p>
    </div>
  );
}

function waHref(raw: string): string {
  const d = digitsOnly(raw);
  return d ? `https://wa.me/${d}` : ensureHttp(raw);
}

function ensureHttp(s: string): string {
  const t = s.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    return t;
  }
  return `https://${t}`;
}

function tgHref(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    return t;
  }
  if (t.startsWith("@")) {
    return `https://t.me/${t.slice(1)}`;
  }
  if (t.startsWith("t.me/")) {
    return `https://${t}`;
  }
  return ensureHttp(t);
}

function formatDate(iso: string, localeTag: string): string {
  try {
    return new Intl.DateTimeFormat(localeTag, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
