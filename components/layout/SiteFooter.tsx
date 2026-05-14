import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  FOOTER_CATEGORY_IDS,
  FOOTER_HUB_LINKS,
  seoCategoryLinksForLocale,
} from "@/lib/seo/seo-internal-links";
import type { RouteLocale } from "@/lib/seo/route-locale";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tb = await getTranslations("brand");
  const locale = (await getLocale()) as RouteLocale;

  const legal = [
    { href: "/about", key: "about" as const },
    { href: "/help", key: "help" as const },
    { href: "/faq", key: "faq" as const },
    { href: "/contact", key: "contact" as const },
    { href: "/privacy", key: "privacy" as const },
    { href: "/terms", key: "terms" as const },
    { href: "/refund", key: "refund" as const },
  ];

  const hubLinks = FOOTER_HUB_LINKS.map((item) => ({
    href: item.href,
    label: t(`seoHub.${item.labelKey}`),
  }));

  const categoryLinks = seoCategoryLinksForLocale(
    locale,
    FOOTER_CATEGORY_IDS,
    (id) => t(`seoCategories.${id}`),
  );

  const linkClass =
    "text-[11px] leading-snug text-muted-foreground transition-colors hover:text-foreground";
  const rowClass =
    "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center";

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <nav className={rowClass} aria-label={t("seoNavAria")}>
          {hubLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
          <span className="text-[11px] text-muted-foreground/40" aria-hidden>
            ·
          </span>
          {categoryLinks.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={`mt-4 border-t border-border/40 pt-4 ${rowClass}`}>
          <p className="shrink-0 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {tb("name")}
          </p>
          {legal.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {t(`links.${item.key}`)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
