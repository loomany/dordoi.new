"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  urls: string[];
  altBase: string;
  className?: string;
};

/**
 * Одно фото на экране; листание как в кабинете модерации —
 * нативный горизонтальный скролл + snap (палец, тачпад, колесо).
 */
export function CatalogCardPhotoRail({ urls, altBase, className }: Props) {
  const t = useTranslations("Pages.catalogBrowse");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || urls.length === 0) {
      return;
    }
    const w = el.clientWidth;
    if (w <= 0) {
      return;
    }
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(urls.length - 1, Math.max(0, i)));
  }, [urls.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, urls.length]);

  const goArrow = useCallback(
    (delta: number) => {
      const el = scrollerRef.current;
      if (!el || urls.length <= 1) {
        return;
      }
      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }
      const cur = Math.round(el.scrollLeft / w);
      let next = cur + delta;
      if (next < 0) {
        next = urls.length - 1;
      }
      if (next >= urls.length) {
        next = 0;
      }
      el.scrollTo({ left: next * w, behavior: "smooth" });
    },
    [urls.length],
  );

  if (urls.length === 0) {
    return null;
  }

  const showArrows = urls.length > 1;

  return (
    <div
      className={cn("relative w-full shrink-0", className)}
      role="group"
      aria-label={altBase}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border/80 bg-muted shadow-inner">
        <div
          ref={scrollerRef}
          className={cn(
            "flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth",
            "touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden",
          )}
        >
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="h-full min-w-full shrink-0 snap-center snap-always"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${urls.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- внешние превью URL */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {showArrows ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-1">
            <button
              type="button"
              className={cn(
                "pointer-events-auto flex size-9 items-center justify-center rounded-full",
                "border border-border/80 bg-card/95 text-muted-foreground shadow-md backdrop-blur-sm",
                "transition-colors hover:bg-card hover:border-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)] hover:text-[var(--d-card-accent)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_40%,transparent)]",
              )}
              aria-label={t("catalogPhotoPrev")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goArrow(-1);
              }}
            >
              <ChevronLeft className="size-5 stroke-[2]" aria-hidden />
            </button>
            <button
              type="button"
              className={cn(
                "pointer-events-auto flex size-9 items-center justify-center rounded-full",
                "border border-border/80 bg-card/95 text-muted-foreground shadow-md backdrop-blur-sm",
                "transition-colors hover:bg-card hover:border-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)] hover:text-[var(--d-card-accent)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_40%,transparent)]",
              )}
              aria-label={t("catalogPhotoNext")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goArrow(1);
              }}
            >
              <ChevronRight className="size-5 stroke-[2]" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {showArrows ? (
        <p className="mt-2 text-center text-[11px] tabular-nums text-muted-foreground/70">
          {active + 1} / {urls.length}
        </p>
      ) : null}
    </div>
  );
}
