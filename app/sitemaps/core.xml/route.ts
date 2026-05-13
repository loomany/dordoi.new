import { buildCoreSitemapXml } from "@/lib/sitemap/build-core-sitemap-xml";
import { sitemapXmlResponse } from "@/lib/sitemap/sitemap-response";

/** Core child sitemap: static routes, landings, indexable categories. */
export const dynamic = "force-dynamic";

export async function GET() {
  const body = await buildCoreSitemapXml();
  return sitemapXmlResponse(body);
}
