"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildInterleavedCatalogMediaSlides,
  type CatalogLeadVideo,
} from "@/lib/catalog/catalog-lead-video";
import { cn } from "@/lib/utils";

type Props = {
  urls: string[];
  altBase: string;
  className?: string;
  leadVideo?: CatalogLeadVideo;
  productVideos?: string[];
  posterUrl?: string;
};

function CatalogCardVideoSlide({
  src,
  posterUrl,
  isActive,
  playLabel,
}: {
  src: string;
  posterUrl?: string;
  isActive: boolean;
  playLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (playing) {
      void videoRef.current?.play();
    }
  }, [playing]);

  const onPlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);
  };

  if (!playing) {
    return (
      <button
        type="button"
        onClick={onPlayClick}
        className="relative block h-full w-full cursor-pointer overflow-hidden bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_40%,transparent)]"
        aria-label={playLabel}
      >
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- poster frame
          <img
            src={posterUrl}
            alt=""
            className="pointer-events-none h-full w-full select-none object-cover [-webkit-user-drag:none]"
            draggable={false}
          />
        ) : (
          <video
            src={src}
            className="pointer-events-none h-full w-full object-cover"
            preload="metadata"
            muted
            playsInline
            aria-hidden
          />
        )}
        <span
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/25"
          aria-hidden
        >
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-white bg-black/55 text-white shadow-xl ring-4 ring-black/20 sm:size-[4.5rem]">
            <Play className="ml-1 size-8 fill-current sm:size-9" aria-hidden />
          </span>
        </span>
      </button>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      className="h-full w-full object-cover"
      controls
      playsInline
      preload="metadata"
      poster={posterUrl}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

/**
 * Одно фото на экране; листание как в кабинете модерации —
 * нативный горизонтальный скролл + snap (палец, тачпад, колесо).
 */
export function CatalogCardPhotoRail({
  urls,
  altBase,
  className,
  leadVideo,
  productVideos,
}: Props) {
  const t = useTranslations("Pages.catalogBrowse");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slides = useMemo(
    () =>
      buildInterleavedCatalogMediaSlides({
        productVideos,
        photoUrls: urls,
        leadVideo,
      }),
    [leadVideo, productVideos, urls],
  );
  const slideCount = slides.length;

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || slideCount === 0) {
      return;
    }
    const w = el.clientWidth;
    if (w <= 0) {
      return;
    }
    const i = Math.round(el.scrollLeft / w);
    setActive(Math.min(slideCount - 1, Math.max(0, i)));
  }, [slideCount]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, slideCount]);

  const goArrow = useCallback(
    (delta: number) => {
      const el = scrollerRef.current;
      if (!el || slideCount <= 1) {
        return;
      }
      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }
      const cur = Math.round(el.scrollLeft / w);
      let next = cur + delta;
      if (next < 0) {
        next = slideCount - 1;
      }
      if (next >= slideCount) {
        next = 0;
      }
      el.scrollTo({ left: next * w, behavior: "smooth" });
    },
    [slideCount],
  );

  if (slideCount === 0) {
    return null;
  }

  const showArrows = slideCount > 1;
  const multi = slideCount > 1;

  return (
    <div
      className={cn("relative w-full min-w-0 shrink-0 overflow-hidden", className)}
      role="group"
      aria-label={altBase}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative aspect-[9/16] w-full min-w-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-inner">
        <div
          ref={scrollerRef}
          className={cn(
            "flex h-full w-full min-w-0 snap-x snap-mandatory overflow-y-hidden overscroll-x-contain scroll-smooth",
            multi ? "overflow-x-auto touch-[pan-x_pan-y]" : "overflow-x-hidden",
            "[-ms-overflow-style:none] [scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden",
          )}
        >
          {slides.map((slide, i) => (
            <div
              key={
                slide.kind === "video"
                  ? `video-${slide.src}-${i}`
                  : `photo-${slide.url}-${i}`
              }
              className="h-full w-full shrink-0 grow-0 basis-full snap-center snap-always"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slideCount}`}
            >
              {slide.kind === "video" ? (
                <CatalogCardVideoSlide
                  src={slide.src}
                  posterUrl={slide.posterUrl}
                  isActive={active === i}
                  playLabel={t("catalogPhotoPlayVideo")}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- внешние превью URL
                <img
                  src={slide.url}
                  alt=""
                  className="pointer-events-none h-full w-full select-none object-cover [-webkit-user-drag:none]"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />
              )}
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
          {active + 1} / {slideCount}
        </p>
      ) : null}
    </div>
  );
}
