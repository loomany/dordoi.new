import { JsonLd } from "@/components/seo/JsonLd";
import { siteIndexable } from "@/lib/site";
import type { VendorFaqItem } from "@/lib/dordoi/vendorFaq";

type Props = {
  items: VendorFaqItem[];
};

export function FaqJsonLd({ items }: Props) {
  if (items.length < 3 || !siteIndexable()) {
    return null;
  }

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}
