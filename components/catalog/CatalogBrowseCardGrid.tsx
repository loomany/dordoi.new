"use client";

import { useCallback, useState } from "react";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import {
  catalogListingKeyFromSampleId,
  catalogListingKeyFromSlug,
} from "@/lib/catalog/listing-key";
import type { CatalogCardSourceRow } from "@/lib/catalog/published-vendors";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";

type Props = {
  cards: CatalogCardSourceRow[];
  favoriteKeys: readonly string[];
  gridAriaLabel: string;
  viewProfileLabel: string;
  aboutStoreLabel: string;
  collapseLabel: string;
  expandLabel: string;
  cardCategoryOne: string;
  cardCategoriesMany: string;
};

/**
 * Состояние свёрнутости — **по индексу карточки** (стабильно при SSR и после гидрации).
 * Раньше на мобилке после гидрации менялся ключ `floor(i/2)` → `i`, из‑за этого стейт и тоггл расходились.
 */
export function CatalogBrowseCardGrid({
  cards,
  favoriteKeys,
  gridAriaLabel,
  viewProfileLabel,
  aboutStoreLabel,
  collapseLabel,
  expandLabel,
  cardCategoryOne,
  cardCategoriesMany,
}: Props) {
  const isMobile = useIsCatalogMobile();
  const favoriteSet = new Set(favoriteKeys);

  const [rowCollapsed, setRowCollapsed] = useState<Record<number, boolean>>({});

  const collapsedForIndex = useCallback(
    (index: number) => {
      if (Object.prototype.hasOwnProperty.call(rowCollapsed, index)) {
        return rowCollapsed[index]!;
      }
      return isMobile ? index >= 1 : index >= 2;
    },
    [rowCollapsed, isMobile],
  );

  const setCollapsedForRowOfIndex = useCallback((index: number, next: boolean) => {
    setRowCollapsed((prev) => ({ ...prev, [index]: next }));
  }, []);

  return (
    <section
      className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch"
      aria-label={gridAriaLabel}
    >
      {cards.map((c, index) => {
        const listingKey = c.slug
          ? catalogListingKeyFromSlug(c.slug)
          : catalogListingKeyFromSampleId(c.id);
        const initialFavorite = favoriteSet.has(listingKey);
        const cardCategories =
          c.categories.length > 0 ? c.categories : undefined;
        const categoriesSectionLabel =
          cardCategories && cardCategories.length > 0
            ? cardCategories.length === 1
              ? cardCategoryOne
              : cardCategoriesMany
            : undefined;

        const defaultCollapsed = index >= 2;
        const defaultCollapsedMobile = index >= 1;

        return (
          <div key={c.id} className="flex min-h-0 h-full flex-col">
          <CatalogCard
            className="flex min-h-0 flex-1"
            href={c.href}
            title={c.title}
            tagline={c.tagline ?? undefined}
            description={c.description}
            categories={cardCategories}
            categoriesSectionLabel={categoriesSectionLabel}
            avatarUrl={c.avatarUrl ?? undefined}
            hideAvatar={c.hideAvatar}
            photoUrls={c.photoUrls}
            featured={c.featured}
            addedLine={c.addedLine}
            updatedLine={c.updatedLine}
            viewProfileLabel={viewProfileLabel}
            aboutStoreLabel={aboutStoreLabel}
            collapseLabel={collapseLabel}
            expandLabel={expandLabel}
            defaultCollapsed={defaultCollapsed}
            defaultCollapsedMobile={defaultCollapsedMobile}
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
