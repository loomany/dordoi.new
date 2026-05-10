import { getTranslations, setRequestLocale } from "next-intl/server";

import { BuyerFavoritesSection } from "@/components/cabinet/BuyerFavoritesSection";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { fetchBuyerFavoriteKeysOrdered } from "@/lib/favorites/buyer-favorites";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Cabinet.buyer",
  });
  return buildPageMetadata({
    locale,
    pathWithoutLocale: "/cabinet/buyer",
    title: t("metaTitle"),
    description: t("metaDescription"),
    privateArea: true,
  });
}

export default async function BuyerCabinetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Cabinet.buyer" });
  const profile = await getSessionProfile();
  const favoriteKeys = profile
    ? await fetchBuyerFavoriteKeysOrdered(profile.userId)
    : [];

  return (
    <div className="pb-4">
      <h1 className="sr-only">{t("title")}</h1>
      <BuyerFavoritesSection locale={locale} listingKeys={favoriteKeys} />
    </div>
  );
}
