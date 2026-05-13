import type { Metadata } from "next";

import type { SeoCategoryRoute } from "@/lib/catalog/seo-category-route-data";
import {
  hreflangAlternatesFromLocalePaths,
  ogAlternateLocalesForRouteLocale,
  ogLocaleFromRouteLocale,
} from "@/lib/hreflang";
import { seoCategoryPathsByLocale } from "@/lib/catalog/seo-category-routes";
import { baseUrl, siteIndexable } from "@/lib/site";
import type { RouteLocale } from "@/lib/seo/route-locale";

function categoryRobots(route: SeoCategoryRoute): Metadata["robots"] {
  if (!siteIndexable()) {
    return { index: false, follow: false, googleBot: { index: false, follow: false } };
  }
  if (route.indexPolicy === "index") {
    return { index: true, follow: true, googleBot: { index: true, follow: true } };
  }
  return { index: false, follow: true, googleBot: { index: false, follow: true } };
}

export function buildSeoCategoryMetadata(
  locale: RouteLocale,
  route: SeoCategoryRoute,
): Metadata {
  const pathsByLocale = seoCategoryPathsByLocale(route);
  const path = pathsByLocale[locale];
  const selfUrl = `${baseUrl()}/${locale}${path}`;
  const languages = hreflangAlternatesFromLocalePaths(pathsByLocale);
  const title = route.titleByLocale[locale];
  const description = route.descriptionByLocale[locale];

  return {
    robots: categoryRobots(route),
    metadataBase: new URL(baseUrl()),
    title,
    description,
    alternates: {
      canonical: selfUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: selfUrl,
      siteName: "Dordoi Help",
      type: "website",
      locale: ogLocaleFromRouteLocale(locale),
      alternateLocale: ogAlternateLocalesForRouteLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
