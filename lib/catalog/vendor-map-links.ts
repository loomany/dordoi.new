/** Публичные ссылки на карты для профиля продавца в каталоге. */

export function ensureHttpUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

/**
 * Ссылка Google Maps: приоритет сохранённому URI, иначе поиск по Place ID.
 * (Та же логика, что в админке `googleMapsHref`.)
 */
export function resolveGoogleMapsHref(
  googleMapsUri: string | null | undefined,
  googlePlaceId: string | null | undefined,
): string | null {
  const u = googleMapsUri?.trim();
  if (u) return u;
  const pid = googlePlaceId?.trim();
  if (pid) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(pid)}`;
  }
  return null;
}
