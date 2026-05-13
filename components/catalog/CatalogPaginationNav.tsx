"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useIsCatalogMobile } from "@/components/catalog/use-is-catalog-mobile";
import { buildCatalogBrowsePath } from "@/lib/catalog/catalog-browse-path";

type CatalogPaginationItem = number | "ellipsis";

function getCatalogPaginationItems(
  totalPages: number,
  currentPage: number,
  opts: { leadingPages: number; delta: number },
): CatalogPaginationItem[] {
  const { leadingPages, delta } = opts;
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const range: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === totalPages ||
      i <= leadingPages ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }
  const out: CatalogPaginationItem[] = [];
  let prev: number | undefined;
  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        out.push(prev + 1);
      } else if (i - prev > 2) {
        out.push("ellipsis");
      }
    }
    out.push(i);
    prev = i;
  }
  return out;
}

type Props = {
  totalPages: number;
  currentPage: number;
  categorySlugs: string[];
  compareWithPreview?: boolean;
  locale: string;
};

export function CatalogPaginationNav({
  totalPages,
  currentPage,
  categorySlugs,
  compareWithPreview = false,
  locale,
}: Props) {
  const t = useTranslations("Pages.catalogBrowse");
  const isMobile = useIsCatalogMobile();
  const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const pathOpts = useMemo(
    () => ({ categorySlugs, compareWithPreview }),
    [categorySlugs, compareWithPreview],
  );
  const items = getCatalogPaginationItems(totalPages, currentPage, {
    leadingPages: isMobile ? 4 : 7,
    delta: isMobile ? 0 : 1,
  });

  return (
    <nav
      className="flex flex-nowrap items-center justify-center gap-0.5 pt-6 lg:gap-1.5 lg:pt-10"
      aria-label={t("paginationNavAria")}
    >
      <Link
        href={buildCatalogBrowsePath({ page: Math.max(1, currentPage - 1), ...pathOpts })}
        aria-disabled={currentPage === 1}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground lg:h-9 lg:w-auto lg:px-2",
          currentPage === 1 && "pointer-events-none opacity-45",
        )}
      >
        <ChevronLeft className="size-3.5 lg:size-4" aria-hidden />
        <span className="sr-only">{t("paginationPrev")}</span>
      </Link>

      <div className="flex min-w-0 flex-nowrap items-center justify-center gap-0.5 lg:gap-1.5">
        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className="inline-flex h-7 shrink-0 select-none items-center px-0.5 text-xs text-muted-foreground/80 lg:h-9 lg:px-1 lg:text-sm"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildCatalogBrowsePath({ page: item, ...pathOpts })}
              aria-current={item === currentPage ? "page" : undefined}
              className={cn(
                "inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border px-1 text-xs font-medium tabular-nums transition-colors lg:h-9 lg:min-w-9 lg:px-2 lg:text-sm",
                item === currentPage
                  ? "border-primary/35 bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-card text-card-foreground shadow-sm hover:bg-muted/50",
              )}
            >
              {nf.format(item)}
            </Link>
          ),
        )}
      </div>

      <Link
        href={buildCatalogBrowsePath({
          page: Math.min(totalPages, currentPage + 1),
          ...pathOpts,
        })}
        aria-disabled={currentPage === totalPages}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground lg:h-9 lg:w-auto lg:px-2",
          currentPage === totalPages && "pointer-events-none opacity-45",
        )}
      >
        <ChevronRight className="size-3.5 lg:size-4" aria-hidden />
        <span className="sr-only">{t("paginationNext")}</span>
      </Link>
    </nav>
  );
}
