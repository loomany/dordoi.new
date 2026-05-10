/** Format listing timestamps for catalog cards and provider profiles (Intl, locale-aware). */

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

export function formatProviderAddedDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, SHORT_DATE).format(new Date(iso));
}

/** Relative for recent updates; absolute short date if older than `relativeDaysCutoff` days. */
export function formatProviderUpdatedDisplay(
  iso: string,
  locale: string,
  options?: { now?: Date; relativeDaysCutoff?: number },
): string {
  const now = options?.now ?? new Date();
  const cutoffDays = options?.relativeDaysCutoff ?? 7;
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return formatProviderAddedDate(iso, locale);
  }
  const diffDays = diffMs / 86_400_000;
  if (diffDays >= cutoffDays) {
    return formatProviderAddedDate(iso, locale);
  }
  return formatRelativePast(then, now, locale);
}

/** “Today” in the UI sense — matches `{relative}` in `listingUpdated` copy. */
export function formatListingUpdatedToday(locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(0, "day");
}

function formatRelativePast(then: Date, now: Date, locale: string): string {
  const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  let seconds = diffSec;
  if (seconds < 60) {
    return rtf.format(-seconds, "second");
  }

  let minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return rtf.format(-minutes, "minute");
  }

  let hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return rtf.format(-hours, "hour");
  }

  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}
