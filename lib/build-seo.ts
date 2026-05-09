import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

export async function buildSeoMetadata(
  locale: string,
  pathWithoutLocale: string,
  seoNamespace:
    | "Seo.home"
    | "Seo.catalog"
    | "Seo.suppliers"
    | "Seo.buyers"
    | "Seo.buyerService"
    | "Seo.about"
    | "Seo.help"
    | "Seo.faq"
    | "Seo.contact"
    | "Seo.privacy"
    | "Seo.terms"
    | "Seo.refund",
) {
  const t = await getTranslations({ locale, namespace: seoNamespace });
  return buildPageMetadata({
    locale,
    pathWithoutLocale,
    title: t("title"),
    description: t("description"),
  });
}
