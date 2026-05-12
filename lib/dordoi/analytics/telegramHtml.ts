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
