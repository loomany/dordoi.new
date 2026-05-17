import type { MetadataRoute } from "next";
import { baseUrl, siteIndexable } from "@/lib/site";

/** Read `NEXT_PUBLIC_SITE_INDEXABLE` at request time (not baked at build). */
export const dynamic = "force-dynamic";

const DISALLOW_WHEN_INDEXABLE = [
  "/api/",
  "/admin/",
  "/account/",
  "/auth/",
  "/checkout/",
  "/payment/",
  "/signin",
  "/legacy/",
  "/test/",
  "/preview/",
  "/*/cabinet/",
  "/*/payment/",
  "/*?cat=*",
  "/*?page=*",
  "/*?search=*",
  "/*?sort=*",
  "/*?filter=*",
  "/*?compare=*",
  "/*?utm_*",
  "/*?gclid=*",
  "/*?yclid=*",
  "/*?fbclid=*",
] as const;

const PUBLIC_CRAWLER_USER_AGENTS = [
  "*",
  "Googlebot",
  "YandexBot",
  "Bingbot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Applebot",
  "Google-Extended",
  "CCBot",
] as const;

export default function robots(): MetadataRoute.Robots {
  if (!siteIndexable()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: PUBLIC_CRAWLER_USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: [...DISALLOW_WHEN_INDEXABLE],
    })),
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl().replace(/^https?:\/\//, ""),
  };
}
