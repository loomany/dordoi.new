import { JsonLd } from "@/components/seo/JsonLd";
import { baseUrl } from "@/lib/site";

export function SiteBrandJsonLd() {
  const url = baseUrl();
  const logo = `${url}/apple-icon`;

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
            logo: {
              "@type": "ImageObject",
              url: logo,
              width: 180,
              height: 180,
            },
          },
          {
            "@type": "WebSite",
            "@id": `${url}/#website`,
            name: "Dordoi.help",
            url,
            publisher: { "@id": `${url}/#organization` },
          },
        ],
      }}
    />
  );
}
