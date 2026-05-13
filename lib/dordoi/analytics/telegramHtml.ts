/**
 * Escape for Telegram HTML parse_mode.
 * Per product spec: &, <, >, ", '
 */
export function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

/** Mask email for admin Telegram (plain text; escape when embedding in HTML). */
export function maskEmailForAdminTelegram(raw: string | null | undefined): string {
  const e = raw?.trim() ?? "";
  if (!e) return "—";
  const at = e.lastIndexOf("@");
  if (at <= 0 || at >= e.length - 1) {
    return e.length <= 2 ? "***" : `${e.slice(0, 1)}***`;
  }
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const head = local.length > 0 ? local.slice(0, 1) : "?";
  return `${head}***@${domain}`;
}

/** Mask stored phone digits (no «+») for admin Telegram; returns e.g. «+7 705 *** ** 64». */
export function maskPhoneDigitsForAdminTelegram(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 8) return "—";
  let cc = "";
  let rest = "";
  if (
    (d.startsWith("996") || d.startsWith("998") || d.startsWith("992")) &&
    d.length >= 12
  ) {
    cc = d.slice(0, 3);
    rest = d.slice(3);
  } else if (d.startsWith("7") && d.length === 11) {
    cc = "7";
    rest = d.slice(1);
  } else {
    return `+${d.slice(0, 2)} ***… ${d.slice(-2)}`;
  }
  if (rest.length < 5) return `+${cc} ***`;
  const head = rest.slice(0, 3);
  const tail = rest.slice(-2);
  return `+${cc} ${head} *** ** ${tail}`;
}
