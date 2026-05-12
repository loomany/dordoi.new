/** Публичные ссылки на карты для профиля продавца в каталоге. */

const TWO_GIS_PLACE_PREFIX = /^2gis:(\d+)$/i;

/** ID фирмы из поля `google_place_id`, если импорт шёл через 2GIS (`2gis:…`). */
export function parseTwoGisFirmIdFromGooglePlaceId(
  googlePlaceId: string | null | undefined,
): string | null {
  const t = googlePlaceId?.trim();
  if (!t) return null;
  const m = t.match(TWO_GIS_PLACE_PREFIX);
  return m?.[1] ?? null;
}

/**
 * Публичная страница фирмы на 2GIS (по умолчанию Бишкек — как в выгрузке парсера).
 */
export function twoGisFirmPageUrlFromGooglePlaceId(
  googlePlaceId: string | null | undefined,
  citySlug: string = "bishkek",
): string | null {
  const id = parseTwoGisFirmIdFromGooglePlaceId(googlePlaceId);
  if (!id) return null;
  return `https://2gis.kg/${citySlug}/firm/${id}`;
}

export function ensureHttpUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

/**
 * Ссылка Google Maps: приоритет сохранённому URI, иначе поиск по Place ID.
 * Для импорта 2GIS в `google_place_id` лежит `2gis:…` — это не Google Place ID, ссылку не строим.
 */
export function resolveGoogleMapsHref(
  googleMapsUri: string | null | undefined,
  googlePlaceId: string | null | undefined,
): string | null {
  const u = googleMapsUri?.trim();
  if (u) return u;
  const pid = googlePlaceId?.trim();
  if (!pid) return null;
  if (parseTwoGisFirmIdFromGooglePlaceId(pid)) return null;
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(pid)}`;
}
