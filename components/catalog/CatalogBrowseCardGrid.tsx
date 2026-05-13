"use client";

import { useCallback, useState } from "react";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import {
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
 * Состояние свёрнутости — **по индексу карточки** (стабильно при SSR и после гидрации).
 * По умолчанию все карточки со сворачиваемыми фото приходят свёрнутыми; раскрывает пользователь.
 */
export function CatalogBrowseCardGrid({
  cards,
  favoriteKeys,
  gridAriaLabel,
  viewProfileLabel,
  aboutStoreLabel,
  collapseLabel,
  expandLabel,
}: Props) {
  const favoriteSet = new Set(favoriteKeys);

  const [rowCollapsed, setRowCollapsed] = useState<Record<number, boolean>>({});

  const collapsedForIndex = useCallback(
    (index: number) => {
      if (Object.prototype.hasOwnProperty.call(rowCollapsed, index)) {
        return rowCollapsed[index]!;
      }
      return true;
    },
    [rowCollapsed],
  );

  const setCollapsedForRowOfIndex = useCallback((index: number, next: boolean) => {
    setRowCollapsed((prev) => ({ ...prev, [index]: next }));
  }, []);

  return (
    <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-label={gridAriaLabel}
    >
      {cards.map((c, index) => {
        const listingKey = c.slug
          ? catalogListingKeyFromSlug(c.slug)
          : catalogListingKeyFromSampleId(c.id);
        const initialFavorite = favoriteSet.has(listingKey);

        return (
          <div key={c.id} className="flex h-full min-h-0 w-full min-w-0 flex-col">
            <CatalogCard
              className="h-full min-h-0 w-full flex-1"
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
                setCollapsedForRowOfIndex(index, next)
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
