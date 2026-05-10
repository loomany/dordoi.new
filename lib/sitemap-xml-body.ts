import { routing } from "@/i18n/routing";
import { hreflangAlternatesForPath } from "@/lib/hreflang";
import { baseUrl, siteIndexable } from "@/lib/site";
import { publicRoutes } from "@/lib/seo";

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Valid sitemap 0.9 document; empty urlset when site is not indexable. */
export function buildSitemapXmlBody(): string {
  if (!siteIndexable()) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
  }

  const root = baseUrl();
  const urlBlocks: string[] = [];

  for (const locale of routing.locales) {
    for (const route of publicRoutes) {
      const path = route === "/" ? "" : route;
      const loc = `${root}/${locale}${path}`;
      const pathForAlternates = route === "/" ? "/" : route;
      const languages = hreflangAlternatesForPath(pathForAlternates);
      const lastmod = new Date().toISOString();
      const priority = route === "/" ? "1.0" : "0.7";

      const alternateLines = Object.entries(languages)
        .map(
          ([lang, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXmlAttr(lang)}" href="${escapeXmlAttr(href)}" />`,
        )
        .join("\n");

      urlBlocks.push(`  <url>
    <loc>${escapeXmlAttr(loc)}</loc>
${alternateLines}
    <lastmod>${escapeXmlAttr(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;
}
