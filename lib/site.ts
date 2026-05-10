export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}

/** When false (default), pages emit noindex and robots.txt disallows crawlers. Set NEXT_PUBLIC_SITE_INDEXABLE=true to open for search engines. */
export function siteIndexable(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";
}
