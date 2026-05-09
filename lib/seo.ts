import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { baseUrl } from "@/lib/site";

/** hreflang / alternate URLs for every locale, same path under each locale prefix */
export function localeAlternates(pathWithoutLocale: string): Record<string, string> {
  const path =
    pathWithoutLocale === "/" || pathWithoutLocale === ""
      ? ""
      : pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl()}/${locale}${path}`;
  }
  return languages;
}

export function buildPageMetadata(opts: {
  locale: string;
  pathWithoutLocale: string;
  title: string;
  description: string;
}): Metadata {
  const path =
    opts.pathWithoutLocale === "/" || opts.pathWithoutLocale === ""
      ? ""
      : opts.pathWithoutLocale.startsWith("/")
        ? opts.pathWithoutLocale
        : `/${opts.pathWithoutLocale}`;
  const selfUrl = `${baseUrl()}/${opts.locale}${path}`;
  const languages = localeAlternates(opts.pathWithoutLocale === "" ? "/" : opts.pathWithoutLocale);

  return {
    metadataBase: new URL(baseUrl()),
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: selfUrl,
      languages,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: selfUrl,
      siteName: "Dordoi.help",
      type: "website",
      locale: opts.locale,
      alternateLocale: routing.locales.filter((l) => l !== opts.locale),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}

export const publicRoutes = [
  "/",
  "/catalog",
  "/suppliers",
  "/buyers",
  "/buyer-service",
  "/about",
  "/help",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/refund",
] as const;
