import {
  GUEST_FREE_CATALOG_CARDS,
} from "@/lib/catalog/catalog-guest-access";
import type {
  PublishedVendorCatalogListRow,
  PublishedVendorRow,
} from "@/lib/catalog/published-vendors";

type VendorWithSensitiveFields =
  | PublishedVendorRow
  | PublishedVendorCatalogListRow;

/** Обнуляет контактные поля вендора для paywall. */
export function redactVendorSensitiveFields<T extends VendorWithSensitiveFields>(
  vendor: T,
): T {
  return {
    ...vendor,
    location_row: null,
    phone_number: "phone_number" in vendor ? null : undefined,
    whatsapp_1: "whatsapp_1" in vendor ? null : undefined,
    whatsapp_2: "whatsapp_2" in vendor ? null : undefined,
    telegram_url: "telegram_url" in vendor ? null : undefined,
  };
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
