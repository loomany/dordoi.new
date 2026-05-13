"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Package, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CatalogCardPhotoRail } from "@/components/catalog/CatalogCardPhotoRail";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";
import type { CatalogLeadVideo } from "@/lib/catalog/asso-corsets-lead-video";
import { ensureHttpUrl } from "@/lib/catalog/vendor-map-links";
import type { ParsedVendorCardData } from "@/lib/catalog/vendor-card-display";
import { CATALOG_CARD_COLLAPSED_DESCRIPTION_MAX_CHARS } from "@/lib/vendor/vendor-field-limits";
import { cn } from "@/lib/utils";

export type CatalogCardProps = {
  display: ParsedVendorCardData;
  /** Длинный лейбл профиля (превью без `href`, подсказки); в каталоге CTA — короткий `vendorCard.profileCta`. */
  viewProfileLabel: string;
  /** Если задан — блок «шапка + описание» — нативная ссылка на профиль (ПКМ / новая вкладка); подвал и фото вне ссылки. CTA в подвале — второй `<Link>`. */
  href?: string;
  /** Фото под CTA при раскрытии: карусель (одно фото, листание влево-вправо). */
  photoUrls?: string[];
  /** Первый слайд карусели — видео (только Asso Corsets). */
  leadVideo?: CatalogLeadVideo;
  /** Slug витрины + видео URL — резервный client-side lead video. */
  vendorSlug?: string;
  productVideos?: string[];
  /** Карточка-подборка / после модерации — акцентная рамка. */
  featured?: boolean;
  /** Кнопка избранного в подвале карточки; клик не всплывает к ссылке карточки. */
  favoriteSlot?: ReactNode;
  /** Заголовок текстового блока о поставщике (aria для описания). */
  aboutStoreLabel?: string;
  /** i18n-лейблы для toggle «свернуть/развернуть»; если не заданы — toggle не отображается. */
  collapseLabel?: string;
  expandLabel?: string;
  /** Стартовое состояние свёрнутости на ПК (≥ lg). По умолчанию — раскрыта. */
  defaultCollapsed?: boolean;
  /**
   * Стартовое состояние свёрнутости на мобильном (< lg).
   * Если не задано — наследуется от `defaultCollapsed`.
   * Срабатывает только до первого пользовательского toggle.
   */
  defaultCollapsedMobile?: boolean;
  /**
   * Внешнее управление свёрнутостью (каталог: пара карточек в одном ряду grid).
   * Если заданы оба — локальный стейт toggle игнорируется.
   */
  collapsedExternal?: boolean;
  onCollapsedExternalChange?: (collapsed: boolean) => void;
  className?: string;
  /** `preview` — превью в админке (метаданные для тестов / будущий CTA). */
  variant?: "catalog" | "preview";
  /** Заменить стандартный CTA «Профиль магазина» (например кнопка публикации в админке). */
  profileCtaSlot?: ReactNode;
};

