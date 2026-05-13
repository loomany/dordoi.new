import "server-only";

import { GUEST_FREE_CATALOG_CARDS } from "@/lib/catalog/catalog-guest-access";

/** Максимум карточек в ответе сервера без активной подписки. */
export function catalogFreeVendorLimit(): number {
  return GUEST_FREE_CATALOG_CARDS;
}

export function catalogPageSizeForAccess(hasFullAccess: boolean): number {
  return hasFullAccess ? 12 : catalogFreeVendorLimit();
}

export function catalogEffectivePage(
  requestedPage: number,
  hasFullAccess: boolean,
): number {
  return hasFullAccess ? requestedPage : 1;
}

export function capCatalogTotalCountForFreeAccess(
  totalCount: number,
  hasFullAccess: boolean,
): number {
  if (hasFullAccess) {
    return totalCount;
  }
  return Math.min(totalCount, catalogFreeVendorLimit());
}
