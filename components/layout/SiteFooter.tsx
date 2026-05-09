import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Separator } from "@/components/ui/separator";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tb = await getTranslations("brand");
  const tl = await getTranslations("LegalDisclaimer");

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
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-lg font-semibold">{tb("name")}</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="text-xs text-muted-foreground">{tl("short")}</p>
          </div>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium text-foreground">{t("supportEmail")}</span>
            </p>
            <p>
              <span className="font-medium text-foreground">{t("privacyEmail")}</span>
            </p>
            <p className="text-muted-foreground">{t("social")}</p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-medium text-muted-foreground">{t("legal")}</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label={t("legal")}>
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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
