import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingSections } from "@/components/landing/LandingSections";
import { HomeSeoGrowthLinks } from "@/components/seo/HomeSeoGrowthLinks";
import { buildSeoMetadata } from "@/lib/build-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return buildSeoMetadata(locale, "/", "Seo.home");
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <HeroSection />
      <LandingSections />
      <HomeSeoGrowthLinks locale={locale} />
    </div>
  );
}
