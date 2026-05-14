"use client";

import { useCallback, useState } from "react";

import { CatalogAccessPaywallModal } from "@/components/catalog/CatalogAccessPaywallModal";
import type { CatalogAccessPaywallCopy } from "@/components/catalog/CatalogAccessPaywallModal";
import { CatalogCard } from "@/components/catalog/CatalogCard";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";
import {
  catalogListingKeyFromSampleId,
  catalogListingKeyFromSlug,
} from "@/lib/catalog/listing-key";
import type { CatalogCardSourceRow } from "@/lib/catalog/published-vendors";

type Props = {
  cards: CatalogCardSourceRow[];
  favoriteKeys: readonly string[];
  title: string;
  navAriaLabel: string;
  viewProfileLabel: string;
  aboutStoreLabel: string;
  collapseLabel: string;
  expandLabel: string;
  hasFullCatalogAccess?: boolean;
  paywallCopy?: CatalogAccessPaywallCopy;
  lockedCardUnlockLabel?: string;
};

const DESKTOP_COLS = 2;

/**
 * Сетка рекомендованных продавцов на профиле: 2 колонки, карточки как в каталоге
 * (сворачивание ряда на десктопе, фото при раскрытии).
 */
export function VendorRecommendedSellers({
  cards,
  favoriteKeys,
  title,
  navAriaLabel,
  viewProfileLabel,
  aboutStoreLabel,
  collapseLabel,
  expandLabel,
  hasFullCatalogAccess = false,
  paywallCopy,
  lockedCardUnlockLabel,
}: Props) {
  const favoriteSet = new Set(favoriteKeys);
  const isMobile = useIsCatalogMobile();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const openPaywall = useCallback(() => {
    setPaywallOpen(true);
  }, []);

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
          const rowStart = Math.floor(index / DESKTOP_COLS) * DESKTOP_COLS;
          const rowEnd = Math.min(rowStart + DESKTOP_COLS, cards.length);
          for (let i = rowStart; i < rowEnd; i++) {
            updates[i] = next;
          }
        }
        return updates;
      });
    },
    [cards.length, isMobile],
  );

  if (cards.length === 0) {
    return null;
  }

  return (
    <>
    <section className="mt-8 border-t border-border/70 pt-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      <nav
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start sm:gap-5"
        aria-label={navAriaLabel}
      >
        {cards.map((card, index) => {
          const listingKey = card.slug
            ? catalogListingKeyFromSlug(card.slug)
            : catalogListingKeyFromSampleId(card.id);
          const initialFavorite = favoriteSet.has(listingKey);
          const locked = !hasFullCatalogAccess;

          return (
            <div
              key={card.id}
              className="flex h-full min-h-0 w-full min-w-0 flex-col md:h-auto"
            >
              <CatalogCard
                className="h-full min-h-0 w-full md:h-auto"
                href={card.href}
                display={card.display}
                photoUrls={card.photoUrls}
                leadVideo={card.leadVideo}
                productVideos={card.productVideos}
                featured={card.featured}
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
                accessLocked={locked}
                onAccessLockedClick={locked ? openPaywall : undefined}
                accessLockedTitleLabel={lockedCardUnlockLabel}
                favoriteSlot={
                  locked ? null : (
                    <CatalogFavoriteButton
                      key={`${listingKey}:${initialFavorite}`}
                      listingKey={listingKey}
                      initialFavorite={initialFavorite}
                      variant="card"
                      showCardLabel={false}
                    />
                  )
                }
              />
            </div>
          );
        })}
      </nav>
    </section>

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
