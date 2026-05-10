import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DatabaseProviderProfileView } from "@/components/provider/DatabaseProviderProfileView";
import { ProviderProfileView } from "@/components/provider/ProviderProfileView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  isProviderSlug,
  providerContactBySlug,
  PROVIDER_SLUGS,
} from "@/data/provider-registry";
import { buildPageMetadata } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { fetchPublishedVendorBySlug } from "@/lib/catalog/published-vendors";
import { getShowcaseCatalogFields } from "@/lib/catalog/showcase-vendor-i18n";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (isProviderSlug(slug)) {
    const t = await getTranslations({ locale, namespace: "Pages.providerProfile" });
    return buildPageMetadata({
      locale,
      pathWithoutLocale: `/catalog/${slug}`,
      title: t(`slugs.${slug}.metaTitle`),
      description: t(`slugs.${slug}.metaDescription`),
    });
  }

  const vendor = await fetchPublishedVendorBySlug(slug);
  if (!vendor) {
    return { title: "404" };
  }

  const tBrowse = await getTranslations({
    locale,
    namespace: "Pages.catalogBrowse",
  });
  const tProvider = await getTranslations({
    locale,
    namespace: "Pages.providerProfile",
  });
  const showcase = getShowcaseCatalogFields(vendor.slug, tBrowse);
  const title =
    showcase?.title ??
    vendor.store_name?.trim() ??
    tBrowse("fallbackStoreTitle");
  const description =
    showcase?.description.trim() ||
    vendor.description?.trim() ||
    vendor.description_detail?.trim() ||
    tProvider("listingBlurbFallback", { title });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: `/catalog/${vendor.slug}`,
    title: tBrowse("storeMetaTitleTemplate", { title }),
    description,
  });
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PROVIDER_SLUGS.map((slug) => ({ locale, slug })),
  );
}

export default async function ProviderProfilePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!isProviderSlug(slug)) {
    const vendor = await fetchPublishedVendorBySlug(slug);
    if (!vendor) {
      notFound();
    }
    return <DatabaseProviderProfileView vendor={vendor} />;
  }

  const t = await getTranslations({ locale, namespace: "Pages.providerProfile" });
  const contact = providerContactBySlug[slug];
  const path = `/catalog/${slug}`;
  const canonical = `${baseUrl()}/${locale}${path}`;
  const name = t(`slugs.${slug}.h1`);
  const description = t(`slugs.${slug}.metaDescription`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url: canonical,
    telephone: contact.telephoneE164,
    address: {
      "@type": "PostalAddress",
      addressLocality: contact.addressLocality,
      addressCountry: contact.addressCountry,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProviderProfileView slug={slug} />
    </>
  );
}
