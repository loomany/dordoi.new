"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const locales = routing.locales;

export function SiteHeader() {
  const t = useTranslations("Nav");
  const th = useTranslations("Header");
  const tb = useTranslations("brand");
  const pathname = usePathname();

  const nav = [
    { href: "/catalog", labelKey: "catalog" as const },
    { href: "/suppliers", labelKey: "suppliers" as const },
    { href: "/buyers", labelKey: "buyers" as const },
    { href: "/buyer-service", labelKey: "buyerService" as const },
    { href: "/help", labelKey: "help" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {tb("name")}
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm font-medium md:flex"
          aria-label={th("mainNav")}
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div
            className="hidden items-center gap-1 rounded-full border border-border/80 bg-muted/40 px-1 py-0.5 text-xs font-medium md:flex"
            role="navigation"
            aria-label={th("langNav")}
          >
            {locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className="rounded-full px-2 py-1 uppercase text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {loc}
              </Link>
            ))}
          </div>
          <Link
            href="/contact"
            className={cn(
              buttonVariants({}),
              "hidden rounded-full md:inline-flex",
            )}
          >
            {th("ctaStart")}
          </Link>
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "md:hidden",
              )}
              aria-label={th("openMenu")}
            >
              <Menu className="size-5" aria-hidden />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>{tb("name")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start",
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
                <Link
                  href="/contact"
                  className={cn(buttonVariants({}), "mt-2 rounded-full text-center")}
                >
                  {th("ctaStart")}
                </Link>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {locales.map((loc) => (
                    <Link
                      key={loc}
                      href={pathname}
                      locale={loc}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      {loc.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
