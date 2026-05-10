import { setRequestLocale } from "next-intl/server";
import { CatalogBrowseLayout } from "@/components/catalog/CatalogBrowseLayout";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/catalog", "Seo.catalog");
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CatalogBrowseLayout />;
}
