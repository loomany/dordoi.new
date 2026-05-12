/**
 * Разбор description импорта Google Places (JSON после вводного текста).
 * Только для отображения в админке; БД/импорт не меняются.
 */

const HIDDEN_TYPES = new Set(["point_of_interest", "establishment"]);

type RawGoogleImportMeta = {
  catalogMainId?: string | null;
  catalogMainLabel?: string | null;
  guessedCategory?: string | null;
  primaryType?: string | null;
  types?: unknown;
  sourceModes?: unknown;
  distanceFromDordoiMeters?: unknown;
  location?: {
    latitude?: unknown;
    longitude?: unknown;
  } | null;
};

export type GooglePlacesAdminParsedMeta = {
  categoryDisplay: string | null;
  primaryType: string | null;
  typesCompact: string | null;
  foundViaKind: "nearby" | "text" | "both" | null;
  distanceMetersRounded: number | null;
  coordsFormatted: string | null;
};

export type GooglePlacesAdminDescriptionParse = {
  /** Текст до первого JSON-блока (как в импорте). */
  introBeforeJson: string;
  /** null если JSON не найден или parse error. */
  meta: GooglePlacesAdminParsedMeta | null;
};

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function compactTypes(types: unknown): string | null {
  if (!Array.isArray(types)) return null;
  const filtered = types.filter(
    (t): t is string =>
      typeof t === "string" && t.trim().length > 0 && !HIDDEN_TYPES.has(t.trim()),
  );
  if (filtered.length === 0) return null;
  return filtered.join(", ");
}

function foundViaKind(modes: unknown): "nearby" | "text" | "both" | null {
  if (!Array.isArray(modes)) return null;
  const list = modes.filter((m): m is string => typeof m === "string");
  const hasNearby = list.some(
    (m) => m === "discovery-nearby" || m.includes("nearby"),
  );
  const hasText = list.some(
    (m) =>
      m === "discovery-text" ||
      (m.includes("discovery") && m.includes("text")),
  );
  if (hasNearby && hasText) return "both";
  if (hasNearby) return "nearby";
  if (hasText) return "text";
  return null;
}

function roundCoord(n: number): string {
  const rounded = Math.round(n * 1e6) / 1e6;
  return String(rounded);
}

function formatCoords(loc: RawGoogleImportMeta["location"]): string | null {
  if (!loc || typeof loc !== "object") return null;
  const lat = loc.latitude;
  const lng = loc.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${roundCoord(lat)}, ${roundCoord(lng)}`;
}

function buildParsed(raw: RawGoogleImportMeta): GooglePlacesAdminParsedMeta {
  const categoryDisplay =
    str(raw.catalogMainLabel) ??
    str(raw.catalogMainId) ??
    str(raw.guessedCategory);
  const primaryType = str(raw.primaryType);
  const typesCompact = compactTypes(raw.types);
  const foundViaKindResolved = foundViaKind(raw.sourceModes);
  let distanceMetersRounded: number | null = null;
  const d = raw.distanceFromDordoiMeters;
  if (typeof d === "number" && Number.isFinite(d)) {
    distanceMetersRounded = Math.round(d);
  }
  const coordsFormatted = formatCoords(raw.location ?? null);
  return {
    categoryDisplay,
    primaryType,
    typesCompact,
    foundViaKind: foundViaKindResolved,
    distanceMetersRounded,
    coordsFormatted,
  };
}

/**
 * Выделяет вводный текст и JSON-meta из поля description (формат импорта).
 */
export function parseGooglePlacesDescriptionForAdmin(
  description: string | null | undefined,
): GooglePlacesAdminDescriptionParse {
  const text = description?.trim() ?? "";
  if (!text) {
    return { introBeforeJson: "", meta: null };
  }
  const marker = "\n\n{";
  const i = text.indexOf(marker);
  if (i === -1) {
    return { introBeforeJson: text, meta: null };
  }
  const introBeforeJson = text.slice(0, i).trim();
  const jsonStr = text.slice(i + 2).trim();
  try {
    const raw = JSON.parse(jsonStr) as RawGoogleImportMeta;
    const meta = buildParsed(raw);
    return { introBeforeJson, meta };
  } catch {
    return { introBeforeJson, meta: null };
  }
}

/** Две строки вводного текста: первая заканчивается первой точкой с пробелом. */
export function formatGooglePlacesIntroTwoLines(intro: string): string {
  const oneLine = intro.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  const idx = oneLine.indexOf(". ");
  if (idx === -1) return oneLine;
  return `${oneLine.slice(0, idx + 1).trim()}\n${oneLine.slice(idx + 2).trim()}`;
}
