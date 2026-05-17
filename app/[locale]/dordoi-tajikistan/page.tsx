import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SeoGrowthLandingPage } from "@/components/seo/SeoGrowthLandingPage";
import { buildPageMetadata } from "@/lib/seo";
import { isRouteLocale } from "@/lib/seo/route-locale";
import {
  CORE_LINKS,
  COUNTRY_LINKS,
  POPULAR_CATEGORY_LINKS,
  resolveCountryPage,
} from "@/lib/seo/stage2-content";

type Props = { params: Promise<{ locale: string }> };
const PAGE_ID = "dordoi-tajikistan";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const content = resolveCountryPage(PAGE_ID, locale);
  if (!content) return { title: "404" };
  return buildPageMetadata({
    locale,
    pathWithoutLocale: content.path,
    title: content.title,
    description: content.description,
  });
}

export default async function DordoiTajikistanPage({ params }: Props) {
  const { locale } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);
  const content = resolveCountryPage(PAGE_ID, locale);
  if (!content) notFound();

  return (
    <SeoGrowthLandingPage
      locale={locale}
      content={content}
      relatedLinks={[
        { title: "Страны", links: COUNTRY_LINKS },
        { title: "Категории", links: POPULAR_CATEGORY_LINKS },
        { title: "Разделы", links: CORE_LINKS },
      ]}
    />
  );
}
