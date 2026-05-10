import "server-only";

import { getTranslations } from "next-intl/server";

import { isProviderSlug } from "@/data/provider-registry";
import { parseListingKey } from "@/lib/catalog/listing-key";

export type ResolvedListingDisplay = {
  title: string;
  description: string;
  /** Профиль в каталоге; для sample-карточек без slug может быть null */
  href: string | null;
};

export async function resolveListingDisplay(
  locale: string,
  listingKey: string,
): Promise<ResolvedListingDisplay | null> {
  const parsed = parseListingKey(listingKey);
  if (!parsed) {
    return null;
  }

  if (parsed.kind === "slug") {
    const slug = parsed.slug;
    if (!isProviderSlug(slug)) {
      return null;
    }
    const t = await getTranslations({
      locale,
      namespace: "Pages.providerProfile",
    });
    return {
      title: t(`slugs.${slug}.h1`),
      description: t(`slugs.${slug}.metaDescription`),
      href: `/catalog/${slug}`,
    };
  }

  const t = await getTranslations({
    locale,
    namespace: "Pages.catalogBrowse",
  });
  return {
    title: t(`samples.${parsed.sampleId}.title`),
    description: t(`samples.${parsed.sampleId}.description`),
    href: null,
  };
}
