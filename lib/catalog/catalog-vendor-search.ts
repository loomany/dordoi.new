import { getAiCatalogDisplayOverlay } from "@/lib/catalog/parsed-ai-catalog-overlay";
import type { PublishedVendorCatalogListRow } from "@/lib/catalog/published-vendors";

export function normalizeCatalogSearchQuery(
  raw: string | null | undefined,
): string {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/\s+/g, " ");
}

function normalizeHaystackText(value: string): string {
  return value.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Собирает поисковый индекс вендора: БД + ИИ-витрина. */
export function vendorCatalogSearchHaystack(
  vendor: Pick<
    PublishedVendorCatalogListRow,
    | "store_name"
    | "slug"
    | "description"
    | "categories"
    | "location_row"
    | "instagram_url"
    | "parsed_ai_data"
  >,
): string {
  const parts: string[] = [];
  if (vendor.store_name?.trim()) parts.push(vendor.store_name);
  if (vendor.slug?.trim()) parts.push(vendor.slug.replace(/-/g, " "));
  if (vendor.description?.trim()) parts.push(vendor.description);
  if (vendor.location_row?.trim()) parts.push(vendor.location_row);
  if (vendor.instagram_url?.trim()) parts.push(vendor.instagram_url);
  for (const category of vendor.categories ?? []) {
    if (category.trim()) parts.push(category);
  }
  const ai = getAiCatalogDisplayOverlay(vendor.parsed_ai_data);
  if (ai?.catalogBrandName) parts.push(ai.catalogBrandName);
  if (ai?.description) parts.push(ai.description);
  if (ai?.subtitle) parts.push(ai.subtitle);
  return normalizeHaystackText(parts.join(" "));
}

export function matchesCatalogSearch(haystack: string, query: string): boolean {
  const normalized = normalizeHaystackText(query);
  if (!normalized) return true;
  const tokens = normalized.split(" ").filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function filterVendorsByCatalogSearch<
  T extends Pick<
    PublishedVendorCatalogListRow,
    | "store_name"
    | "slug"
    | "description"
    | "categories"
    | "location_row"
    | "instagram_url"
    | "parsed_ai_data"
  >,
>(vendors: T[], query: string | null | undefined): T[] {
  const normalized = normalizeCatalogSearchQuery(query);
  if (!normalized) return vendors;
  return vendors.filter((vendor) =>
    matchesCatalogSearch(vendorCatalogSearchHaystack(vendor), normalized),
  );
}
