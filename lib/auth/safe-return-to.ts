const BLOCKED_PREFIXES = ["/api", "/_next"] as const;

const UNSAFE_PATTERN =
  /^(?:https?:|\/\/|javascript:|data:)/i;

/**
 * Returns a safe same-site path (pathname + search + hash) or null.
 */
export function sanitizeInternalPath(
  raw: string | null | undefined,
): string | null {
  if (raw == null) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed === "" || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (UNSAFE_PATTERN.test(trimmed) || trimmed.includes("\\") || trimmed.includes("@")) {
    return null;
  }

  let pathname: string;
  let search = "";
  let hash = "";

  try {
    const url = new URL(trimmed, "http://internal.local");
    pathname = url.pathname;
    search = url.search;
    hash = url.hash;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/")) {
    return null;
  }

  for (const prefix of BLOCKED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return null;
    }
  }

  return `${pathname}${search}${hash}`;
}

export type ResolveSafeReturnToArgs = {
  rawReturnTo: string | null | undefined;
  locale: string;
  currentPathWithSearch: string;
};

/**
 * Picks a safe internal return path after auth.
 * Prefers explicit returnTo, then current page, then catalog fallback.
 */
export function resolveSafeReturnTo({
  rawReturnTo,
  locale,
  currentPathWithSearch,
}: ResolveSafeReturnToArgs): string {
  const fromRaw = sanitizeInternalPath(rawReturnTo);
  if (fromRaw) {
    return fromRaw;
  }

  const fromCurrent = sanitizeInternalPath(currentPathWithSearch);
  if (fromCurrent) {
    return fromCurrent;
  }

  const loc = locale.trim() || "ru";
  return `/${loc}/catalog`;
}
