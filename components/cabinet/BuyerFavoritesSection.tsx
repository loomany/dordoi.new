import { getTranslations } from "next-intl/server";

import { CatalogFavoriteButton } from "@/components/favorites/CatalogFavoriteButton";
import { cabinetShell } from "@/components/cabinet/cabinet-tokens";
import { resolveListingDisplay } from "@/lib/catalog/resolve-listing-display";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  listingKeys: string[];
};

export async function BuyerFavoritesSection({ locale, listingKeys }: Props) {
  const t = await getTranslations({ locale, namespace: "Cabinet.buyer" });

  const resolved = await Promise.all(
    listingKeys.map(async (key) => {
      const row = await resolveListingDisplay(locale, key);
      return row ? { listingKey: key, ...row } : null;
    }),
  );

  const items = resolved.filter(Boolean) as Array<{
    listingKey: string;
    title: string;
    description: string;
    href: string | null;
  }>;

  if (items.length === 0) {
    return (
      <section
        className={cn(cabinetShell.surface, "px-5 py-8 sm:px-8")}
        aria-labelledby="buyer-favorites-heading"
      >
        <h2 id="buyer-favorites-heading" className={cabinetShell.sectionTitle}>
          {t("favoritesTitle")}
        </h2>
        <p className="max-w-full text-pretty text-sm leading-relaxed text-muted-foreground sm:max-w-prose sm:text-base">
          {t("favoritesEmpty")}
        </p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/catalog"
            className={cn(
              landingBlueCtaClassName,
              "rounded-full px-6 py-2.5 text-sm font-semibold sm:px-8 sm:py-3 sm:text-base",
            )}
          >
            {t("favoritesOpenCatalog")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(cabinetShell.surface, "px-5 py-8 sm:px-8")}
      aria-labelledby="buyer-favorites-heading"
    >
      <h2 id="buyer-favorites-heading" className={cabinetShell.sectionTitle}>
        {t("favoritesTitle")}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.listingKey}
            className={cn(
              "relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
              "dark:border-zinc-800 dark:bg-zinc-950/50",
            )}
          >
            <div className="absolute right-4 top-4 z-10">
              <CatalogFavoriteButton
                key={`${item.listingKey}:true`}
                listingKey={item.listingKey}
                initialFavorite
                variant="card"
              />
            </div>
            <h3 className="pr-14 text-lg font-bold text-gray-900 dark:text-zinc-50">
              {item.href ? (
                <Link
                  href={item.href}
                  className="outline-none ring-orange-300 transition-colors hover:text-orange-600 focus-visible:rounded-sm focus-visible:ring-2"
                >
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h3>
            <p className="mt-2 line-clamp-4 flex-1 text-sm text-gray-500 dark:text-zinc-400">
              {item.description}
            </p>
            {item.href ? (
              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
                <Link
                  href={item.href}
                  className="block w-full rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-orange-500 transition-colors hover:bg-orange-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  {t("favoritesOpenProfile")}
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
