"use client";

import { useCallback, useState } from "react";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";import {
  catalogListingKeyFromSampleId,
  catalogListingKeyFromSlug,
} from "@/lib/catalog/listing-key";
import type { CatalogCardSourceRow } from "@/lib/catalog/published-vendors";

type Props = {
  cards: CatalogCardSourceRow[];
  favoriteKeys: readonly string[];
  gridAriaLabel: string;
  viewProfileLabel: string;
  aboutStoreLabel: string;
  collapseLabel: string;
  expandLabel: string;
};

/**
 * Свёрнутость — по индексу карточки.
 * На `lg+` (3 колонки) раскрытие/сворачивание одной карточки синхронизируется со всем рядом.
 * Ниже `lg` каждая карточка независима.
 */
export function CatalogBrowseCardGrid({  cards,
  favoriteKeys,
  gridAriaLabel,
  viewProfileLabel,
  aboutStoreLabel,
  collapseLabel,
  expandLabel,
}: Props) {
  const favoriteSet = new Set(favoriteKeys);
  const isMobile = useIsCatalogMobile();
  const desktopCols = 3;

  const [collapsedByIndex, setCollapsedByIndex] = useState<Record<number, boolean>>({});
  const collapsedForIndex = useCallback(
    (index: number) => {
      if (Object.prototype.hasOwnProperty.call(collapsedByIndex, index)) {
        return collapsedByIndex[index]!;
      }
      return true;
    },
    [collapsedByIndex],
  );

  const setCollapsedForIndex = useCallback(
    (index: number, next: boolean) => {
      setCollapsedByIndex((prev) => {
        const updates: Record<number, boolean> = { ...prev, [index]: next };
        if (!isMobile) {
          const rowStart = Math.floor(index / desktopCols) * desktopCols;
          const rowEnd = Math.min(rowStart + desktopCols, cards.length);
          for (let i = rowStart; i < rowEnd; i++) {
            updates[i] = next;
          }
        }
        return updates;
      });
    },
    [cards.length, isMobile],
  );
  return (
    <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start lg:grid-cols-3"
      aria-label={gridAriaLabel}
    >
      {cards.map((c, index) => {
        const listingKey = c.slug
          ? catalogListingKeyFromSlug(c.slug)
          : catalogListingKeyFromSampleId(c.id);
        const initialFavorite = favoriteSet.has(listingKey);

        return (
          <div
            key={c.id}
            className="flex h-full min-h-0 w-full min-w-0 flex-col md:h-auto"
          >
            <CatalogCard
              className="h-full min-h-0 w-full md:h-auto"
              href={c.href}
              display={c.display}
              photoUrls={c.photoUrls}
              leadVideo={c.leadVideo}
              productVideos={c.productVideos}
              featured={c.featured}
              viewProfileLabel={viewProfileLabel}
              aboutStoreLabel={aboutStoreLabel}
              collapseLabel={collapseLabel}
              expandLabel={expandLabel}
              defaultCollapsed
              defaultCollapsedMobile
              collapsedExternal={collapsedForIndex(index)}
              onCollapsedExternalChange={(next) =>
                setCollapsedForIndex(index, next)
              }
              favoriteSlot={
                <CatalogFavoriteButton
                  key={`${listingKey}:${initialFavorite}`}
                  listingKey={listingKey}
                  initialFavorite={initialFavorite}
                  variant="card"
                  showCardLabel={false}
                />
              }
            />
          </div>
        );
      })}
    </section>
  );
}
