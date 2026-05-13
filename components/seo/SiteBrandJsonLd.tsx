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
            logo: {
              "@type": "ImageObject",
              url: logo,
              width: 192,
              height: 192,
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
