import type { Metadata } from "next";

import { buildSeoMetadata } from "@/lib/build-seo";
import { baseUrl, siteIndexable } from "@/lib/site";

export type CatalogSearchParamsForSeo = {
  page?: string;
  compare?: string;
  cat?: string | string[];
  search?: string;
  sort?: string;
  filter?: string;
  gclid?: string;
  yclid?: string;
  fbclid?: string;
  [key: string]: string | string[] | undefined;
};

export function catalogHasSeoQueryParams(sp: CatalogSearchParamsForSeo): boolean {
  for (const key of Object.keys(sp)) {
    if (key.startsWith("utm_")) return true;
  }
  if (sp.compare === "1") return true;
  if (sp.page && sp.page !== "1") return true;
  if (typeof sp.search === "string" && sp.search.trim().length > 0) return true;
  if (typeof sp.sort === "string" && sp.sort.trim().length > 0) return true;
  if (typeof sp.filter === "string" && sp.filter.trim().length > 0) return true;
  if (typeof sp.gclid === "string" && sp.gclid.trim().length > 0) return true;
  if (typeof sp.yclid === "string" && sp.yclid.trim().length > 0) return true;
  if (typeof sp.fbclid === "string" && sp.fbclid.trim().length > 0) return true;
  if (Array.isArray(sp.cat)) return sp.cat.length > 0;
  if (typeof sp.cat === "string" && sp.cat.trim().length > 0) return true;
  return false;
}

export async function buildCatalogPageMetadata(
  locale: string,
  sp: CatalogSearchParamsForSeo,
): Promise<Metadata> {
  const base = await buildSeoMetadata(locale, "/catalog", "Seo.catalog");
  if (!siteIndexable() || !catalogHasSeoQueryParams(sp)) {
    return base;
  }

  const compare = sp.compare === "1";
  const canonical = `${baseUrl()}/${locale}/catalog`;

  return {
    ...base,
    alternates: { canonical },
    robots: compare
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        },
  };
}
