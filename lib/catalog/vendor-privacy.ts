import { digitsOnly } from "@/lib/phone";
import { vendorPublicListingNumber } from "@/lib/catalog/vendor-public-seo";
import type { LockedVendorContactAvailability } from "@/lib/catalog/vendor-privacy-types";

type VendorWithPrivatePublicFields = {
  id: string;
  store_name?: string | null;
  location_row?: string | null;
  phone_number?: string | null;
  whatsapp_1?: string | null;
  whatsapp_2?: string | null;
  telegram_url?: string | null;
  instagram_url?: string | null;
  google_maps_uri?: string | null;
  google_place_id?: string | null;
  two_gis_uri?: string | null;
  yandex_maps_uri?: string | null;
  parsed_ai_data?: unknown;
};

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPhoneDigits(value: unknown): boolean {
  return typeof value === "string" && digitsOnly(value).length > 0;
}

function deleteIfPresent(target: Record<string, unknown>, key: string) {
  if (key in target) {
    delete target[key];
  }
}

/**
 * Safe vendor shape for locked/guest public rendering.
 *
 * Do not pass raw vendor contact/location/social fields into Client Components:
 * App Router serializes those props into the RSC/Flight payload even when the
 * visible UI renders locked buttons.
 */
export function stripLockedVendorContacts<T extends VendorWithPrivatePublicFields>(
  vendor: T,
): T {
  const redacted = { ...vendor } as Record<string, unknown>;

  deleteIfPresent(redacted, "store_name");
  deleteIfPresent(redacted, "location_row");
  deleteIfPresent(redacted, "phone_number");
  deleteIfPresent(redacted, "whatsapp_1");
  deleteIfPresent(redacted, "whatsapp_2");
  deleteIfPresent(redacted, "telegram_url");
  deleteIfPresent(redacted, "instagram_url");
  deleteIfPresent(redacted, "google_maps_uri");
  deleteIfPresent(redacted, "google_place_id");
  deleteIfPresent(redacted, "two_gis_uri");
  deleteIfPresent(redacted, "yandex_maps_uri");
  deleteIfPresent(redacted, "parsed_ai_data");

  return redacted as T;
}

/**
 * Presence-only contact shape for locked UI. This keeps the familiar buttons
 * visible without sending the actual URLs, handles, phone numbers, or map ids.
 */
export function lockedVendorContactAvailability(
  vendor: VendorWithPrivatePublicFields,
): LockedVendorContactAvailability {
  return {
    whatsappPrimaryAvailable:
      hasPhoneDigits(vendor.whatsapp_1) || hasPhoneDigits(vendor.phone_number),
    whatsappSecondaryAvailable: hasPhoneDigits(vendor.whatsapp_2),
    telegramAvailable: hasText(vendor.telegram_url),
    instagramAvailable: hasText(vendor.instagram_url),
    phoneAvailable: hasPhoneDigits(vendor.phone_number),
    googleMapsAvailable:
      hasText(vendor.google_maps_uri) || hasText(vendor.google_place_id),
    twoGisAvailable: hasText(vendor.two_gis_uri) || hasText(vendor.google_place_id),
    yandexMapsAvailable: hasText(vendor.yandex_maps_uri),
  };
}

export function safeVendorItemListName(
  vendor: Pick<VendorWithPrivatePublicFields, "id" | "store_name">,
  fallbackLabel: string,
): string {
  const storeName = vendor.store_name?.trim();
  if (storeName) {
    return storeName;
  }
  return `${fallbackLabel} #${vendorPublicListingNumber(vendor.id)}`;
}
