"use client";

import type { ReactNode } from "react";

import { useCatalogBrowseRefreshOptional } from "@/components/catalog/CatalogBrowseRefreshContext";
import {
  CatalogBrowseGridSkeleton,
  CatalogPaginationSkeleton,
} from "@/components/catalog/skeleton/CatalogBrowseGridSkeleton";

type Props = {
  children: ReactNode;
  skeletonCount?: number;
  showPaginationSkeleton?: boolean;
};

/** Пока идёт смена `?cat=` — сетка карточек заменяется скелетоном. */
export function CatalogBrowseResultsGate({
  children,
  skeletonCount = 12,
  showPaginationSkeleton = false,
}: Props) {
  const refresh = useCatalogBrowseRefreshOptional();
  const isRefreshing = refresh?.isRefreshing ?? false;

  if (isRefreshing) {
    return (
      <>
        <CatalogBrowseGridSkeleton count={skeletonCount} />
        {showPaginationSkeleton ? <CatalogPaginationSkeleton /> : null}
      </>
    );
  }

  return children;
}
