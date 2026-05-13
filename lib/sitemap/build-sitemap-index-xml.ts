import "server-only";

import { unstable_cache } from "next/cache";

import { getVendorSitemapChunkCount } from "@/lib/catalog/vendor-sitemap";
import { CATALOG_VENDORS_LIST_CACHE_TAG } from "@/lib/catalog/published-vendors";
import { baseUrl, siteIndexable } from "@/lib/site";
import {
  SITEMAP_CORE_PATH,
  SITEMAP_XML_CACHE_REVALIDATE_SECONDS,
  vendorSitemapChildPath,
} from "@/lib/sitemap/constants";
import { escapeXmlAttr } from "@/lib/sitemap/xml";

function emptySitemapIndexXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</sitemapindex>`;
}

async function buildSitemapIndexXmlRaw(): Promise<string> {
  if (!siteIndexable()) {
    return emptySitemapIndexXml();
  }

  const root = baseUrl();
  const lastmod = new Date().toISOString();
  const entries: string[] = [];

  entries.push(`  <sitemap>
    <loc>${escapeXmlAttr(`${root}${SITEMAP_CORE_PATH}`)}</loc>
    <lastmod>${escapeXmlAttr(lastmod)}</lastmod>
  </sitemap>`);

  const chunkCount = await getVendorSitemapChunkCount();
  for (let i = 1; i <= chunkCount; i++) {
    entries.push(`  <sitemap>
    <loc>${escapeXmlAttr(`${root}${vendorSitemapChildPath(i)}`)}</loc>
    <lastmod>${escapeXmlAttr(lastmod)}</lastmod>
  </sitemap>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
}

/** Root sitemap index pointing at core + vendor chunk child sitemaps. */
export async function buildSitemapIndexXml(): Promise<string> {
  return unstable_cache(
    buildSitemapIndexXmlRaw,
    ["sitemap-index-xml"],
    {
      revalidate: SITEMAP_XML_CACHE_REVALIDATE_SECONDS,
      tags: [CATALOG_VENDORS_LIST_CACHE_TAG],
    },
  )();
}
