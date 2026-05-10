/**
 * Public site URL for canonical / OG / sitemap. Must be the **edge** URL (no container port).
 * Railway sets PORT (e.g. 8080) only for the Node listener — do not append it to NEXT_PUBLIC_APP_URL.
 */
function normalizePublicSiteUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const host = u.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "[::1]";

    if (u.protocol === "https:" && (u.port === "443" || u.port === "")) {
      return `${u.protocol}//${host}`;
    }
    if (u.protocol === "http:" && (u.port === "80" || u.port === "")) {
      return `${u.protocol}//${host}`;
    }

    // Misconfiguration: public URL must not repeat Railpack/Railway internal listen port
    if (!isLocal && u.protocol === "https:" && u.port === "8080") {
      return `${u.protocol}//${host}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export function baseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() ||
    "http://localhost:3000";
  return normalizePublicSiteUrl(raw);
}

/**
 * When false (default), pages emit noindex and robots.txt disallows crawlers.
 * Set `NEXT_PUBLIC_SITE_INDEXABLE=true` for production.
 * `app/robots.ts` and `app/sitemap.xml/route.ts` use `dynamic = "force-dynamic"` so this flag is read at request time there.
 * Canonical/OG URLs from `baseUrl()` still use `NEXT_PUBLIC_APP_URL` — set it before `next build` on CI so prerendered metadata matches the public host.
 */
export function siteIndexable(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";
}
