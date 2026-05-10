"use client";

import { ChevronDown, Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

const locales = routing.locales;

/** UI label for locale segment (URLs stay `kk` for Kazakh). */
function localeDisplayLabel(locale: string): string {
  if (locale === "kk") return "KZ";
  return locale.toUpperCase();
}

function DesktopLocaleSwitcher({
  pathname,
  langNavLabel,
}: {
  pathname: string;
  langNavLabel: string;
}) {
  const activeLocale = useLocale();
  const th = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative hidden md:block"
      role="navigation"
      aria-label={langNavLabel}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="desktop-locale-menu"
        aria-label={`${open ? th("langCollapse") : th("langExpand")} (${localeDisplayLabel(activeLocale)})`}
      >
        <span className="uppercase tracking-wide">{localeDisplayLabel(activeLocale)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id="desktop-locale-menu"
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[7rem] overflow-hidden rounded-xl border border-border/80 bg-background py-1 text-xs font-medium shadow-lg"
        >
          {locales.map((loc) => (
            <Link
              key={loc}
              href={pathname}
              locale={loc}
              role="menuitem"
              onClick={() => setOpen(false)}
              aria-current={loc === activeLocale ? "true" : undefined}
              className={cn(
                "flex items-center px-3 py-2 uppercase tracking-wide transition-colors hover:bg-muted/80",
                loc === activeLocale ? "bg-muted/50 text-foreground" : "text-muted-foreground",
              )}
            >
              {localeDisplayLabel(loc)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("Nav");
  const th = useTranslations("Header");
  const tb = useTranslations("brand");
  const pathname = usePathname();

  const nav = [
    { href: "/catalog", labelKey: "catalog" as const },
    { href: "/suppliers", labelKey: "suppliers" as const },
    { href: "/cargo", labelKey: "cargo" as const },
    { href: "/buyer-service", labelKey: "buyerService" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <Link
            href="/"
            className="shrink-0 outline-none transition-opacity hover:opacity-90 focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-foreground/50"
          >
            <BrandLogo name={tb("name")} size="md" />
          </Link>
          <nav
            className="hidden items-center gap-4 text-sm font-medium md:flex md:gap-5 lg:gap-6"
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
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <DesktopLocaleSwitcher pathname={pathname} langNavLabel={th("langNav")} />
          <Link
            href="/contact"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
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
                <SheetTitle className="text-left font-normal">
                  <BrandLogo name={tb("name")} size="sm" />
                </SheetTitle>
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
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "mt-2 justify-start px-2 font-medium text-muted-foreground hover:text-foreground",
                  )}
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
                      {localeDisplayLabel(loc)}
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
