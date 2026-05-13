/**
 * Вендоры, перенесённые в раздел `/buyers` — не показываем в публичном каталоге поставщиков.
 */
export const BUYER_ONLY_VENDOR_SLUGS = new Set<string>(["dordoi-zakup-aiperi"]);

export function isBuyerOnlyVendorSlug(slug: string | null | undefined): boolean {
  const key = typeof slug === "string" ? slug.trim() : "";
  return key.length > 0 && BUYER_ONLY_VENDOR_SLUGS.has(key);
}
