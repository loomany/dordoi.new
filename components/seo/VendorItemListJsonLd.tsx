import { JsonLd } from "@/components/seo/JsonLd";
import { baseUrl, siteIndexable } from "@/lib/site";

export type VendorItemListEntry = {
  slug: string;
  name: string;
};

type Props = {
  locale: string;
  items: VendorItemListEntry[];
};

export function VendorItemListJsonLd({ locale, items }: Props) {
  if (items.length === 0 || !siteIndexable()) {
    return null;
  }

  const root = baseUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${root}/${locale}/catalog/${item.slug}`,
    })),
  };

  return <JsonLd data={data} />;
}
