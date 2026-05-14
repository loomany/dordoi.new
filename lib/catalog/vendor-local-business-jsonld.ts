import type { PublishedVendorRow } from "@/lib/catalog/published-vendors";
import { getAiCatalogDisplayOverlay } from "@/lib/catalog/parsed-ai-catalog-overlay";
import { vendorSuppliersSeoPath } from "@/lib/catalog/vendor-public-seo";
import { baseUrl } from "@/lib/site";

function ensureHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function telegramProfileUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("@")) {
    return `https://t.me/${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith("t.me/")) {
    return `https://${trimmed}`;
  }
  return ensureHttpUrl(trimmed);
}

function vendorSameAsUrls(vendor: PublishedVendorRow): string[] {
  const urls: string[] = [];
  const instagram = vendor.instagram_url?.trim();
  if (instagram) {
    urls.push(ensureHttpUrl(instagram));
  }
  const telegram = vendor.telegram_url?.trim();
  if (telegram) {
    urls.push(telegramProfileUrl(telegram));
  }
  return urls;
}

/** Schema.org LocalBusiness JSON-LD for `/suppliers/{seo_slug}` (indexable). */
export function buildVendorSeoLocalBusinessJsonLd(
  vendor: PublishedVendorRow,
  locale: string,
): Record<string, unknown> {
  const seoSlug = vendor.seo_slug?.trim() || vendor.slug;
  const path = vendorSuppliersSeoPath(seoSlug);
  const canonical = `${baseUrl()}/${locale}${path}`;
  const name = vendor.store_name?.trim() || seoSlug;
  const aiOverlay = getAiCatalogDisplayOverlay(vendor.parsed_ai_data, locale);
  const description =
    aiOverlay?.description?.trim() || vendor.description?.trim();
  const logoUrl = vendor.logo_url?.trim();
  const locationRow = vendor.location_row?.trim();
  const telephone = vendor.phone_number?.trim();
  const sameAs = vendorSameAsUrls(vendor);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url: canonical,
  };

  if (description) {
    data.description = description;
  }
  if (logoUrl) {
    data.image = logoUrl;
  }
  if (locationRow) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: locationRow,
      addressLocality: "Бишкек",
      addressCountry: "KG",
    };
  }
  if (telephone) {
    data.telephone = telephone;
  }
  if (sameAs.length > 0) {
    data.sameAs = sameAs;
  }

  return data;
}

/** @deprecated Catalog profiles are noindex; prefer `buildVendorSeoLocalBusinessJsonLd`. */
export function buildVendorLocalBusinessJsonLd(
  vendor: PublishedVendorRow,
  locale: string,
): Record<string, unknown> {
  const path = `/catalog/${vendor.slug}`;
  const canonical = `${baseUrl()}/${locale}${path}`;
  const name = vendor.store_name?.trim() || vendor.slug;
  const aiOverlay = getAiCatalogDisplayOverlay(vendor.parsed_ai_data, locale);
  const description =
    aiOverlay?.description?.trim() || vendor.description?.trim();
  const logoUrl = vendor.logo_url?.trim();
  const locationRow = vendor.location_row?.trim();
  const telephone = vendor.phone_number?.trim();
  const sameAs = vendorSameAsUrls(vendor);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url: canonical,
  };

  if (description) {
    data.description = description;
  }
  if (logoUrl) {
    data.image = logoUrl;
  }
  if (locationRow) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: locationRow,
      addressLocality: "Бишкек",
      addressCountry: "KG",
    };
  }
  if (telephone) {
    data.telephone = telephone;
  }
  if (sameAs.length > 0) {
    data.sameAs = sameAs;
  }

  return data;
}
