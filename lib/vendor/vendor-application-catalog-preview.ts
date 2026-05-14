import { getAiCatalogDisplayOverlay } from "@/lib/catalog/parsed-ai-catalog-overlay";
import {
  dedupeCatalogSubtitle,
  resolveCatalogStoreTitleForCard,
} from "@/lib/catalog/catalog-card-title";
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
export function isVendorImportBoilerplate(text: string | null | undefined): boolean {
  const t = (text ?? "").trim().toLowerCase();
  if (!t) return false;
  return (
    t.includes("импорт из выгрузки") ||
    t.includes("найдено автоматически через google places") ||
    t.includes("проверьте название, категорию и адрес") ||
    t.includes("проверьте контакты и категорию")
  );
}

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

export function vendorApplicationAiDescription(
  v: VendorApplicationRecord,
  locale = "ru",
): string | null {
  const ai = getAiCatalogDisplayOverlay(v.parsed_ai_data, locale);
  const text = ai?.description?.trim();
  return text || null;
}

export function vendorApplicationToParsedVendorCardData(
  v: VendorApplicationRecord,
  categoryLabels: string[],
  opts: { untitledStoreLabel: string; locale?: string },
): ParsedVendorCardData {
  const locale = opts.locale ?? "ru";
  const ai = getAiCatalogDisplayOverlay(v.parsed_ai_data, locale);
  const rawFallback = vendorApplicationDescriptionForCatalogCard(v).trim();
  const fallbackDescription = isVendorImportBoilerplate(rawFallback)
    ? ""
    : rawFallback;

  const { storeTitle, catalogBrandName } = resolveCatalogStoreTitleForCard({
    dbStoreName: v.store_name?.trim() ?? "",
    fallbackTitle: opts.untitledStoreLabel,
    catalogBrandNameFromAi: ai?.catalogBrandName,
    instagramProfileUrl: v.instagram_url?.trim() || null,
  });

  const subtitle = ai?.subtitle?.trim()
    ? dedupeCatalogSubtitle(storeTitle, ai.subtitle)
    : null;

  return {
    storeTitle,
    catalogBrandName,
    subtitle,
    description: ai?.description?.trim() || fallbackDescription,
    tradeType: ai?.tradeType ?? inferVendorTradeType({ min_batch: v.min_batch }),
    commerce: ai
      ? ai.commerce
      : commerceCopyFromVendorRow({
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
