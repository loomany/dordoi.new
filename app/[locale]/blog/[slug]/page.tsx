import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogGuidePage } from "@/components/seo/BlogGuidePage";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { isRouteLocale } from "@/lib/seo/route-locale";
import {
  BLOG_POSTS_ALL,
  resolveBlogPost,
} from "@/lib/seo/stage2-content";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    BLOG_POSTS_ALL.map((post) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const post = resolveBlogPost(slug, locale);
  if (!post) return { title: "404" };
  return buildPageMetadata({
    locale,
    pathWithoutLocale: post.path,
    title: post.title,
    description: post.description,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);
  const post = resolveBlogPost(slug, locale);
  if (!post) notFound();
  return <BlogGuidePage locale={locale} post={post} />;
}
