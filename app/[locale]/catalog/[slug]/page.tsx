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
import { buildVendorLocalBusinessJsonLd } from "@/lib/catalog/vendor-local-business-jsonld";
import {
  primaryVendorMainCategoryId,
  vendorProfileRobotsPolicy,
} from "@/lib/catalog/vendor-public-seo";
import { buildPageMetadata } from "@/lib/seo";
import { baseUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { fetchPublishedVendorBySlug } from "@/lib/catalog/published-vendors";

type Props = { params: Promise<{ locale: string; slug: string }> };

function vendorCategoryPhrase(
  t: (key: string) => string,
  mainCategoryId: string | undefined,
): string | null {
  if (!mainCategoryId) return null;
  return t(`publicSeo.categories.${mainCategoryId}`);
}

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

  const tProvider = await getTranslations({
    locale,
    namespace: "Pages.providerProfile",
  });
  const mainCategoryId = primaryVendorMainCategoryId(vendor.categories);
  const categoryPhrase = vendorCategoryPhrase(tProvider, mainCategoryId);
  const title = categoryPhrase
    ? tProvider("publicSeo.metaTitleWithCategory", { category: categoryPhrase })
    : tProvider("publicSeo.metaTitleFallback");
  const description = categoryPhrase
    ? tProvider("publicSeo.metaDescriptionWithCategory", { category: categoryPhrase })
    : tProvider("publicSeo.metaDescriptionFallback");

  return buildPageMetadata({
    locale,
    pathWithoutLocale: `/catalog/${vendor.slug}`,
    title,
    description,
    robotsPolicy: vendorProfileRobotsPolicy(vendor.slug),
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
    const jsonLd = buildVendorLocalBusinessJsonLd(vendor, locale);
    return (
      <>
        <JsonLd data={jsonLd} />
        <DatabaseProviderProfileView vendor={vendor} />
      </>
    );
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
