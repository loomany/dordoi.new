import "server-only";

/** Фиксированные slug из `20250511120000_showcase_vendors.sql`. */
export const SHOWCASE_VENDOR_SLUGS = [
  "dordoi-showcase-example-1-clothing",
  "dordoi-showcase-example-2-shoes",
] as const;

export type ShowcaseVendorSlug = (typeof SHOWCASE_VENDOR_SLUGS)[number];

export function isShowcaseVendorSlug(
  slug: string | null | undefined,
): slug is ShowcaseVendorSlug {
  return (
    slug != null &&
    (SHOWCASE_VENDOR_SLUGS as readonly string[]).includes(slug)
  );
}

/** `t` из `getTranslations("Pages.catalogBrowse")` — сигнатура как у next-intl `Translator`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ICU values (React nodes, rich types) from next-intl
export type CatalogBrowseT = (key: string, values?: Record<string, any>) => string;

function readCategories(t: CatalogBrowseT, slug: string): string[] {
  const base = `showcaseVendors.${slug}`;
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const v = t(`${base}.category${i}`).trim();
    if (v) out.push(v);
  }
  return out;
}

/** Тексты карточки каталога (и заголовок в метаданных). */
export function getShowcaseCatalogFields(
  slug: string,
  t: CatalogBrowseT,
): null | { title: string; description: string; categories: string[] } {
  if (!isShowcaseVendorSlug(slug)) return null;
  const base = `showcaseVendors.${slug}`;
  return {
    title: t(`${base}.title`),
    description: t(`${base}.description`),
    categories: readCategories(t, slug),
  };
}

export type ShowcaseProfileTerms = {
  minBatch: string;
  paymentMethods: string;
  shippingValue: string;
  samplesValue: string;
  returnsPolicy: string;
};

/** Поля профиля и блока «О поставщике» для витринных магазинов. */
export function getShowcaseProfileFields(
  slug: string,
  t: CatalogBrowseT,
): null | {
  title: string;
  locationRow: string;
  description: string;
  descriptionDetail: string | null;
  categories: string[];
  terms: ShowcaseProfileTerms;
} {
  if (!isShowcaseVendorSlug(slug)) return null;
  const base = `showcaseVendors.${slug}`;
  const detail = t(`${base}.descriptionDetail`).trim();
  return {
    title: t(`${base}.title`),
    locationRow: t(`${base}.locationRow`),
    description: t(`${base}.description`),
    descriptionDetail: detail.length > 0 ? detail : null,
    categories: readCategories(t, slug),
    terms: {
      minBatch: t(`${base}.minBatch`),
      paymentMethods: t(`${base}.paymentMethods`),
      shippingValue: t(`${base}.termShippingValue`),
      samplesValue: t(`${base}.termSamplesValue`),
      returnsPolicy: t(`${base}.returnsPolicy`),
    },
  };
}
