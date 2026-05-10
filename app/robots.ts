import type { MetadataRoute } from "next";
import { baseUrl, siteIndexable } from "@/lib/site";

/** Read `NEXT_PUBLIC_SITE_INDEXABLE` at request time (not baked at build). */
export const dynamic = "force-dynamic";

const DISALLOW_WHEN_INDEXABLE = [
  "/api/",
  "/admin/",
  "/account/",
  "/signin",
  "/legacy/",
  "/test/",
  "/preview/",
  "/*/cabinet/",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexable()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOW_WHEN_INDEXABLE],
    },
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl().replace(/^https?:\/\//, ""),
  };
}
