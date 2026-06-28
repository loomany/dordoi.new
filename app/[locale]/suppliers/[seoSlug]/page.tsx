import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DatabaseProviderProfileView } from "@/components/provider/DatabaseProviderProfileView";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildVendorSeoLocalBusinessJsonLd } from "@/lib/catalog/vendor-local-business-jsonld";
import {
  buildVendorSuppliersSeoCopy,
  primaryVendorMainCategoryId,
  vendorPublicListingNumber,
  vendorPublicStoreLabel,
  vendorSuppliersSeoPath,
  vendorSuppliersSeoRobotsPolicy,
} from "@/lib/catalog/vendor-public-seo";
import {
  fetchApprovedVendorPhotoBatches,
  fetchPublishedVendorBySeoSlug,
} from "@/lib/catalog/published-vendors";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; seoSlug: string }> };

function vendorCategoryPhrase(
  t: (key: string) => string,
  mainCategoryId: string | undefined,
): string | null {
  if (!mainCategoryId) return null;
  return t(`publicSeo.categories.${mainCategoryId}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, seoSlug } = await params;
  const vendor = await fetchPublishedVendorBySeoSlug(seoSlug);
  if (!vendor) {
    return { title: "404" };
  }

  const tProvider = await getTranslations({
    locale,
    namespace: "Pages.providerProfile",
  });
  const mainCategoryId = primaryVendorMainCategoryId(vendor.categories);
  const categoryPhrase = vendorCategoryPhrase(tProvider, mainCategoryId);
  const storeLabel = vendorPublicStoreLabel(
    vendor.store_name,
    tProvider("publicSeo.visibleLabelNumbered", {
      number: vendorPublicListingNumber(vendor.id),
    }),
  );
  const { title, description } = buildVendorSuppliersSeoCopy({
    t: tProvider,
    storeLabel,
    categoryPhrase,
  });

  return buildPageMetadata({
    locale,
    pathWithoutLocale: vendorSuppliersSeoPath(seoSlug),
    title,
    description,
    robotsPolicy: vendorSuppliersSeoRobotsPolicy(),
  });
}

export default async function SupplierSeoProfilePage({ params }: Props) {
  const { locale, seoSlug } = await params;
  setRequestLocale(locale);

  const vendor = await fetchPublishedVendorBySeoSlug(seoSlug);
  if (!vendor) {
    notFound();
  }

  const tProvider = await getTranslations({
    locale,
    namespace: "Pages.providerProfile",
  });
  const mainCategoryId = primaryVendorMainCategoryId(vendor.categories);
  const categoryPhrase = vendorCategoryPhrase(tProvider, mainCategoryId);
  const storeLabel = vendorPublicStoreLabel(
    vendor.store_name,
    tProvider("publicSeo.visibleLabelNumbered", {
      number: vendorPublicListingNumber(vendor.id),
    }),
  );
  const seoCopy = buildVendorSuppliersSeoCopy({
    t: tProvider,
    storeLabel,
    categoryPhrase,
  });
  const initialPhotoBatches = await fetchApprovedVendorPhotoBatches({
    vendorId: vendor.id,
    limit: 4,
  });
  const primaryImageUrl =
    vendor.container_photo_url ?? initialPhotoBatches[0]?.photos[0] ?? null;
  const jsonLd = buildVendorSeoLocalBusinessJsonLd(
    vendor,
    locale,
    {
      name: storeLabel,
      description: seoCopy.description,
      category: categoryPhrase,
      mediaSectionName: tProvider("mediaSectionTitle"),
      primaryImageUrl,
      videoUrls:
        initialPhotoBatches.length > 0 ? vendor.product_videos : undefined,
    },
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <DatabaseProviderProfileView
        vendor={vendor}
        profileMode="seo"
        initialPhotoBatches={initialPhotoBatches}
      />
    </>
  );
}
