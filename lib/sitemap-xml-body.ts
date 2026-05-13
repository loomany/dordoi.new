import { routing } from "@/i18n/routing";
import {
  hreflangAlternatesForPath,
  hreflangAlternatesFromLocalePaths,
} from "@/lib/hreflang";
import { getIndexableSeoCategoriesForSitemap } from "@/lib/catalog/seo-category-sitemap";
import { fetchIndexableVendorSlugsForSitemap } from "@/lib/catalog/vendor-sitemap";
import { seoCategoryPathsByLocale } from "@/lib/catalog/seo-category-routes";
import { CORE_SEO_LANDINGS } from "@/lib/seo/core-seo-landings";
import { baseUrl, siteIndexable } from "@/lib/site";
import { publicRoutes } from "@/lib/seo";

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function appendUrlBlock(
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

/** Valid sitemap 0.9 document; empty urlset when site is not indexable. */
export async function buildSitemapXmlBody(): Promise<string> {
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
      const priority = route === "/" ? "1.0" : "0.7";
      appendUrlBlock(urlBlocks, loc, languages, priority);
    }
  }

  for (const locale of routing.locales) {
    for (const landing of CORE_SEO_LANDINGS) {
      const loc = `${root}/${locale}${landing.path}`;
      const languages = hreflangAlternatesForPath(landing.path);
      appendUrlBlock(urlBlocks, loc, languages, "0.8");
    }
  }

  const indexableCategories = await getIndexableSeoCategoriesForSitemap();
  for (const locale of routing.locales) {
    for (const category of indexableCategories) {
      const pathsByLocale = seoCategoryPathsByLocale(category);
      const path = pathsByLocale[locale as keyof typeof pathsByLocale];
      const loc = `${root}/${locale}${path}`;
      const languages = hreflangAlternatesFromLocalePaths(pathsByLocale);
      appendUrlBlock(urlBlocks, loc, languages, "0.75");
    }
  }

  const vendorSlugs = await fetchIndexableVendorSlugsForSitemap();
  for (const slug of vendorSlugs) {
    const path = `/catalog/${slug}`;
    const languages = hreflangAlternatesForPath(path);
    for (const locale of routing.locales) {
      const loc = `${root}/${locale}${path}`;
      appendUrlBlock(urlBlocks, loc, languages, "0.65");
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join("\n")}
</urlset>`;
}
