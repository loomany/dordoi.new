import "server-only";

import { unstable_cache } from "next/cache";

import { routing } from "@/i18n/routing";
import { getIndexableSeoCategoriesForSitemap } from "@/lib/catalog/seo-category-sitemap";
import { CATALOG_VENDORS_LIST_CACHE_TAG } from "@/lib/catalog/published-vendors";
import {
  hreflangAlternatesForPath,
  hreflangAlternatesFromLocalePaths,
} from "@/lib/hreflang";
import { seoCategoryPathsByLocale } from "@/lib/catalog/seo-category-routes";
import { CORE_SEO_LANDINGS } from "@/lib/seo/core-seo-landings";
import { publicRoutes } from "@/lib/seo";
import { baseUrl, siteIndexable } from "@/lib/site";
import { SITEMAP_XML_CACHE_REVALIDATE_SECONDS } from "@/lib/sitemap/constants";
import { appendUrlBlock, emptyUrlsetXml, wrapUrlsetXml } from "@/lib/sitemap/xml";

async function buildCoreSitemapXmlRaw(): Promise<string> {
  if (!siteIndexable()) {
    return emptyUrlsetXml();
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

  return wrapUrlsetXml(urlBlocks);
}

/** Static routes, core landings, and indexable SEO categories (all locales). */
export async function buildCoreSitemapXml(): Promise<string> {
  const root = baseUrl();
  return unstable_cache(
    buildCoreSitemapXmlRaw,
    ["sitemap-core-xml-v3", root],
    {
      revalidate: SITEMAP_XML_CACHE_REVALIDATE_SECONDS,
      tags: [CATALOG_VENDORS_LIST_CACHE_TAG],
    },
  )();
}
