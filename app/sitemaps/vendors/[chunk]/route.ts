import { notFound } from "next/navigation";

import { getVendorSitemapChunkCount } from "@/lib/catalog/vendor-sitemap";
import { buildVendorChunkSitemapXml } from "@/lib/sitemap/build-vendor-chunk-sitemap-xml";
import { sitemapXmlResponse } from "@/lib/sitemap/sitemap-response";

type RouteContext = {
  params: Promise<{ chunk: string }>;
};

function parseVendorChunkIndex(raw: string): number | null {
  const trimmed = raw.trim();
  const match = /^vendors-(\d+)\.xml$/i.exec(trimmed) ?? /^(\d+)\.xml$/i.exec(trimmed);
  if (!match) return null;
  const n = Number.parseInt(match[1]!, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Vendor chunk child sitemap (`/sitemaps/vendors/vendors-{n}.xml`). */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { chunk } = await context.params;
  const chunkIndex = parseVendorChunkIndex(chunk);
  if (chunkIndex == null) {
    notFound();
  }

  const chunkCount = await getVendorSitemapChunkCount();
  if (chunkIndex > chunkCount) {
    notFound();
  }

  const body = await buildVendorChunkSitemapXml(chunkIndex);
  return sitemapXmlResponse(body);
}
