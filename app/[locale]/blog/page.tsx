import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogHubPage } from "@/components/seo/BlogHubPage";
import { buildPageMetadata } from "@/lib/seo";
import { isRouteLocale } from "@/lib/seo/route-locale";
import { BLOG_POSTS_ALL } from "@/lib/seo/stage2-content";
import {
  localizeBlogPostContent,
  stage4Copy,
} from "@/lib/seo/stage4-localized-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isRouteLocale(locale)) return { title: "404" };
  const copy = stage4Copy(locale);
  const localizedDescription: Record<string, string> = {
    kk: `${copy?.dordoiMarket}: практикалық гидтер, жеткізушілерді іздеу, көтерме сатып алу, байер және карго.`,
    kg: `${copy?.dordoiMarket}: практикалык гиддер, жеткирүүчүлөрдү издөө, оптом сатып алуу, байер жана карго.`,
    uz: `${copy?.dordoiMarket}: amaliy qo'llanmalar, yetkazib beruvchilarni qidirish, ulgurji xarid, xaridor-agent va kargo.`,
    tj: `${copy?.dordoiMarket}: роҳнамоҳои амалӣ, ҷустуҷӯи таъминкунандагон, хариди оптӣ, байер ва карго.`,
  };
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/blog",
    title: copy
      ? `${copy.blog} Dordoi.help - ${copy.suppliers}, ${copy.catalog}, ${copy.cargo}`
      : "Блог Dordoi.help — поставщики, опт, байеры и карго Дордой",
    description: copy
      ? localizedDescription[locale]
      : "Практические гиды Dordoi.help по рынку Дордой: как найти поставщика, купить оптом и организовать карго.",
  });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!isRouteLocale(locale)) notFound();
  setRequestLocale(locale);
  const posts = BLOG_POSTS_ALL.map((post) => localizeBlogPostContent(post, locale));
  return <BlogHubPage locale={locale} posts={posts} />;
}