function cardInitials(title: string): string {
  const t = title.trim();
  if (!t) {
    return "?";
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

const COMPACT_DESC_MAX = CATALOG_CARD_COLLAPSED_DESCRIPTION_MAX_CHARS;

function truncateAtChars(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  const sliced = text.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(" ");
  const minCut = Math.max(maxLen - 60, Math.floor(maxLen * 0.7));
  const cut = lastSpace > minCut ? sliced.slice(0, lastSpace) : sliced;
  return `${cut.replace(/[\s,.;:!?\-—•·]+$/u, "")}…`;
}

function truncateForCompact(text: string): string {
  return truncateAtChars(text, COMPACT_DESC_MAX);
}

/** Линейная иконка Instagram для компактной кнопки в карточке каталога. */
function CatalogInstagramGlyph({ className }: { className?: string }) {
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
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/** Карточка поставщика в каталоге: компактный вид; при раскрытии — карусель фото под CTA. */
export function CatalogCard({
  display,
  viewProfileLabel,
  href,
  photoUrls,
  leadVideo,
  vendorSlug,
  productVideos,
  featured,
  favoriteSlot,
  aboutStoreLabel,
  collapseLabel,
  expandLabel,
  defaultCollapsed = false,
  defaultCollapsedMobile,
  collapsedExternal,
  onCollapsedExternalChange,
  className,
  variant = "catalog",
  profileCtaSlot,
}: CatalogCardProps) {
  const router = useRouter();
  const tCard = useTranslations("Pages.catalogBrowse.vendorCard");
  const hasPhotos = Boolean(
    leadVideo ||
    productVideos?.length ||
    (photoUrls && photoUrls.length > 0),
  );
  const descTrim = display.description.trim();

  const isWholesaleSupplier =
    display.tradeType === "wholesale" || display.tradeType === "hybrid";

  const instagramHref = ensureHttpUrl(display.instagramUrl ?? undefined);

  const canCollapse =
    hasPhotos && Boolean(collapseLabel) && Boolean(expandLabel);

  const isMobile = useIsCatalogMobile();
  const breakpointDefault =
    isMobile && defaultCollapsedMobile !== undefined
      ? defaultCollapsedMobile
      : defaultCollapsed;
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const externallyControlled =
    typeof collapsedExternal === "boolean" &&
    typeof onCollapsedExternalChange === "function";
  const collapsed = externallyControlled
    ? collapsedExternal
    : (userCollapsed ?? breakpointDefault);

  const onToggleCollapsed = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (externallyControlled) {
      onCollapsedExternalChange(!collapsedExternal);
    } else {
      const cur = userCollapsed ?? breakpointDefault;
      setUserCollapsed(!cur);
    }
  };

  const topButtonsCount = canCollapse ? 1 : 0;
  /** Только у текста заголовка — кнопка сворачивания absolute справа, аватар без лишнего отступа слева. */
  const titleReserveRight =
    topButtonsCount === 0
      ? ""
      : topButtonsCount === 1
        ? "pr-14"
        : "pr-[5.5rem]";

  const avatar = (
    <div
      className={cn(
        "relative size-12 shrink-0 overflow-hidden rounded-full border border-border/80 bg-muted sm:size-[3.25rem]",
        featured && "border-primary/30 ring-2 ring-primary/15",
      )}
    >
      {display.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase / внешние URL превью
        <img
          src={display.logoUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className="flex size-full items-center justify-center text-xs font-bold uppercase tracking-wide text-muted-foreground"
          aria-hidden
        >
          {cardInitials(display.storeTitle)}
        </span>
      )}
    </div>
  );

  const collapseToggle = canCollapse ? (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onToggleCollapsed}
      aria-expanded={!collapsed}
      aria-label={collapsed ? expandLabel : collapseLabel}
      title={collapsed ? expandLabel : collapseLabel}
      className={cn(
        "touch-manipulation flex size-9 items-center justify-center rounded-full border bg-card/95 shadow-sm ring-1 ring-black/[0.03] transition-colors",
        "border-border/80 text-muted-foreground",
        "hover:border-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)] hover:text-[var(--d-card-accent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_40%,transparent)]",
      )}
    >
      {collapsed ? (
        <ChevronDown className="size-4" aria-hidden />
      ) : (
        <ChevronUp className="size-4" aria-hidden />
      )}
    </button>
  ) : null;

  const topButtons = canCollapse ? (
    <span className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4">
      {collapseToggle}
    </span>
  ) : null;

  const tradeTypeChipLabel =
    display.tradeType === "wholesale"
      ? tCard("tradeTypeWholesale")
      : display.tradeType === "hybrid"
        ? tCard("tradeTypeHybrid")
        : tCard("tradeTypeRetail");

  const footerCta =
    profileCtaSlot ??
    (href ? (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        aria-label={tCard("profileCtaAria")}
        title={tCard("profileCtaAria")}
        className={cn(
          "inline-flex max-w-full shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold leading-tight shadow-sm transition-colors",
          "border-primary/20 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] text-primary",
          "hover:border-primary/35 hover:from-primary/[0.11] hover:to-primary/[0.04]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        )}
      >
        <span className="min-w-0 truncate">{tCard("profileCta")}</span>
        <ArrowRight className="size-3 shrink-0 opacity-75" aria-hidden />
      </Link>
    ) : (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4">
        {viewProfileLabel}
        <ArrowRight className="size-4" aria-hidden />
      </span>
    ));

  const wholesaleBadge = (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-md border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide shadow-sm",
        isWholesaleSupplier
          ? [
              "border-primary/25 bg-gradient-to-b from-primary/[0.11] to-primary/[0.06]",
              "text-primary ring-1 ring-primary/[0.08]",
              "dark:from-primary/20 dark:to-primary/10 dark:ring-primary/15",
            ]
          : [
              "border-border/80 bg-muted/45 text-muted-foreground",
              "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
            ],
      )}
      title={
        isWholesaleSupplier
          ? tCard("wholesaleBadgeYes")
          : tCard("wholesaleBadgeNo")
      }
    >
      {isWholesaleSupplier ? (
        <Package
          className="size-3.5 shrink-0 opacity-90"
          strokeWidth={2.25}
          aria-hidden
        />
      ) : (
        <ShoppingBag
          className="size-3.5 shrink-0 opacity-80"
          strokeWidth={2.25}
          aria-hidden
        />
      )}
      <span className="min-w-0 truncate">
        {isWholesaleSupplier
          ? tCard("wholesaleBadgeYes")
          : tCard("wholesaleBadgeNo")}
      </span>
    </span>
  );

  /** В каталоге (`href`) — тип сделки рядом с CTA «Открыть» (справа). */
  const tradeTypeFooterPill =
    href != null && href.length > 0 ? (
      <div className="flex shrink-0 items-center">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
            isWholesaleSupplier
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/70 text-muted-foreground",
          )}
          title={
            isWholesaleSupplier
              ? tCard("wholesaleBadgeYes")
              : tCard("wholesaleBadgeNo")
          }
        >
          {tradeTypeChipLabel}
        </span>
      </div>
    ) : null;

  const instagramButton =
    instagramHref !== null ? (
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (href) {
            router.push(href);
          } else if (instagramHref) {
            window.open(instagramHref, "_blank", "noopener,noreferrer");
          }
        }}
        aria-label={href ? tCard("profileCtaAria") : tCard("instagramAria")}
        title={href ? tCard("profileCtaAria") : tCard("instagramAria")}
        className={cn(
          "touch-manipulation shrink-0 rounded-full p-px shadow-sm outline-none transition-[transform,box-shadow]",
          "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
          "hover:shadow-md active:scale-[0.97]",
          "focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-card ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
          <CatalogInstagramGlyph className="size-[17px] text-[#E4405F]" />
        </span>
      </button>
    ) : null;

  const footerBlock = (
    <div className="relative z-10 mt-auto flex w-full min-w-0 shrink-0 items-center justify-between gap-2 border-t border-border/50 pt-2.5 sm:pt-3">
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        {favoriteSlot ? (
          <div className="flex shrink-0 items-center">{favoriteSlot}</div>
        ) : null}
        {instagramButton ? (
          <div className="shrink-0">{instagramButton}</div>
        ) : null}
        {!href ? <div className="min-w-0 shrink">{wholesaleBadge}</div> : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 pl-1 sm:gap-2">
        {tradeTypeFooterPill}
        {footerCta}
      </div>
    </div>
  );

  const photosExpanded =
    hasPhotos && !collapsed ? (
      <div className="min-h-0 w-full pt-4">
        <CatalogCardPhotoRail
          urls={photoUrls ?? []}
          altBase={display.storeTitle}
          className="w-full min-w-0"
          leadVideo={leadVideo}
          vendorSlug={vendorSlug}
          productVideos={productVideos}
        />
      </div>
    ) : null;

  const photosSection =
    hasPhotos ? (
      <div
        className={cn(
          "grid min-h-0 transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          collapsed
            ? "pointer-events-none grid-rows-[0fr]"
            : "grid-rows-[1fr]",
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden",
            collapsed && "pointer-events-none",
          )}
        >
          {photosExpanded}
        </div>
      </div>
    ) : null;

  const headlineAndDescription = (
    <>
      <header className={cn("relative flex w-full min-w-0 gap-3", titleReserveRight)}>
        <div className="shrink-0 pt-0.5">{avatar}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold uppercase leading-[1.2] tracking-tight text-card-foreground sm:text-base">
            {display.storeTitle}
          </h2>
          {display.subtitle?.trim() ? (
            <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-foreground/85 sm:text-[13px]">
              {display.subtitle.trim()}
            </p>
          ) : (
            <p className="mt-0.5 h-[1.125rem]" aria-hidden />
          )}
        </div>
      </header>

      {descTrim ? (
        <section
          aria-label={aboutStoreLabel?.trim() || undefined}
          className="mt-2.5 min-w-0 flex-1 sm:mt-3"
        >
          <p className="line-clamp-3 text-[13px] leading-[1.5] text-muted-foreground/90 sm:text-sm sm:leading-snug">
            {truncateForCompact(descTrim)}
          </p>
        </section>
      ) : null}
    </>
  );

  const mainLinkOrStatic =
    href != null && href.length > 0 ? (
      <Link
        href={href}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-0 cursor-pointer text-left text-inherit no-underline outline-none",
          "focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.14_250_/_0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        )}
      >
        {headlineAndDescription}
      </Link>
    ) : (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0">
        {headlineAndDescription}
      </div>
    );

  const body = (
    <>
      {topButtons}

      {mainLinkOrStatic}

      {footerBlock}

      {photosSection}
    </>
  );

  const cardOutline =
    "border border-solid border-[var(--d-catalog-card-border)] " +
    "hover:border-[var(--d-catalog-card-border-hover)] hover:shadow-md";
  const cardFocusRing =
    "focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.14_250_/_0.35)]";

  const articleClass = cn(
    "relative flex rounded-[var(--d-radius-2xl)] bg-card transition-[box-shadow,border-color]",
    "px-4 pt-4 pb-2.5 shadow-[var(--d-catalog-card-shadow-mobile)] sm:px-5 sm:pt-5 sm:pb-3 lg:shadow-[var(--d-shadow-soft)]",
    cardOutline,
    href && cn("group cursor-pointer outline-none", cardFocusRing),
    className,
  );

  const shellClass = cn(
    articleClass,
    "flex h-full min-h-0 w-full flex-col",
    variant === "preview" && "ring-1 ring-dashed ring-muted-foreground/25",
  );

  const dataAttrs = {
    "data-collapsed": collapsed ? "true" : "false",
    "data-vendor-card": variant,
  } as const;

  return (
    <article className={shellClass} {...dataAttrs}>
      <div className="flex h-full min-h-0 flex-1 flex-col">{body}</div>
    </article>
  );
}
