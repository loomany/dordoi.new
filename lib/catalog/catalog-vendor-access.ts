import {
  GUEST_FREE_CATALOG_CARDS,
} from "@/lib/catalog/catalog-guest-access";
import type {
  PublishedVendorCatalogListRow,
  PublishedVendorRow,
} from "@/lib/catalog/published-vendors";
import { stripLockedVendorContacts } from "@/lib/catalog/vendor-privacy";

type VendorWithSensitiveFields =
  | PublishedVendorRow
  | PublishedVendorCatalogListRow;

/** Обнуляет контактные поля вендора для paywall. */
export function redactVendorSensitiveFields<T extends VendorWithSensitiveFields>(
  vendor: T,
): T {
  return stripLockedVendorContacts(vendor);
}

export function applyCatalogAccessToVendors<T extends VendorWithSensitiveFields>(
  vendors: T[],
  opts: {
    hasFullAccess: boolean;
    globalOffset: number;
    freeLimit?: number;
  },
): T[] {
  if (opts.hasFullAccess) {
    return vendors;
  }

  const limit = opts.freeLimit ?? GUEST_FREE_CATALOG_CARDS;
  return vendors.map((vendor, index) => {
    const globalIndex = opts.globalOffset + index;
    if (globalIndex < limit) {
      return vendor;
    }
    return redactVendorSensitiveFields(vendor);
  });
}
