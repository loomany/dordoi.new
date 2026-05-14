"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCatalogBrowseRefreshOptional } from "@/components/catalog/CatalogBrowseRefreshContext";
import { cn } from "@/lib/utils";

export function CatalogBrowseRefreshStatus({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("Pages.catalogBrowse");
  const refresh = useCatalogBrowseRefreshOptional();
  const isRefreshing = refresh?.isRefreshing ?? false;

  if (!isRefreshing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-t border-border/60 px-4 py-8 text-center sm:py-10",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_7%,white)] text-[var(--d-card-accent)] shadow-sm">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("categoryFilterApplying")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("categoryFilterApplyingHint")}
        </p>
      </div>
    </div>
  );
}

export function CatalogBrowseResultsDim({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const refresh = useCatalogBrowseRefreshOptional();
  const isRefreshing = refresh?.isRefreshing ?? false;

  return (
    <div
      className={cn(
        "transition-opacity duration-300 motion-reduce:transition-none",
        isRefreshing && "pointer-events-none opacity-55",
        className,
      )}
      aria-busy={isRefreshing || undefined}
    >
      {children}
    </div>
  );
}
