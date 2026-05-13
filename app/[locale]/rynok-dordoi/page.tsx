import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SeoCoreLanding } from "@/components/seo/SeoCoreLanding";
import {
  getAllCoreSeoLandingStaticParams,
  resolveCoreSeoLanding,
  type CoreSeoLandingId,
} from "@/lib/seo/core-seo-landings";
import { buildPageMetadata } from "@/lib/seo";
import { seoCorePageLabels } from "@/lib/seo/seo-page-labels";
import { isRouteLocale, type RouteLocale } from "@/lib/seo/route-locale";

const LANDING_ID: CoreSeoLandingId = "rynok-dordoi";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return getAllCoreSeoLandingStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const landing = resolveCoreSeoLanding(LANDING_ID);
  if (!landing) return { title: "404" };
  return buildPageMetadata({
    locale,
    pathWithoutLocale: landing.path,
    title: landing.titleByLocale[locale],
    description: landing.descriptionByLocale[locale],
  });
}

export default async function RynokDordoiPage({ params }: Props) {
  const { locale } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);

  const landing = resolveCoreSeoLanding(LANDING_ID);
  if (!landing) notFound();

  return (
    <SeoCoreLanding
      locale={locale as RouteLocale}
      landing={landing}
      labels={seoCorePageLabels(locale)}
    />
  );
}
