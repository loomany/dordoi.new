import { buildSitemapXmlBody } from "@/lib/sitemap-xml-body";

/** Read indexability at request time (same intent as previous `app/sitemap.ts`). */
export const dynamic = "force-dynamic";

export async function GET() {
  const body = buildSitemapXmlBody();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
