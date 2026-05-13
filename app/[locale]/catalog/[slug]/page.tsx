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
import {
  buildCatalogCardSourceRowForPublishedVendor,
  fetchPublishedVendorBySlug,
} from "@/lib/catalog/published-vendors";

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
  const tTree = await getTranslations({
    locale,
    namespace: "catalogCategoryTree",
  });
  const tProvider = await getTranslations({
    locale,
    namespace: "Pages.providerProfile",
  });
  const cardRow = buildCatalogCardSourceRowForPublishedVendor(vendor, {
    tBrowse,
    tTreeCategory: (key) => tTree(key),
    locale,
  });
  const title =
    cardRow.display.storeTitle.trim() || tBrowse("fallbackStoreTitle");
  const description =
    cardRow.display.description.trim() ||
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
