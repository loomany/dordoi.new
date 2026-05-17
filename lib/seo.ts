import type { Metadata } from "next";
import {
  hreflangAlternatesForPath,
  hreflangAlternatesFromLocalePaths,
  ogAlternateLocalesForRouteLocale,
  ogLocaleFromRouteLocale,
} from "@/lib/hreflang";
import { baseUrl, siteIndexable } from "@/lib/site";

function noindexMetadata(): Pick<Metadata, "robots"> {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

function indexFollowMetadata(): Pick<Metadata, "robots"> {
  return {
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export function defaultOgImages(): {
  openGraphImages: NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;
  twitterImages: NonNullable<NonNullable<Metadata["twitter"]>["images"]>;
} {
  const root = baseUrl();
  const ogImageUrl = new URL("/opengraph-image", root).toString();
  const image = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    alt: "Dordoi.help",
  };
  return {
    openGraphImages: [image],
    twitterImages: [ogImageUrl],
  };
}

function noindexFollowMetadata(): Pick<Metadata, "robots"> {
  return {
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

function robotsMetadataFromPolicy(
  policy: "index,follow" | "noindex,follow" | "noindex,nofollow" | undefined,
  privateArea: boolean,
): Pick<Metadata, "robots"> {
  if (policy === "noindex,follow") return noindexFollowMetadata();
  if (policy === "noindex,nofollow") return noindexMetadata();
  if (policy === "index,follow") return indexFollowMetadata();
  if (!siteIndexable() || privateArea) return noindexMetadata();
  return indexFollowMetadata();
}

export function buildPageMetadata(opts: {
  locale: string;
  pathWithoutLocale: string;
  title: string;
  description: string;
  /** Cabinet and other non-public UI — never index even when the site is indexable. */
  privateArea?: boolean;
  /** Override default robots for vendor profiles etc. */
  robotsPolicy?: "index,follow" | "noindex,follow" | "noindex,nofollow";
  /** Canonical path (defaults to pathWithoutLocale). Use for catalog → suppliers canonical. */
  canonicalPathWithoutLocale?: string;
  alternatePathsByLocale?: Record<string, string>;
}): Metadata {
  const path =
    opts.pathWithoutLocale === "/" || opts.pathWithoutLocale === ""
      ? ""
      : opts.pathWithoutLocale.startsWith("/")
        ? opts.pathWithoutLocale
        : `/${opts.pathWithoutLocale}`;
  const canonicalPath =
    opts.canonicalPathWithoutLocale != null
      ? opts.canonicalPathWithoutLocale.startsWith("/")
        ? opts.canonicalPathWithoutLocale
        : `/${opts.canonicalPathWithoutLocale}`
      : path;
  const selfUrl = `${baseUrl()}/${opts.locale}${path}`;
  const canonicalUrl = `${baseUrl()}/${opts.locale}${canonicalPath}`;
  const languages = opts.alternatePathsByLocale
    ? hreflangAlternatesFromLocalePaths(opts.alternatePathsByLocale)
    : hreflangAlternatesForPath(canonicalPath === "" ? "/" : canonicalPath);
  const ogLocale = ogLocaleFromRouteLocale(opts.locale);
  const { openGraphImages, twitterImages } = defaultOgImages();

  return {
    ...robotsMetadataFromPolicy(opts.robotsPolicy, Boolean(opts.privateArea)),
    metadataBase: new URL(baseUrl()),
    title: opts.title,
    description: opts.description,
    alternates: opts.privateArea
      ? { canonical: canonicalUrl }
      : {
          canonical: canonicalUrl,
          languages,
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: selfUrl,
      siteName: "Dordoi Help",
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternateLocalesForRouteLocale(opts.locale),
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: twitterImages,
    },
  };
}

export const publicRoutes = [
  "/",
  "/catalog",
  "/sell",
  "/suppliers",
  "/buyers",
  "/buyer-service",
  "/about",
  "/how-it-works",
  "/for-buyers",
  "/for-sellers",
  "/help",
  "/faq",
  "/dordoi-kazakhstan",
  "/dordoi-uzbekistan",
  "/dordoi-tajikistan",
  "/dordoi-russia",
  "/dordoi-kyrgyzstan",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
  "/refund",
] as const;
