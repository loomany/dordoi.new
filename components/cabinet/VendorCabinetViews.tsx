import Image from "next/image";
import type { ReactNode } from "react";
import {
  AtSign,
  Clock3,
  Package,
  Send,
  Settings2,
  ShoppingBag,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { VendorAboutExpandable } from "@/components/cabinet/VendorAboutExpandable";
import { cabinetShell } from "@/components/cabinet/cabinet-tokens";
import { formatPhoneDisplay } from "@/lib/phone";
import type { VendorShopSelf } from "@/lib/vendor/vendor-shop";
import { cn } from "@/lib/utils";

function imgUnoptimized(url: string) {
  return url.includes("localhost");
}

function localeDateTag(locale: string) {
  switch (locale) {
    case "ru":
      return "ru-RU";
    case "kk":
      return "kk-KZ";
    case "kg":
      return "ky-KG";
    case "uz":
      return "uz-UZ";
    case "tj":
      return "tg-TJ";
    default:
      return "en-US";
  }
}

function formatSubmittedAt(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(localeDateTag(locale), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function normalizeExternalUrl(raw: string | null): string | null {
  const t = raw?.trim();
  if (!t) {
    return null;
  }
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

function whatsappHref(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export async function VendorPendingReviewDashboard({
  shop,
  locale,
}: {
  shop: VendorShopSelf;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Cabinet.vendor" });
  const empty = t("pendingEmpty");
  const submittedAt = formatSubmittedAt(shop.created_at, locale);

  return (
    <div className="flex flex-col gap-8 pb-6">
      <div className={cn(cabinetShell.surface, "px-5 py-6 sm:px-8 sm:py-8")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div
            className={cn(
              cabinetShell.iconTile,
              "hidden sm:flex",
            )}
          >
            <Clock3 className="size-7" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cabinetShell.pillStatus}>{t("pendingEyebrow")}</span>
              <span className={cabinetShell.pillMeta}>
                {t("pendingSubmittedAt", { date: submittedAt })}
              </span>
            </div>
            <p className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("pendingFullscreenMessage")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("pendingReviewLead")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingSection title={t("pendingSectionAbout")}>
          {shop.description?.trim() ? (
            <VendorAboutExpandable description={shop.description.trim()} />
          ) : (
            <p className="text-sm italic text-muted-foreground">{empty}</p>
          )}
        </PendingSection>

        <PendingSection title={t("pendingSectionCategories")}>
          {shop.categories.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {shop.categories.map((c) => (
                <li key={c} className={cabinetShell.categoryPill}>
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-muted-foreground">{empty}</p>
          )}
        </PendingSection>
      </div>

      <PendingSection title={t("pendingSectionPhotos")}>
        {!shop.logo_url && shop.product_photos.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">{empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shop.logo_url ? (
              <div className="flex flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200/95 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <Image
                    src={shop.logo_url}
                    alt={t("approvedLogoAlt")}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 50vw, 33vw"
                    unoptimized={imgUnoptimized(shop.logo_url)}
                  />
                </div>
                <p className="text-center text-xs font-medium text-muted-foreground">
                  {t("pendingLogoCaption")}
                </p>
              </div>
            ) : null}
            {shop.product_photos.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200/95 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Image
                  src={url}
                  alt={t("pendingPhotoAlt", { n: i + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 50vw, 33vw"
                  unoptimized={imgUnoptimized(url)}
                />
              </div>
            ))}
          </div>
        )}
      </PendingSection>

      <PendingSection title={t("pendingSectionSpot")}>
        {shop.container_photo_url ? (
          <div className="relative aspect-video max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/95 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Image
              src={shop.container_photo_url}
              alt={t("pendingSpotAlt")}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 672px"
              unoptimized={imgUnoptimized(shop.container_photo_url)}
            />
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">{empty}</p>
        )}
      </PendingSection>

      <PendingSection title={t("pendingSectionTerms")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <PendingTerm
            label={t("pendingLabelLocation")}
            value={shop.location_row?.trim() || empty}
          />
          <PendingTerm
            label={t("pendingLabelReturns")}
            value={shop.returns_policy?.trim() || empty}
          />
          <PendingTerm
            label={t("pendingLabelMinBatch")}
            value={shop.min_batch?.trim() || empty}
          />
          <PendingTerm
            label={t("pendingLabelPayment")}
            value={shop.payment_methods?.trim() || empty}
          />
          <PendingTerm
            label={t("pendingLabelDelivery")}
            value={
              shop.delivery_help ? t("pendingYes") : t("pendingNo")
            }
          />
          <PendingTerm
            label={t("pendingLabelSamples")}
            value={
              shop.samples_available ? t("pendingYes") : t("pendingNo")
            }
          />
        </div>
      </PendingSection>

      <PendingSection title={t("pendingSectionContacts")}>
        <div className="flex flex-col gap-4">
          {shop.phone_number?.trim() ? (
            <div className={cabinetShell.innerCard}>
              <p className="text-xs font-medium text-muted-foreground">
                {t("pendingLoginPhone")}
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {formatPhoneDisplay(shop.phone_number.trim())}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <PendingContactRow
              icon={<span className="text-[10px] font-bold">WA</span>}
              label={t("pendingContactWhatsApp")}
              value={shop.whatsapp_1}
            />
            {shop.whatsapp_2?.trim() ? (
              <PendingContactRow
                icon={<span className="text-[10px] font-bold">WA</span>}
                label={t("pendingContactWhatsAppExtra")}
                value={shop.whatsapp_2}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PendingSocialRow
              icon={<AtSign className="size-4" aria-hidden />}
              label={t("pendingContactInstagram")}
              href={normalizeExternalUrl(shop.instagram_url)}
              display={shop.instagram_url}
            />
            <PendingSocialRow
              icon={<Send className="size-4" aria-hidden />}
              label={t("pendingContactTelegram")}
              href={normalizeExternalUrl(shop.telegram_url)}
              display={shop.telegram_url}
            />
          </div>
        </div>
      </PendingSection>
    </div>
  );
}

function PendingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(cabinetShell.surface, "px-5 py-5")}>
      <h2 className={cabinetShell.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function PendingTerm({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={cabinetShell.innerCard}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function PendingContactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  const trimmed = value?.trim();
  const href = trimmed ? whatsappHref(trimmed) : null;

  if (!trimmed) {
    return (
      <div className={cabinetShell.innerCardMuted}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className={cabinetShell.iconChip}>{icon}</span>
          <div>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-sm">—</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cabinetShell.innerCard}>
      <div className="flex items-start gap-3">
        <span className={cabinetShell.iconChip}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-1 block truncate text-sm",
                cabinetShell.link,
              )}
            >
              {trimmed}
            </a>
          ) : (
            <p className="mt-1 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {trimmed}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingSocialRow({
  icon,
  label,
  href,
  display,
}: {
  icon: ReactNode;
  label: string;
  href: string | null;
  display: string | null;
}) {
  const trimmed = display?.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-0",
        cabinetShell.innerCard,
        "sm:only:col-span-2",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cabinetShell.iconChip}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("mt-1 block break-all text-sm", cabinetShell.link)}
            >
              {trimmed}
            </a>
          ) : (
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {trimmed}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function VendorRejectedNotice({ message }: { message: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center px-2 py-10 sm:px-4">
      <div
        role="alert"
        className={cn(
          "rounded-2xl border border-red-300/95 bg-red-50 px-6 py-5 text-sm leading-relaxed text-red-950 shadow-sm",
          "dark:border-red-800/80 dark:bg-red-950/45 dark:text-red-50",
        )}
      >
        {message}
      </div>
    </div>
  );
}

type ApprovedProps = {
  locationRow: string | null;
  locationLabel: string;
  logoUrl: string | null;
  logoAlt: string;
  photosSectionTitle: string;
  logoCaption: string;
  cardProducts: string;
  cardOrders: string;
  cardSettings: string;
};

export function VendorApprovedDashboard({
  locationRow,
  locationLabel,
  logoUrl,
  logoAlt,
  photosSectionTitle,
  logoCaption,
  cardProducts,
  cardOrders,
  cardSettings,
}: ApprovedProps) {
  return (
    <div className="flex flex-col gap-10">
      {locationRow ? (
        <section className={cn(cabinetShell.surface, "px-5 py-5")}>
          <h2 className={cabinetShell.sectionTitle}>{locationLabel}</h2>
          <div className={cabinetShell.innerCard}>
            <p className="text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">
              {locationRow}
            </p>
          </div>
        </section>
      ) : null}

      {logoUrl ? (
        <section className={cn(cabinetShell.surface, "px-5 py-5")}>
          <h2 className={cabinetShell.sectionTitle}>{photosSectionTitle}</h2>
          <div className="grid max-w-md grid-cols-2 gap-3 sm:max-w-none sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200/95 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 50vw, 33vw"
                  unoptimized={logoUrl.includes("localhost")}
                />
              </div>
              <p className="text-center text-xs font-medium text-muted-foreground">
                {logoCaption}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <VendorPlaceholderCard
          icon={<Package className="size-5" />}
          label={cardProducts}
        />
        <VendorPlaceholderCard
          icon={<ShoppingBag className="size-5" />}
          label={cardOrders}
        />
        <VendorPlaceholderCard
          icon={<Settings2 className="size-5" />}
          label={cardSettings}
        />
      </div>
    </div>
  );
}

function VendorPlaceholderCard({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-zinc-200/95 bg-white px-5 py-6 shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950/50",
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-200/90 bg-zinc-50 text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        {icon}
      </div>
      <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        {label}
      </p>
    </div>
  );
}
