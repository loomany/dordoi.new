import "server-only";

import { unstable_cache } from "next/cache";

import { routing } from "@/i18n/routing";
import {
  fetchIndexableVendorSlugsForSitemap,
  getVendorSitemapChunkCount,
  sliceVendorSitemapChunk,
} from "@/lib/catalog/vendor-sitemap";
import { CATALOG_VENDORS_LIST_CACHE_TAG } from "@/lib/catalog/published-vendors";
import { hreflangAlternatesForPath } from "@/lib/hreflang";
import { baseUrl, siteIndexable } from "@/lib/site";
import { SITEMAP_XML_CACHE_REVALIDATE_SECONDS } from "@/lib/sitemap/constants";
import { appendUrlBlock, emptyUrlsetXml, wrapUrlsetXml } from "@/lib/sitemap/xml";

async function buildVendorChunkSitemapXmlRaw(chunkIndex: number): Promise<string> {
  if (!siteIndexable()) {
    return emptyUrlsetXml();
  }

  const chunkCount = await getVendorSitemapChunkCount();
  if (chunkIndex < 1 || chunkIndex > chunkCount) {
    return emptyUrlsetXml();
  }

  const slugs = await fetchIndexableVendorSlugsForSitemap();
  const chunkSlugs = sliceVendorSitemapChunk(slugs, chunkIndex);
  if (chunkSlugs.length === 0) {
    return emptyUrlsetXml();
  }

  const root = baseUrl();
  const urlBlocks: string[] = [];

  for (const seoSlug of chunkSlugs) {
    const path = `/suppliers/${seoSlug}`;
    const languages = hreflangAlternatesForPath(path);
    for (const locale of routing.locales) {
      const loc = `${root}/${locale}${path}`;
      appendUrlBlock(urlBlocks, loc, languages, "0.65");
    }
  }

  return wrapUrlsetXml(urlBlocks);
}

/** Vendor profile URLs for one chunk (×5 locales, full hreflang alternates). */
export function buildVendorChunkSitemapXml(chunkIndex: number): Promise<string> {
  return unstable_cache(
    () => buildVendorChunkSitemapXmlRaw(chunkIndex),
    ["sitemap-vendor-chunk-xml", String(chunkIndex)],
    {
      revalidate: SITEMAP_XML_CACHE_REVALIDATE_SECONDS,
      tags: [CATALOG_VENDORS_LIST_CACHE_TAG],
    },
  )();
}
