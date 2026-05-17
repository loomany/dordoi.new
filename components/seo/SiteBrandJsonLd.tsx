import { JsonLd } from "@/components/seo/JsonLd";
import { baseUrl } from "@/lib/site";

export function SiteBrandJsonLd() {
  const url = baseUrl();
  const logo = `${url}/brand/logo-192.png`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${url}/#organization`,
            name: "Dordoi.help",
            url,
            description:
              "Catalog of Dordoi Market suppliers, buyer agents, product categories and buying services for wholesale buyers in Kyrgyzstan and CIS countries.",
            logo: {
              "@type": "ImageObject",
              url: logo,
              width: 192,
              height: 192,
            },
            areaServed: [
              "Kyrgyzstan",
              "Kazakhstan",
              "Uzbekistan",
              "Tajikistan",
              "Russia",
              "CIS",
            ].map((name) => ({ "@type": "Country", name })),
            availableLanguage: ["ru", "kk", "ky", "uz", "tg"],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@dordoi.help",
              availableLanguage: ["ru", "kk", "ky", "uz", "tg"],
            },
          },
          {
            "@type": "WebSite",
            "@id": `${url}/#website`,
            name: "Dordoi.help",
            url,
            publisher: { "@id": `${url}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: `${url}/ru/catalog?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }}
    />
  );
}
