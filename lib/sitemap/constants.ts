/** Indexable vendor slugs per child sitemap file (before ×5 locale URLs). */
export const VENDOR_SITEMAP_CHUNK_SIZE = 500;

/** Shared revalidate for sitemap XML builders (seconds). */
export const SITEMAP_XML_CACHE_REVALIDATE_SECONDS = 120;

export const SITEMAP_CORE_PATH = "/sitemaps/core.xml";

export function vendorSitemapChildPath(chunkIndex: number): string {
  return `/sitemaps/vendors/vendors-${chunkIndex}.xml`;
}
