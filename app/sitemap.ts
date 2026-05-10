import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { hreflangAlternatesForPath } from "@/lib/hreflang";
import { baseUrl, siteIndexable } from "@/lib/site";
import { publicRoutes } from "@/lib/seo";

/** Read `NEXT_PUBLIC_SITE_INDEXABLE` at request time (not baked at build). */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIndexable()) {
    return [];
  }
  const root = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of publicRoutes) {
      const path = route === "/" ? "" : route;
      const url = `${root}/${locale}${path}`;
      const pathForAlternates = route === "/" ? "/" : route;
      const languages = hreflangAlternatesForPath(pathForAlternates);
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "/" ? 1 : 0.7,
        alternates: { languages },
      });
    }
  }

  return entries;
}
