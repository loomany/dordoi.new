import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogGuidePage } from "@/components/seo/BlogGuidePage";
import { buildPageMetadata } from "@/lib/seo";
import { blogPostPathsByLocale } from "@/lib/seo/dordoi-blog-localized";
import { isRouteLocale } from "@/lib/seo/route-locale";
import {
  blogPostStaticParams,
  resolveBlogPost,
  resolveBlogPostRedirectPath,
} from "@/lib/seo/stage2-content";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return blogPostStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const post = resolveBlogPost(slug, locale);
  if (!post) return { title: "404" };
  const sourceSlug = post.sourceSlug ?? post.slug;
  return buildPageMetadata({
    locale,
    pathWithoutLocale: post.path,
    title: post.title,
    description: post.description,
    alternatePathsByLocale: blogPostPathsByLocale(sourceSlug),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);
  const post = resolveBlogPost(slug, locale);
  if (!post) {
    const redirectPath = resolveBlogPostRedirectPath(slug, locale);
    if (redirectPath) permanentRedirect(`/${locale}${redirectPath}`);
    notFound();
  }
  return <BlogGuidePage locale={locale} post={post} />;
}
