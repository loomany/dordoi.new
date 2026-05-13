export function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function appendUrlBlock(
  urlBlocks: string[],
  loc: string,
  languages: Record<string, string>,
  priority: string,
): void {
  const lastmod = new Date().toISOString();
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

export function wrapUrlsetXml(urlBlocks: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;
}

export function emptyUrlsetXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
}
