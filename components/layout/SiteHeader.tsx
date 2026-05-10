"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  Globe2,
  LayoutGrid,
  Menu,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

/** Nav icon tiles — sky / emerald alternate (same palette as BrandLogo word vs suffix). */
function navIconTileClass(index: number): string {
  const sky =
    "bg-sky-50 text-sky-700 ring-sky-200/90 dark:bg-sky-950/45 dark:text-sky-300 dark:ring-sky-800/55";
  const emerald =
    "bg-emerald-50 text-emerald-700 ring-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50";
  return index % 2 === 0 ? sky : emerald;
}

type LocaleSwitcherVariant = "desktop" | "mobile";

function LocaleSwitcherDropdown({
  pathname,
  langNavLabel,
  variant,
}: {
  pathname: string;
  langNavLabel: string;
  variant: LocaleSwitcherVariant;
}) {
  const activeLocale = useLocale();
  const th = useTranslations("Header");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  const isDesktop = variant === "desktop";

  return (
    <div
      ref={containerRef}
      className={cn("relative", isDesktop ? "hidden md:block" : "md:hidden")}
      role="navigation"
      aria-label={langNavLabel}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 transition-[color,box-shadow,background-color]",
          isDesktop
            ? "rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-muted/60"
            : "rounded-xl border border-gray-200/95 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-800 shadow-sm ring-1 ring-gray-900/[0.04] hover:border-gray-300 hover:bg-gray-50",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={`${open ? th("langCollapse") : th("langExpand")} (${localeDisplayLabel(activeLocale)})`}
      >
        {!isDesktop ? (
          <Globe2 className="size-3.5 shrink-0 text-gray-500" aria-hidden />
        ) : null}
        <span className="uppercase tracking-wide">{localeDisplayLabel(activeLocale)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
            open && "rotate-180",
            !isDesktop && "size-3.5 text-gray-400",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute right-0 top-[calc(100%+0.35rem)] z-[60] min-w-[9.5rem] overflow-hidden py-1 text-xs font-medium shadow-lg ring-1 ring-gray-900/[0.06]",
            isDesktop
              ? "rounded-xl border border-border/80 bg-background"
              : "rounded-xl border border-gray-200 bg-white",
          )}
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
                "flex items-center px-3 py-2.5 uppercase tracking-wide transition-colors",
                isDesktop ? "hover:bg-muted/80" : "hover:bg-gray-50",
                loc === activeLocale
                  ? isDesktop
                    ? "bg-muted/50 text-foreground"
                    : "bg-gray-50 font-semibold text-gray-900"
                  : isDesktop
                    ? "text-muted-foreground"
                    : "text-gray-600",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const nav: {
    href: string;
    labelKey: "catalog" | "sell" | "cargo" | "buyers";
    Icon: LucideIcon;
  }[] = [
    { href: "/catalog", labelKey: "catalog", Icon: LayoutGrid },
    { href: "/sell", labelKey: "sell", Icon: Store },
    { href: "/cargo", labelKey: "cargo", Icon: Truck },
    { href: "/buyers", labelKey: "buyers", Icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-5">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "size-10 shrink-0 rounded-xl border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/[0.04] md:hidden",
              )}
              aria-label={th("openMenu")}
            >
              <Menu className="size-5" aria-hidden />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(100%,21rem)] flex-col border-r border-gray-200 bg-[#fafafa] p-0 ring-1 ring-gray-900/[0.04]"
            >
              <div className="border-b border-gray-100 bg-white px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
                {/** `pr-11` clears the sheet close control (absolute top-3 right-3). */}
                <div className="flex min-h-[2.25rem] items-center pr-11">
                  <BrandLogo name={tb("name")} size="sm" />
                </div>
                <SheetTitle className="sr-only">{th("mainNav")}</SheetTitle>
                <SheetDescription className="sr-only">{th("mainNav")}</SheetDescription>
                <nav
                  className="mt-1 flex flex-col gap-0"
                  aria-label={th("mainNav")}
                >
                  {nav.map((item, index) => {
                    const Icon = item.Icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-2 text-[15px] font-semibold leading-snug text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
                              navIconTileClass(index),
                            )}
                            aria-hidden
                          >
                            <Icon className="size-4" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">{t(item.labelKey)}</span>
                        </span>
                        <ChevronRight className="size-3.5 shrink-0 text-gray-300 opacity-70" aria-hidden />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <LocaleSwitcherDropdown
              variant="desktop"
              pathname={pathname}
              langNavLabel={th("langNav")}
            />
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {th("ctaStart")}
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LocaleSwitcherDropdown
              variant="mobile"
              pathname={pathname}
              langNavLabel={th("langNav")}
            />
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-900/[0.04] transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {th("ctaStart")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
