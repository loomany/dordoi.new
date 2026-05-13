import "server-only";

import { unstable_cache } from "next/cache";

import {
  CATALOG_VENDORS_LIST_CACHE_TAG,
  isBlockedPublicCatalogStoreName,
  isHiddenFromPublicCatalogSlug,
} from "@/lib/catalog/published-vendors";
import { isSafeVendorPublicSlug } from "@/lib/catalog/vendor-public-seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { VENDOR_SITEMAP_CHUNK_SIZE } from "@/lib/sitemap/constants";

const VENDOR_SITEMAP_SLUGS_CACHE_REVALIDATE_SECONDS = 120;

async function fetchIndexableVendorSlugsForSitemapRaw(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select("slug, store_name")
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchIndexableVendorSlugsForSitemap]", error);
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const slug = typeof r.slug === "string" ? r.slug.trim() : "";
    if (!slug || seen.has(slug)) continue;
    if (isHiddenFromPublicCatalogSlug(slug)) continue;
    if (isBlockedPublicCatalogStoreName(r.store_name as string | null | undefined)) {
      continue;
    }
    if (!isSafeVendorPublicSlug(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}

/** Approved vendor slugs eligible for sitemap (safe public slug policy). */
export async function fetchIndexableVendorSlugsForSitemap(): Promise<string[]> {
  return unstable_cache(
    fetchIndexableVendorSlugsForSitemapRaw,
    ["indexable-vendor-slugs-sitemap"],
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

/** Slice indexable slugs for a 1-based chunk index. */
export function sliceVendorSitemapChunk(slugs: string[], chunkIndex: number): string[] {
  if (chunkIndex < 1) return [];
  const start = (chunkIndex - 1) * VENDOR_SITEMAP_CHUNK_SIZE;
  return slugs.slice(start, start + VENDOR_SITEMAP_CHUNK_SIZE);
}
