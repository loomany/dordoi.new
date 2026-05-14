"use client";

import { useCallback, useState, type ReactNode } from "react";
import { MessageCircle, PhoneCall, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  CatalogAccessPaywallModal,
  type CatalogAccessPaywallCopy,
} from "@/components/catalog/CatalogAccessPaywallModal";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import { Link } from "@/i18n/navigation";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export type VendorContactActionsProps = {
  listingKey: string;
  initialFavorite: boolean;
  primaryWhatsapp: string | null;
  secondaryWhatsapp: string | null;
  telegramHref: string | null;
  instagramHref: string | null;
  telHref: string | null;
  googleMapsHref?: string | null;
  twoGisHref?: string | null;
  yandexMapsHref?: string | null;
  /** Подписка / админ — прямые ссылки; иначе клик открывает paywall. */
  contactsUnlocked?: boolean;
  paywallCopy?: CatalogAccessPaywallCopy;
};

const externalLinkProps = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};

type ContactPillProps = {
  className: string;
  label: string;
  icon?: ReactNode;
  href: string;
  unlocked: boolean;
  onLockedClick: () => void;
  external?: boolean;
};

function ContactPill({
  className,
  label,
  icon,
  href,
  unlocked,
  onLockedClick,
  external = true,
}: ContactPillProps) {
  if (!unlocked) {
    return (
      <button type="button" className={className} onClick={onLockedClick}>
        {icon}
        {label}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} className={className} {...externalLinkProps}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {icon}
      {label}
    </a>
  );
}

type MapLinksSectionProps = {
  mapItems: { href?: string | null; label: string }[];
  contactsUnlocked: boolean;
  openPaywall: () => void;
  pillOutline: string;
  mapTitle: string;
};

function MapLinksSection({
  mapItems,
  contactsUnlocked,
  openPaywall,
  pillOutline,
  mapTitle,
}: MapLinksSectionProps) {
  if (mapItems.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {mapTitle}
      </p>
      {mapItems.map(({ href, label }) => (
        <ContactPill
          key={href!.trim()}
          className={pillOutline}
          label={label}
          href={href!.trim()}
          unlocked={contactsUnlocked}
          onLockedClick={openPaywall}
        />
      ))}
    </div>
  );
}

export function VendorContactActions({
  listingKey,
  initialFavorite,
  primaryWhatsapp,
  secondaryWhatsapp,
  telegramHref,
  instagramHref,
  telHref,
  googleMapsHref,
  twoGisHref,
  yandexMapsHref,
  contactsUnlocked = false,
  paywallCopy,
}: VendorContactActionsProps) {
  const t = useTranslations("Pages.providerProfile");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const openPaywall = useCallback(() => {
    setPaywallOpen(true);
  }, []);

  const hasDirectContacts = Boolean(
    primaryWhatsapp ||
      secondaryWhatsapp ||
      telegramHref ||
      instagramHref ||
      telHref,
  );

  const pillOutline =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-200/95 bg-white py-3.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-950/[0.04] transition-[border-color,background-color,box-shadow] hover:border-zinc-300 hover:bg-zinc-50";

  const primaryPill =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-[#128C7E] py-3.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] hover:bg-[#0f7a6f] hover:shadow-md";

  const fallbackPrimaryPill =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-[var(--d-card-accent)] py-3.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] hover:opacity-95";

  const mapItems = [
    { href: googleMapsHref, label: t("openInGoogleMaps") },
    { href: twoGisHref, label: t("openIn2Gis") },
    { href: yandexMapsHref, label: t("openInYandexMaps") },
  ].filter((x) => Boolean(x.href?.trim()));

  return (
    <>
      <div className="mt-3 flex flex-col gap-3 lg:mt-6">
        {hasDirectContacts ? (
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("contactsSectionTitle")}
          </p>
        ) : (
          <p className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-center text-sm leading-relaxed text-muted-foreground">
            {t("contactLockedMessage")}
          </p>
        )}

        {primaryWhatsapp ? (
          <ContactPill
            className={primaryPill}
            label={t("ctaWhatsApp")}
            icon={<MessageCircle className="size-4 shrink-0" aria-hidden />}
            href={primaryWhatsapp}
            unlocked={contactsUnlocked}
            onLockedClick={openPaywall}
          />
        ) : null}
        {secondaryWhatsapp ? (
          <ContactPill
            className={pillOutline}
            label={t("ctaWhatsApp2")}
            icon={<MessageCircle className="size-4 shrink-0" aria-hidden />}
            href={secondaryWhatsapp}
            unlocked={contactsUnlocked}
            onLockedClick={openPaywall}
          />
        ) : null}
        {telegramHref ? (
          <ContactPill
            className={pillOutline}
            label={t("ctaTelegram")}
            icon={<Send className="size-4 shrink-0" aria-hidden />}
            href={telegramHref}
            unlocked={contactsUnlocked}
            onLockedClick={openPaywall}
          />
        ) : null}
        {instagramHref ? (
          <ContactPill
            className={pillOutline}
            label={t("ctaInstagram")}
            icon={<InstagramGlyph className="size-4 shrink-0" />}
            href={instagramHref}
            unlocked={contactsUnlocked}
            onLockedClick={openPaywall}
          />
        ) : null}
        {telHref ? (
          <ContactPill
            className={pillOutline}
            label={t("ctaCall")}
            icon={<PhoneCall className="size-4 shrink-0" aria-hidden />}
            href={telHref}
            unlocked={contactsUnlocked}
            onLockedClick={openPaywall}
            external={false}
          />
        ) : null}

        {!hasDirectContacts ? (
          <>
            <Link href="/contact" className={fallbackPrimaryPill}>
              {t("ctaRequestContact")}
            </Link>
            <Link href="/buyers" className={pillOutline}>
              {t("ctaFindBuyer")}
            </Link>
          </>
        ) : null}

        <MapLinksSection
          mapItems={mapItems}
          contactsUnlocked={contactsUnlocked}
          openPaywall={openPaywall}
          pillOutline={pillOutline}
          mapTitle={t("openOnMap")}
        />

        <div className="lg:hidden">
          <CatalogFavoriteButton
            key={`sidebar:${listingKey}:${initialFavorite}`}
            listingKey={listingKey}
            initialFavorite={initialFavorite}
            variant="sidebar"
          />
        </div>
      </div>

      {paywallCopy ? (
        <CatalogAccessPaywallModal
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          copy={paywallCopy}
        />
      ) : null}
    </>
  );
}
