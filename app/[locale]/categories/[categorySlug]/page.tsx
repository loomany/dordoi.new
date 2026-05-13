import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SeoCategoryLanding } from "@/components/seo/SeoCategoryLanding";
import { buildSeoCategoryMetadata } from "@/lib/catalog/seo-category-metadata";
import {
  getAllSeoCategoryStaticParams,
  resolveSeoCategoryBySlug,
} from "@/lib/catalog/seo-category-routes";
import { seoCategoryPageLabels } from "@/lib/seo/seo-page-labels";
import { isRouteLocale, type RouteLocale } from "@/lib/seo/route-locale";

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>;
};

export function generateStaticParams() {
  return getAllSeoCategoryStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const route = resolveSeoCategoryBySlug(locale, categorySlug);
  if (!route) return { title: "404" };
  return buildSeoCategoryMetadata(locale, route);
}

export default async function SeoCategoryPage({ params }: Props) {
  const { locale, categorySlug } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);

  const route = resolveSeoCategoryBySlug(locale, categorySlug);
  if (!route) notFound();

  return (
    <SeoCategoryLanding
      locale={locale as RouteLocale}
      route={route}
      labels={seoCategoryPageLabels(locale)}
    />
  );
}
