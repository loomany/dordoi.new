import type { PublishedVendorRow } from "@/lib/catalog/published-vendors";
import { vendorSuppliersSeoPath } from "@/lib/catalog/vendor-public-seo";
import { baseUrl } from "@/lib/site";

type SafeVendorJsonLdCopy = {
  name: string;
  description?: string | null;
};

function cleanText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function safeProfilePageJsonLd(opts: {
  canonical: string;
  name: string;
  description?: string | null;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: opts.name,
    url: opts.canonical,
    isPartOf: {
      "@id": `${baseUrl()}/#website`,
    },
    about: {
      "@type": "Thing",
      name: "Dordoi.help supplier profile",
    },
  };

  const description = cleanText(opts.description);
  if (description) {
    data.description = description;
  }

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
