import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { baseUrl, siteIndexable } from "@/lib/site";

type Crumb = {
  label: string;
  href?: string;
};

type SeoBreadcrumbsProps = {
  items: Crumb[];
  navLabel: string;
  /** Route locale segment (ru, kk, …) — required for BreadcrumbList JSON-LD. */
  locale?: string;
  /** Absolute URL of the current page (last crumb when it has no href). */
  currentPageUrl?: string;
};

function crumbAbsoluteUrl(
  locale: string,
  href: string | undefined,
  currentPageUrl: string | undefined,
  isLast: boolean,
): string | undefined {
  if (isLast && !href) {
    return currentPageUrl;
  }
  if (!href) {
    return currentPageUrl;
  }
  const path = href === "/" ? "" : href.startsWith("/") ? href : `/${href}`;
  return `${baseUrl()}/${locale}${path}`;
}

function buildBreadcrumbListJsonLd(
  locale: string,
  items: Crumb[],
  currentPageUrl: string | undefined,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1;
      const itemUrl = crumbAbsoluteUrl(locale, item.href, currentPageUrl, isLast);
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
      };
      if (itemUrl) {
        entry.item = itemUrl;
      }
      return entry;
    }),
  };
}

export function SeoBreadcrumbs({
  items,
  navLabel,
  locale,
  currentPageUrl,
}: SeoBreadcrumbsProps) {
  const jsonLd =
    locale && siteIndexable()
      ? buildBreadcrumbListJsonLd(locale, items, currentPageUrl)
      : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <nav aria-label={navLabel} className="text-xs text-muted-foreground/75">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span className="text-muted-foreground/40" aria-hidden>
                    /
                  </span>
                ) : null}
                {isLast || !item.href ? (
                  <span
                    className={isLast ? "font-medium text-muted-foreground" : undefined}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
