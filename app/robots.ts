import type { MetadataRoute } from "next";
import { baseUrl, siteIndexable } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexable()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl().replace(/^https?:\/\//, ""),
  };
}
