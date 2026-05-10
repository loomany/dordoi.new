"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogCardPhotoRail } from "@/components/catalog/CatalogCardPhotoRail";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";
import {
  CATALOG_CARD_COLLAPSED_DESCRIPTION_MAX_CHARS,
  CATEGORY_LABEL_MAX_CHARS,
  DESCRIPTION_CARD_MAX_CHARS,
} from "@/lib/vendor/vendor-field-limits";
import { cn } from "@/lib/utils";

export type CatalogCardProps = {
  title: string;
  description: string;
  viewProfileLabel: string;
  /** When set, the whole card links to the provider profile (no nested button). */
  href?: string;
  /** Строка под названием (образец полей анкеты / короткий акцент). */
  tagline?: string | null;
  /** Круглый логотип слева от названия. */
  avatarUrl?: string | null;
  /** Скрыть блок аватара (только название в шапке). */
  hideAvatar?: boolean;
  /** Горизонтальная лента фото справа (или под текстом на узком экране). */
  photoUrls?: string[];
  /** Карточка-подборка / после модерации — акцентная рамка. */
  featured?: boolean;
  /** Pre-formatted “added / updated” lines from registry + i18n. */
  addedLine?: string;
  updatedLine?: string;
  /** Кнопка избранного — угол карточки; клик не всплывает к ссылке карточки. */
  favoriteSlot?: ReactNode;
  /** Заголовок текстового блока о поставщике (колонка слева от ленты фото). */
  aboutStoreLabel?: string;
  /** Категории товаров (как в анкете `vendors.categories`). */
  categories?: string[];
  /** Подпись над чипами: «Категория» / «Категории» в зависимости от числа. */
  categoriesSectionLabel?: string;
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

/** Обрезка описания в каталоге; полный лимит поля — `DESCRIPTION_CARD_MAX_CHARS`. */
const COMPACT_DESC_MAX = CATALOG_CARD_COLLAPSED_DESCRIPTION_MAX_CHARS;
const RAIL_DESC_MAX = DESCRIPTION_CARD_MAX_CHARS;

/** Обрезает текст по символам (по последнему пробелу), добавляет «…», убирая хвостовые знаки. */
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

function truncateForRail(text: string): string {
  return truncateAtChars(text, RAIL_DESC_MAX);
}

/** Карточка поставщика в каталоге: аватар + блок текста + опциональная лента фото. */
export function CatalogCard({
  title,
  description,
  viewProfileLabel,
  href,
  tagline,
  avatarUrl,
  hideAvatar = false,
  photoUrls,
  featured,
  favoriteSlot,
  aboutStoreLabel,
  categories,
  collapseLabel,
  expandLabel,
  defaultCollapsed = false,
  defaultCollapsedMobile,
  collapsedExternal,
  onCollapsedExternalChange,
  className,
}: CatalogCardProps) {
  const hasPhotos = Boolean(photoUrls && photoUrls.length > 0);
  const tag = tagline?.trim();
  const descTrim = description.trim();
  const categoryList = (categories ?? []).map((c) => c.trim()).filter(Boolean);
  /**
   * Первая категория — под заголовком (лимит ввода `CATEGORY_LABEL_MAX_CHARS`);
   * длинные значения из старых данных мягко обрезаем в превью.
   */
  const headingCategoryRaw = categoryList[0];
  const headingCategory =
    headingCategoryRaw && headingCategoryRaw.length > CATEGORY_LABEL_MAX_CHARS
      ? `${headingCategoryRaw.slice(0, CATEGORY_LABEL_MAX_CHARS).replace(/[\s,.;:!?\-—]+$/u, "")}…`
      : headingCategoryRaw;
  const categoriesForChips = headingCategoryRaw
    ? categoryList.slice(1)
    : categoryList;
  const showCategoryChips = categoriesForChips.length > 0;

  const canCollapse =
    hasPhotos && Boolean(collapseLabel) && Boolean(expandLabel);

  /**
   * Состояние сворачивания.
   * Пока пользователь не нажал toggle — берём дефолт по breakpoint
   * (`defaultCollapsedMobile` на mobile, иначе `defaultCollapsed`).
   * После первого клика — фиксируем выбор пользователя в локальном стейте.
   */
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

  /** Реальный ли rail-layout рендерим прямо сейчас. */
  const effectiveRail = hasPhotos && !collapsed;
  const showAboutBlock =
    effectiveRail && Boolean(tag || descTrim);

  /** Сколько кнопок в верхнем правом углу — для расчёта правого паддинга шапки. */
  const topButtonsCount = (favoriteSlot ? 1 : 0) + (canCollapse ? 1 : 0);
  const topPadRight =
    topButtonsCount === 0 ? "" : topButtonsCount === 1 ? "pr-14" : "pr-[5.5rem]";
  const topPadSymmetric =
    topButtonsCount === 0 ? "" : topButtonsCount === 1 ? "px-14" : "px-[5.5rem]";

  const avatar = (
    <div
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-sm",
        featured && "border-primary/30 ring-2 ring-primary/15",
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase / внешние URL превью
        <img
          src={avatarUrl}
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
          {cardInitials(title)}
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

  const topButtons =
    canCollapse || favoriteSlot ? (
      <span className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {collapseToggle}
        {favoriteSlot}
      </span>
    ) : null;

  /** Чипы категорий (slice + «+N» счётчик) — общий блок для compact и rail. */
  const categoryChips = showCategoryChips ? (
    <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
      {categoriesForChips.slice(0, 2).map((cat, i) => (
        <li
          key={`${i}-${cat}`}
          className="max-w-[10rem] truncate rounded-full border border-primary/15 bg-secondary/70 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
          title={cat}
        >
          {cat}
        </li>
      ))}
      {categoriesForChips.length > 2 ? (
        <li
          className="rounded-full border border-primary/15 bg-secondary/70 px-2 py-0.5 text-xs font-semibold text-secondary-foreground"
          title={categoriesForChips.slice(2).join(", ")}
        >
          +{categoriesForChips.length - 2}
        </li>
      ) : null}
    </ul>
  ) : null;

  /** Link-style CTA «Профиль магазина →» — общий для compact и rail. */
  const renderCtaLink = (className?: string) => (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 group-hover:underline",
        className,
      )}
    >
      {viewProfileLabel}
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </span>
  );

  /**
   * Название в rail-колонке.
   * - На mobile rail-карточка — одна колонка, кнопки (toggle/favorite) лежат над текстом
   *   → нужен padding, чтобы заголовок не залазил под них.
   * - На lg+ кнопки уходят над фото-колонкой справа → padding не нужен,
   *   заголовок центрируется в полной ширине левой колонки (между краем карточки и фото).
   */
  const railHeadingRow = (
    <div
      className={cn(
        "relative w-full min-w-0",
        topPadRight,
        topButtonsCount > 0 && "lg:pr-0",
        showAboutBlock && "pb-3",
      )}
    >
      {!hideAvatar ? (
        <div className="pointer-events-none absolute left-0 top-1/2 z-[1] -translate-y-1/2">
          {avatar}
        </div>
      ) : null}
      <h2
        className={cn(
          "text-center text-sm font-bold leading-tight text-card-foreground lg:text-lg",
          !hideAvatar && "pl-[4.25rem]" /* size-14 + gap-3 */,
          /* Симметричный px сужал заголовок вдвойне с родительским pr под кнопки — на <lg оставляем только отступ справа у обёртки. */
          hideAvatar && topButtonsCount > 0 && "max-lg:px-0 lg:px-0",
        )}
      >
        {title}
      </h2>
      {headingCategory ? (
        <p
          className={cn(
            "mt-1.5 text-center text-sm font-semibold leading-snug text-muted-foreground",
            !hideAvatar && "pl-[4.25rem] lg:pl-0",
            hideAvatar && topButtonsCount > 0 && "max-lg:px-0 lg:px-0",
          )}
        >
          {headingCategory}
        </p>
      ) : null}
    </div>
  );

  const body = (
    <>
      {topButtons}

      {effectiveRail ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
            {showAboutBlock ? (
              <div className="flex min-w-0 flex-col">
                {railHeadingRow}
                <section
                  className="flex flex-col gap-2 border-t border-border/70 pt-3"
                  aria-label={aboutStoreLabel?.trim() || undefined}
                >
                  {aboutStoreLabel?.trim() ? (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {aboutStoreLabel.trim()}
                    </h3>
                  ) : null}
                  <div className="space-y-2 text-sm leading-relaxed">
                    {tag && tag !== headingCategoryRaw ? (
                      <p className="font-semibold text-card-foreground">{tag}</p>
                    ) : null}
                    {descTrim ? (
                      <p className="whitespace-pre-line break-words text-muted-foreground">
                        {truncateForRail(descTrim)}
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : (
              railHeadingRow
            )}

            {categoryChips ? (
              <div className="mt-auto flex flex-col items-start gap-3 border-t border-border/70 pt-3">
                {categoryChips}
              </div>
            ) : null}
          </div>

          <div className="flex w-full min-w-0 shrink-0 flex-col lg:h-full lg:min-h-0 lg:max-w-[min(100%,260px)]">
            <CatalogCardPhotoRail urls={photoUrls!} altBase={title} className="w-full min-w-0" />
            {/* На lg лишняя высота ряда уходит сюда — низ карточки совпадает у соседей */}
            <div className="flex shrink-0 flex-col justify-end pt-3 lg:min-h-0 lg:flex-1">
              <div className="flex shrink-0 justify-center">{renderCtaLink("justify-center")}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div className={cn("relative w-full min-w-0", topButtonsCount > 0 && topPadSymmetric)}>
            <h2 className="text-center text-sm font-bold leading-tight text-card-foreground sm:text-base lg:text-lg">
              {title}
            </h2>
            {headingCategory ? (
              <p className="mt-1.5 text-center text-sm font-semibold leading-snug text-muted-foreground">
                {headingCategory}
              </p>
            ) : null}
            {tag && tag !== headingCategoryRaw ? (
              <p
                className={cn(
                  "text-center text-sm font-semibold leading-snug text-card-foreground",
                  headingCategory ? "mt-1" : "mt-1.5",
                )}
              >
                {tag}
              </p>
            ) : null}
            {/* Ряд / адрес (`location_row`) в каталоге не показываем — только на странице профиля магазина. */}
          </div>

          {descTrim ? (
            <p className="line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">
              {truncateForCompact(descTrim)}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
            {categoryChips}
            {renderCtaLink("ml-auto")}
          </div>
        </div>
      )}
    </>
  );

  // Рамка: сплошные токены (см. tokens.css) — на мобильном WebKit лучше, чем `color-mix` + тонкий border.
  // Тень: на <lg компактная, иначе длинный blur на высокой карточке выглядит как «растянутая» обводка.
  const cardOutline =
    "border border-solid border-[var(--d-catalog-card-border)] " +
    "hover:border-[var(--d-catalog-card-border-hover)] hover:shadow-md";
  const cardFocusRing =
    "focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.14_250_/_0.35)]";

  const articleClass = cn(
    "relative flex rounded-[var(--d-radius-2xl)] bg-card transition-[box-shadow,border-color]",
    "p-5 shadow-[var(--d-catalog-card-shadow-mobile)] sm:p-6 lg:shadow-[var(--d-shadow-soft)]",
    cardOutline,
    href && cn("group outline-none", cardFocusRing),
    className,
  );

  const shellClass = cn(
    articleClass,
    /* Без `h-full`: в grid с высоким соседом рамка не должна тянуться на всю строку после сворачивания. */
    "flex min-h-0 w-full flex-col",
  );

  if (href) {
    return (
      <Link
        href={href}
        data-collapsed={collapsed ? "true" : "false"}
        className={shellClass}
      >
        <div className="flex min-h-0 flex-col">{body}</div>
      </Link>
    );
  }

  return (
    <article
      data-collapsed={collapsed ? "true" : "false"}
      className={shellClass}
    >
      <div className="flex min-h-0 flex-col">{body}</div>
    </article>
  );
}
