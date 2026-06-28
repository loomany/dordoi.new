"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { CatalogCardPhotoRail } from "@/components/catalog/CatalogCardPhotoRail";

type Batch = {
  id: string;
  createdAt: string;
  photos: string[];
};

type Props = {
  vendorId: string;
  initialBatches: Batch[];
  pageSize?: number;
  altBase: string;
  locale: string;
  productVideos?: string[];
};

/**
 * Лента approved-партий фото товаров.
 * Сверху самая свежая партия, у каждой — дата над листалкой.
 * Старые партии подгружаются по `pageSize` штук при скролле.
 */
export function VendorPhotoBatchFeed({
  vendorId,
  initialBatches,
  pageSize = 4,
  altBase,
  locale,
  productVideos,
}: Props) {
  const t = useTranslations("Pages.providerProfile");
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [hasMore, setHasMore] = useState(initialBatches.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const last = batches[batches.length - 1];
    if (!last) {
      setHasMore(false);
      return;
    }
    setLoading(true);
    try {
      const url = new URL(
        `/api/catalog/vendors/${vendorId}/photo-batches`,
        window.location.origin,
      );
      url.searchParams.set("before", last.createdAt);
      url.searchParams.set("limit", String(pageSize));
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const json = (await res.json()) as { batches?: Batch[] };
      const next = Array.isArray(json.batches) ? json.batches : [];
      if (next.length === 0) {
        setHasMore(false);
      } else {
        setBatches((prev) => {
          const seen = new Set(prev.map((b) => b.id));
          const merged = [...prev];
          for (const b of next) {
            if (!seen.has(b.id)) merged.push(b);
          }
          return merged;
        });
        if (next.length < pageSize) setHasMore(false);
      }
    } catch (e) {
      console.error("[VendorPhotoBatchFeed] load more", e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [batches, hasMore, loading, pageSize, vendorId]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore();
          }
        }
      },
      { rootMargin: "400px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  if (batches.length === 0) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-8">
      {batches.map((batch, batchIndex) => (
        <article
          key={batch.id}
          className="flex flex-col gap-3"
          aria-label={`${altBase} — ${dateFormatter.format(new Date(batch.createdAt))}`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar
              className="size-4 text-[var(--d-card-accent)]"
              aria-hidden
            />
            <time dateTime={batch.createdAt}>
              {t("listingAdded", {
                date: dateFormatter.format(new Date(batch.createdAt)),
              })}
            </time>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <CatalogCardPhotoRail
              urls={batch.photos}
              altBase={`${altBase}: ${dateFormatter.format(new Date(batch.createdAt))}`}
              productVideos={batchIndex === 0 ? productVideos : undefined}
            />
          </div>
        </article>
      ))}
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex h-12 items-center justify-center text-xs text-muted-foreground"
          aria-hidden
        >
          {loading ? t("photoFeedLoadingMore") : ""}
        </div>
      ) : null}
    </div>
  );
}
