import "server-only";

import { unstable_cache } from "next/cache";

import {
  CATALOG_VENDORS_LIST_CACHE_TAG,
  isBlockedPublicCatalogStoreName,
  isHiddenFromPublicCatalogSlug,
} from "@/lib/catalog/published-vendors";
import { createAdminClient } from "@/lib/supabase/admin";
import { VENDOR_SITEMAP_CHUNK_SIZE } from "@/lib/sitemap/constants";

const VENDOR_SITEMAP_SLUGS_CACHE_REVALIDATE_SECONDS = 120;

async function fetchIndexableVendorSeoSlugsForSitemapRaw(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select("slug, seo_slug, store_name")
    .eq("status", "approved")
    .not("seo_slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchIndexableVendorSeoSlugsForSitemap]", error);
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const catalogSlug = typeof r.slug === "string" ? r.slug.trim() : "";
    const seoSlug = typeof r.seo_slug === "string" ? r.seo_slug.trim() : "";
    if (!seoSlug || seen.has(seoSlug)) continue;
    if (catalogSlug && isHiddenFromPublicCatalogSlug(catalogSlug)) continue;
    if (isBlockedPublicCatalogStoreName(r.store_name as string | null | undefined)) {
      continue;
    }
    seen.add(seoSlug);
    slugs.push(seoSlug);
  }
  return slugs;
}

/** Approved vendor `seo_slug` values for sitemap (`/suppliers/{seo_slug}`). */
export async function fetchIndexableVendorSlugsForSitemap(): Promise<string[]> {
  return unstable_cache(
    fetchIndexableVendorSeoSlugsForSitemapRaw,
    ["indexable-vendor-seo-slugs-sitemap-v2"],
    {
      revalidate: VENDOR_SITEMAP_SLUGS_CACHE_REVALIDATE_SECONDS,
      tags: [CATALOG_VENDORS_LIST_CACHE_TAG],
    },
  )();
}

/** 1-based chunk count for vendor child sitemaps. */
export async function getVendorSitemapChunkCount(): Promise<number> {
  const slugs = await fetchIndexableVendorSlugsForSitemap();
  if (slugs.length === 0) return 0;
  return Math.ceil(slugs.length / VENDOR_SITEMAP_CHUNK_SIZE);
}

/** Slice indexable seo slugs for a 1-based chunk index. */
export function sliceVendorSitemapChunk(slugs: string[], chunkIndex: number): string[] {
  if (chunkIndex < 1) return [];
  const start = (chunkIndex - 1) * VENDOR_SITEMAP_CHUNK_SIZE;
  return slugs.slice(start, start + VENDOR_SITEMAP_CHUNK_SIZE);
}
