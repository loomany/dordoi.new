"use client";

import Image from "next/image";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Props = {
  urls: string[];
  getAlt: (index: number) => string;
  /** Screen reader label for the carousel (falls back to first slide alt). */
  ariaLabel?: string;
  /** Next/Image unoptimized: fixed bool or per-URL (e.g. localhost). */
  unoptimized?: boolean | ((url: string) => boolean);
  /** Outer rounding / border to match surrounding cards. */
  className?: string;
  innerClassName?: string;
  /** Close button (fullscreen). */
  closeLabel?: string;
  /** Opener control / aria for thumbnail tap. */
  openLabel?: string;
};

export function ProductPhotosSwipeCarousel({
  urls,
  getAlt,
  ariaLabel,
  unoptimized = false,
  className,
  innerClassName,
  closeLabel = "Закрыть",
  openLabel = "Открыть во весь экран",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fsScrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fsInitialIndex, setFsInitialIndex] = useState(0);
  const [fsActive, setFsActive] = useState(0);

  const isUnopt = useCallback(
    (url: string) =>
      typeof unoptimized === "function" ? unoptimized(url) : unoptimized,
    [unoptimized],
  );

  const onThumbScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || urls.length === 0) {
      return;
    }
    const slideW = el.clientWidth;
    if (slideW <= 0) {
      return;
    }
    const i = Math.round(el.scrollLeft / slideW);
    setActive(Math.min(urls.length - 1, Math.max(0, i)));
  }, [urls.length]);

  const onFsScroll = useCallback(() => {
    const el = fsScrollerRef.current;
    if (!el || urls.length === 0) {
      return;
    }
    const slideW = el.clientWidth;
    if (slideW <= 0) {
      return;
    }
    const i = Math.round(el.scrollLeft / slideW);
    setFsActive(Math.min(urls.length - 1, Math.max(0, i)));
  }, [urls.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    onThumbScroll();
    el.addEventListener("scroll", onThumbScroll, { passive: true });
    return () => el.removeEventListener("scroll", onThumbScroll);
  }, [onThumbScroll, urls.length]);

  useLayoutEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const el = fsScrollerRef.current;
    if (!el) {
      return;
    }
    const run = () => {
      const w = el.clientWidth;
      if (w <= 0) {
        return;
      }
      el.scrollLeft = fsInitialIndex * w;
      setFsActive(
        Math.min(urls.length - 1, Math.max(0, fsInitialIndex)),
      );
    };
    requestAnimationFrame(run);
  }, [lightboxOpen, fsInitialIndex, urls.length]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const el = fsScrollerRef.current;
    if (!el) {
      return;
    }
    onFsScroll();
    el.addEventListener("scroll", onFsScroll, { passive: true });
    return () => el.removeEventListener("scroll", onFsScroll);
  }, [lightboxOpen, onFsScroll, urls.length]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  const openFullscreen = useCallback((index: number) => {
    setFsInitialIndex(index);
    setLightboxOpen(true);
  }, []);

  if (urls.length === 0) {
    return null;
  }

  const lightboxContent = lightboxOpen ? (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel?.trim() || getAlt(0)}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {urls.length > 1 ? (
          <span className="text-sm tabular-nums text-white/85">
            {fsActive + 1} / {urls.length}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setLightboxOpen(false)}
          className="rounded-full p-2.5 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label={closeLabel}
        >
          <X className="size-6" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div
        ref={fsScrollerRef}
        className={cn(
          "flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth",
          "touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
        )}
      >
        {urls.map((url, i) => (
          <div
            key={`fs-${url}-${i}`}
            className="flex h-full min-h-0 min-w-full shrink-0 snap-center snap-always items-center justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            aria-roledescription="slide"
          >
            {/* Нативный img: сохраняет пропорции без растягивания (fill + flex давали искажение). */}
            {/* eslint-disable-next-line @next/next/no-img-element -- полноэкран: точный contain без артефактов Next/Image */}
            <img
              src={url}
              alt={getAlt(i)}
              className="h-auto max-h-[calc(100dvh-5.5rem)] w-auto max-w-full object-contain"
              loading={i === fsInitialIndex ? "eager" : "lazy"}
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel?.trim() || getAlt(0) || "Photos"}
      >
        <div
          ref={scrollerRef}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto scroll-smooth",
            "touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden",
          )}
        >
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="min-w-full shrink-0 snap-center snap-always"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${urls.length}`}
            >
              <button
                type="button"
                onClick={() => openFullscreen(i)}
                className={cn(
                  "relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-left outline-none transition-opacity hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950",
                  "aspect-square",
                  innerClassName,
                )}
                aria-label={`${openLabel}: ${getAlt(i)}`}
              >
                <Image
                  src={url}
                  alt={getAlt(i)}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized={isUnopt(url)}
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
          ))}
        </div>
        {urls.length > 1 ? (
          <p className="mt-2 text-center text-xs tabular-nums text-muted-foreground">
            {active + 1} / {urls.length}
          </p>
        ) : null}
      </div>

      {mounted && lightboxContent
        ? createPortal(lightboxContent, document.body)
        : null}
    </>
  );
}
