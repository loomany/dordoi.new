/** IPv4 mask: 103.180.55.20 -> 103.180.xxx.xxx. IPv6: first segments + masked rest. */
export function maskIp(raw: string | null | undefined): string {
  if (!raw?.trim()) return "unknown";
  const ip = raw.trim();
  if (ip === "unknown") return "unknown";

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
  }

  if (ip.includes(":")) {
    const segs = ip.split(":").filter(Boolean);
    if (segs.length >= 2) {
      return `${segs[0]}:${segs[1]}:xxxx:xxxx`;
    }
  }

  return "unknown";
}

/**
 * Prefer Cloudflare, then reverse proxy single IP, then first XFF hop.
 * Does not trust client-supplied IP in JSON body.
 */
export function getClientIpFromHeaders(h: Headers): string | null {
  const cf = h.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xr = h.get("x-real-ip")?.trim();
  if (xr) return xr;
  const xff = h.get("x-forwarded-for")?.trim();
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

export function getCfCountry(h: Headers): string {
  return h.get("cf-ipcountry")?.trim() || "unknown";
}
