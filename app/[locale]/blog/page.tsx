import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogHubPage } from "@/components/seo/BlogHubPage";
import { buildPageMetadata } from "@/lib/seo";
import { isRouteLocale } from "@/lib/seo/route-locale";
import { BLOG_POSTS_ALL } from "@/lib/seo/stage2-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/blog",
    title: "Блог Dordoi.help — поставщики, опт, байеры и карго Дордой",
    description:
      "Практические гиды Dordoi.help по рынку Дордой: как найти поставщика, купить оптом и организовать карго.",
  });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);
  return <BlogHubPage locale={locale} posts={BLOG_POSTS_ALL} />;
}
