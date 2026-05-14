"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localizedMainCategoryLabels } from "@/lib/catalog/vendor-category-normalize";
import {
  parseTwoGisFirmIdFromGooglePlaceId,
  resolveGoogleMapsHref,
  twoGisFirmPageUrlFromGooglePlaceId,
} from "@/lib/catalog/vendor-map-links";
import { digitsOnly } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { vendorApplicationToParsedVendorCardData, vendorApplicationAiDescription } from "@/lib/vendor/vendor-application-catalog-preview";

type Props = {
  vendor: VendorApplicationRecord;
  locale: string;
  vendorEditSeen: boolean;
  showActions: boolean;
  actionPending: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function VendorModerationCard({
  vendor: v,
  locale,
  vendorEditSeen,
  showActions,
  actionPending,
  onApprove,
  onReject,
}: Props) {
  const t = useTranslations("Cabinet.admin");
  const tCard = useTranslations("Pages.catalogBrowse.vendorCard");
  const tTree = useTranslations("catalogCategoryTree");

  const photos = (v.product_photos ?? []).filter((u) => u?.trim());
  const isTwoGisImport = Boolean(parseTwoGisFirmIdFromGooglePlaceId(v.google_place_id));
  const categoryLabels = localizedMainCategoryLabels(v.categories, (id) =>
    tTree(`main.${id}`),
  );
  const display = vendorApplicationToParsedVendorCardData(v, categoryLabels, {
    untitledStoreLabel: t("cardUntitledStore"),
    locale,
  });
  const aiDescription = vendorApplicationAiDescription(v, locale);
  const sourceDescription =
    !aiDescription && display.description.trim() ? display.description.trim() : "";

  const mapHref =
    twoGisFirmPageUrlFromGooglePlaceId(v.google_place_id) ??
    resolveGoogleMapsHref(v.google_maps_uri, v.google_place_id);

  const tradeLabel =
    display.tradeType === "wholesale"
      ? tCard("tradeTypeWholesale")
      : display.tradeType === "retail"
        ? tCard("tradeTypeRetail")
        : tCard("tradeTypeHybrid");

  const commerceBits = [
    display.commerce.payment,
    display.commerce.delivery,
    display.commerce.samples,
    display.commerce.defects,
  ].filter((x): x is string => Boolean(x?.trim()));

  const contactItems: { label: string; href: string; external: boolean }[] = [];
  if (v.whatsapp_1?.trim()) {
    contactItems.push({ label: "WA", href: waHref(v.whatsapp_1), external: true });
  }
  if (v.instagram_url?.trim()) {
    contactItems.push({
      label: "IG",
      href: ensureHttp(v.instagram_url),
      external: true,
    });
  }
  if (v.telegram_url?.trim()) {
    contactItems.push({ label: "TG", href: tgHref(v.telegram_url), external: true });
  }
  if (v.phone_number?.trim()) {
    contactItems.push({
      label: "Tel",
      href: `tel:${digitsOnly(v.phone_number)}`,
      external: false,
    });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="flex gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          {v.logo_url?.trim() ? (
            <Image
              src={v.logo_url}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              unoptimized={v.logo_url.includes("localhost")}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs font-semibold text-zinc-400">
              {display.storeTitle.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {display.storeTitle}
              </h3>
              {display.subtitle ? (
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                  {display.subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {tradeLabel}
              </span>
              {v.application_source === "google_places" ? (
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
                  {isTwoGisImport ? "2GIS" : "Places"}
                </span>
              ) : vendorEditSeen ? null : (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  {t("reviewBadgeNew")}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {categoryLabels.length > 0 ? (
              <span>{categoryLabels.join(" · ")}</span>
            ) : null}
            {v.location_row?.trim() ? (
              <span className="inline-flex max-w-full items-center gap-1">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{v.location_row.trim()}</span>
              </span>
            ) : null}
            {mapHref ? (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline dark:text-sky-300"
              >
                <ExternalLink className="size-3" aria-hidden />
                {isTwoGisImport ? "2GIS" : "Maps"}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {aiDescription ? (
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {aiDescription}
          </p>
        </div>
      ) : sourceDescription ? (
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("cardSourceDescription")}
          </p>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {sourceDescription}
          </p>
        </div>
      ) : (
        <div className="border-b border-zinc-100 px-4 py-3 text-sm text-muted-foreground dark:border-zinc-800">
          {t("cardNoAiDescription")}
        </div>
      )}

      {commerceBits.length > 0 || contactItems.length > 0 || photos.length > 0 ? (
        <div className="space-y-3 px-4 py-3">
          {commerceBits.length > 0 ? (
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {commerceBits.join(" · ")}
            </p>
          ) : null}
          {contactItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contactItems.map((c) => (
                <a
                  key={`${c.label}-${c.href}`}
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {c.label}
                </a>
              ))}
            </div>
          ) : null}
          {photos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {photos.slice(0, 8).map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative size-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={url.includes("localhost")}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showActions ? (
        <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <Link
            href={`/cabinet/admin/vendor/${v.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
          >
            {t("editVendor")}
          </Link>
          <Button
            type="button"
            size="sm"
            disabled={actionPending}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onApprove}
          >
            {t("approve")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={actionPending}
            className="flex-1"
            onClick={onReject}
          >
            {t("reject")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function waHref(raw: string): string {
  const d = digitsOnly(raw);
  return d ? `https://wa.me/${d}` : ensureHttp(raw);
}

function ensureHttp(s: string): string {
  const t = s.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

function tgHref(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("@")) return `https://t.me/${t.slice(1)}`;
  if (t.startsWith("t.me/")) return `https://${t}`;
  return ensureHttp(t);
}
