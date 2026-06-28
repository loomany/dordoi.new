import type { PublishedVendorRow } from "@/lib/catalog/published-vendors";
import { vendorSuppliersSeoPath } from "@/lib/catalog/vendor-public-seo";
import { baseUrl } from "@/lib/site";

type SafeVendorJsonLdCopy = {
  name: string;
  description?: string | null;
  category?: string | null;
  mediaSectionName?: string | null;
  primaryImageUrl?: string | null;
  videoUrls?: readonly string[] | null;
};

function cleanText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function safePublicMediaUrl(value: string | null | undefined): string | undefined {
  const trimmed = cleanText(value);
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    if (
      url.hostname !== "dordoi.help" &&
      url.hostname !== "www.dordoi.help" &&
      url.hostname !== "supabase.dordoi.help"
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function safeProfilePageJsonLd(opts: {
  canonical: string;
  name: string;
  description?: string | null;
  category?: string | null;
  mediaSectionName?: string | null;
  primaryImageUrl?: string | null;
  videoUrls?: readonly string[] | null;
}): Record<string, unknown> {
  const businessId = `${opts.canonical}#business`;
  const description = cleanText(opts.description);
  const category = cleanText(opts.category);
  const primaryImageUrl = safePublicMediaUrl(opts.primaryImageUrl);
  const mediaSectionName = cleanText(opts.mediaSectionName) ?? "Media";
  const videos = (opts.videoUrls ?? [])
    .map(safePublicMediaUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 3)
    .map((contentUrl, index) => ({
      "@type": "VideoObject",
      name: `${opts.name} — ${mediaSectionName} ${index + 1}`,
      description: description ?? opts.name,
      contentUrl,
      ...(primaryImageUrl ? { thumbnailUrl: primaryImageUrl } : {}),
    }));

  const business: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": businessId,
    name: opts.name,
    url: opts.canonical,
  };
  if (description) business.description = description;
  if (category) business.category = category;
  if (primaryImageUrl) {
    business.image = {
      "@type": "ImageObject",
      contentUrl: primaryImageUrl,
      caption: opts.name,
    };
  }
  if (videos.length > 0) business.video = videos;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: opts.name,
    url: opts.canonical,
    isPartOf: {
      "@id": `${baseUrl()}/#website`,
    },
    mainEntity: business,
  };

  if (description) {
    data.description = description;
  }
  if (primaryImageUrl) {
    data.primaryImageOfPage = { "@type": "ImageObject", contentUrl: primaryImageUrl };
  }
  if (videos.length > 0) data.hasPart = videos;

  return data;
}

/**
 * Privacy-safe JSON-LD for public supplier pages.
 *
 * Do not emit LocalBusiness telephone/sameAs/streetAddress for locked public
 * views: JSON-LD is part of page source and is visible before unlock.
 */
export function buildVendorSeoLocalBusinessJsonLd(
  vendor: PublishedVendorRow,
  locale: string,
  copy: SafeVendorJsonLdCopy,
): Record<string, unknown> {
  const seoSlug = vendor.seo_slug?.trim() || vendor.slug;
  const canonical = `${baseUrl()}/${locale}${vendorSuppliersSeoPath(seoSlug)}`;

  return safeProfilePageJsonLd({
    canonical,
    name: copy.name,
    description: copy.description,
    category: copy.category,
    mediaSectionName: copy.mediaSectionName,
    primaryImageUrl: copy.primaryImageUrl,
    videoUrls: copy.videoUrls,
  });
}

/** @deprecated Catalog profiles are noindex; kept privacy-safe for fallback use. */
export function buildVendorLocalBusinessJsonLd(
  vendor: PublishedVendorRow,
  locale: string,
  copy?: SafeVendorJsonLdCopy,
): Record<string, unknown> {
  const canonical = `${baseUrl()}/${locale}/catalog/${vendor.slug}`;

  return safeProfilePageJsonLd({
    canonical,
    name: copy?.name ?? "Dordoi.help supplier profile",
    description: copy?.description,
  });
}
