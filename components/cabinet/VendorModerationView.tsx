"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2,
  CreditCard,
  ImageIcon,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";
import { useTransition } from "react";

import { updateVendorStatus } from "@/lib/actions/vendor-moderation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { VENDOR_PENDING_STATUS } from "@/lib/vendor/status";
import { digitsOnly } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Props = {
  vendors: VendorApplicationRecord[];
  filter: "pending" | "all";
};

export function VendorModerationView({ vendors, filter }: Props) {
  const t = useTranslations("Cabinet.admin");
  const locale = useLocale();
  const router = useRouter();
  const [actionPending, startTransition] = useTransition();

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
      <div className="flex flex-wrap gap-2">
        <Link
          href="/cabinet/admin"
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
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
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100"
              : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
          )}
        >
          {t("filterAll")}
        </Link>
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
              showActions={v.status === VENDOR_PENDING_STATUS}
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

function VendorApplicationCard({
  vendor: v,
  locale,
  showActions,
  actionPending,
  onApprove,
  onReject,
}: {
  vendor: VendorApplicationRecord;
  locale: string;
  showActions: boolean;
  actionPending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("Cabinet.admin");
  const photos = v.product_photos ?? [];

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
          {v.status !== VENDOR_PENDING_STATUS ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
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
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("cardSubmitted")}{" "}
          {formatDate(v.created_at, locale)} · {v.language.toUpperCase()}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("cardContacts")}
        </h4>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <Phone className="size-4 shrink-0 text-zinc-400" />
            <a
              href={`tel:${digitsOnly(v.phone_number)}`}
              className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {v.phone_number}
            </a>
          </li>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- публичные URL из Storage, без оптимизации */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {showActions ? (
        <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Button
            type="button"
            size="lg"
            disabled={actionPending}
            className="min-w-[140px] bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={onApprove}
          >
            {t("approve")}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="destructive"
            disabled={actionPending}
            className="min-w-[140px]"
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
