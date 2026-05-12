"use client";

import { MessageCircle, PhoneCall, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";

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
  /** Ссылки на карты; пустые не рендерятся. */
  googleMapsHref?: string | null;
  twoGisHref?: string | null;
  yandexMapsHref?: string | null;
};

const externalLinkProps = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};

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
}: VendorContactActionsProps) {
  const t = useTranslations("Pages.providerProfile");

  const pillOutline =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-200/95 bg-white py-3.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-950/[0.04] transition-[border-color,background-color,box-shadow] hover:border-zinc-300 hover:bg-zinc-50";

  const primaryPill =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-[#128C7E] py-3.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] hover:bg-[#0f7a6f] hover:shadow-md";

  return (
    <div className="mt-3 flex flex-col gap-3 lg:mt-6">
      {primaryWhatsapp ? (
        <a href={primaryWhatsapp} className={primaryPill} {...externalLinkProps}>
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          {t("ctaWhatsApp")}
        </a>
      ) : null}
      {secondaryWhatsapp ? (
        <a href={secondaryWhatsapp} className={pillOutline} {...externalLinkProps}>
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          {t("ctaWhatsApp2")}
        </a>
      ) : null}
      {telegramHref ? (
        <a href={telegramHref} className={pillOutline} {...externalLinkProps}>
          <Send className="size-4 shrink-0" aria-hidden />
          {t("ctaTelegram")}
        </a>
      ) : null}
      {instagramHref ? (
        <a href={instagramHref} className={pillOutline} {...externalLinkProps}>
          <InstagramGlyph className="size-4 shrink-0" />
          {t("ctaInstagram")}
        </a>
      ) : null}
      {telHref ? (
        <a href={telHref} className={pillOutline}>
          <PhoneCall className="size-4 shrink-0" aria-hidden />
          {t("ctaCall")}
        </a>
      ) : null}
      {(() => {
        const mapItems = [
          { href: googleMapsHref, label: t("openInGoogleMaps") },
          { href: twoGisHref, label: t("openIn2Gis") },
          { href: yandexMapsHref, label: t("openInYandexMaps") },
        ].filter((x) => Boolean(x.href?.trim()));
        if (mapItems.length === 0) return null;
        return (
          <div className="flex flex-col gap-2">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("openOnMap")}
            </p>
            {mapItems.map(({ href, label }) => (
              <a
                key={href!.trim()}
                href={href!.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className={pillOutline}
              >
                {label}
              </a>
            ))}
          </div>
        );
      })()}
      <div className="lg:hidden">
        <CatalogFavoriteButton
          key={`sidebar:${listingKey}:${initialFavorite}`}
          listingKey={listingKey}
          initialFavorite={initialFavorite}
          variant="sidebar"
        />
      </div>
    </div>
  );
}
