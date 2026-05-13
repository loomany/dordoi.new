import type { ParsedVendorCardData } from "@/lib/catalog/vendor-card-display";
import {
  commerceCopyFromVendorRow,
  inferVendorTradeType,
} from "@/lib/catalog/vendor-card-display";

import { parseGooglePlacesDescriptionForAdmin } from "@/lib/vendor/google-places-import-description";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";

/**
 * Текст описания для превью карточки каталога (без JSON-блока Google Places).
 */
export function vendorApplicationDescriptionForCatalogCard(
  v: VendorApplicationRecord,
): string {
  if (v.application_source === "google_places") {
    const parsed = parseGooglePlacesDescriptionForAdmin(v.description);
    const intro = parsed?.introBeforeJson?.trim();
    if (intro) return intro;
    const raw = v.description?.trim() ?? "";
    const withoutJson = raw.split("\n\n{")[0]?.trim() ?? "";
    return withoutJson;
  }
  return [v.description?.trim(), v.description_detail?.trim()]
    .filter(Boolean)
    .join("\n\n");
}

export function vendorApplicationToParsedVendorCardData(
  v: VendorApplicationRecord,
  categoryLabels: string[],
  opts: { untitledStoreLabel: string },
): ParsedVendorCardData {
  const description = vendorApplicationDescriptionForCatalogCard(v).trim();
  return {
    storeTitle: v.store_name?.trim() || opts.untitledStoreLabel,
    subtitle: null,
    description,
    tradeType: inferVendorTradeType({ min_batch: v.min_batch }),
    commerce: commerceCopyFromVendorRow({
      min_batch: v.min_batch,
      payment_methods: v.payment_methods,
      delivery_help: v.delivery_help,
      samples_available: v.samples_available,
      samples_note: v.samples_note,
      returns_policy: v.returns_policy,
    }),
    logoUrl: v.logo_url,
    categories: categoryLabels,
    instagramUrl: v.instagram_url?.trim() || null,
  };
}
