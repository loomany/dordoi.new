import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tb = await getTranslations("brand");

  const legal = [
    { href: "/about", key: "about" as const },
    { href: "/help", key: "help" as const },
    { href: "/faq", key: "faq" as const },
    { href: "/contact", key: "contact" as const },
    { href: "/privacy", key: "privacy" as const },
    { href: "/terms", key: "terms" as const },
    { href: "/refund", key: "refund" as const },
  ];

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-6xl justify-center px-4 py-8 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-5 text-center sm:flex-row sm:gap-6 sm:text-left">
          <Link href="/" className="inline-flex shrink-0" aria-label={tb("name")}>
            <BrandLogo name={tb("name")} size="md" />
          </Link>
          <nav
            className="flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start"
            aria-label={tb("name")}
          >
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(`links.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
