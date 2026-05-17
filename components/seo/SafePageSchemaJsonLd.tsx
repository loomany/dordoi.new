import { JsonLd } from "@/components/seo/JsonLd";
import { htmlLangFromRouteLocale } from "@/lib/hreflang";
import { baseUrl, siteIndexable } from "@/lib/site";

type SafePageSchemaType = "WebPage" | "AboutPage" | "CollectionPage";

type SafePageSchemaJsonLdProps = {
  type?: SafePageSchemaType;
  locale: string;
  path: string;
  name: string;
  description: string;
  keywords?: string[];
  service?: {
    name: string;
    serviceType: string;
    areaServed?: string[];
    audience?: string;
  };
};

type BlogPostingJsonLdProps = {
  locale: string;
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
};

function absoluteUrl(locale: string, path: string) {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl()}/${locale}${normalized}`;
}

export function SafePageSchemaJsonLd({
  type = "WebPage",
  locale,
  path,
  name,
  description,
  keywords = [],
  service,
}: SafePageSchemaJsonLdProps) {
  if (!siteIndexable()) return null;

  const url = absoluteUrl(locale, path);
  const inLanguage = htmlLangFromRouteLocale(locale);
  const graph: Record<string, unknown>[] = [
    {
      "@type": type,
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      inLanguage,
      isPartOf: { "@id": `${baseUrl()}/#website` },
      publisher: { "@id": `${baseUrl()}/#organization` },
      ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    },
  ];

  if (service) {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: service.name,
      serviceType: service.serviceType,
      provider: { "@id": `${baseUrl()}/#organization` },
      url,
      areaServed: (service.areaServed ?? [
        "Kyrgyzstan",
        "Kazakhstan",
        "Uzbekistan",
        "Tajikistan",
        "Russia",
        "CIS",
      ]).map((name) => ({ "@type": "Country", name })),
      ...(service.audience
        ? {
            audience: {
              "@type": "Audience",
              audienceType: service.audience,
            },
          }
        : {}),
    });
  }

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": graph,
      }}
    />
  );
}

export function BlogPostingJsonLd({
  locale,
  path,
  headline,
  description,
  datePublished,
  dateModified,
  keywords = [],
}: BlogPostingJsonLdProps) {
  if (!siteIndexable()) return null;

  const url = absoluteUrl(locale, path);
  const inLanguage = htmlLangFromRouteLocale(locale);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${url}#blogposting`,
        url,
        headline,
        description,
        inLanguage,
        datePublished,
        dateModified: dateModified ?? datePublished,
        author: {
          "@type": "Organization",
          name: "Dordoi.help",
          url: baseUrl(),
        },
        publisher: { "@id": `${baseUrl()}/#organization` },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
        },
        ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
      }}
    />
  );
}
