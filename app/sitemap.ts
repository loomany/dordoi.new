import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { baseUrl, siteIndexable } from "@/lib/site";
import { publicRoutes } from "@/lib/seo";

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
      const languages: Record<string, string> = {};
      for (const l of routing.locales) {
        languages[l] = `${root}/${l}${path}`;
      }
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
