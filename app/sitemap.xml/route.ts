import { buildSitemapIndexXml } from "@/lib/sitemap/build-sitemap-index-xml";
import { sitemapXmlResponse } from "@/lib/sitemap/sitemap-response";

/** Root sitemap index (`/sitemap.xml`). */
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await buildSitemapIndexXml();
  return sitemapXmlResponse(body);
}
