"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

import { useCatalogBrowseRefreshOptional } from "@/components/catalog/CatalogBrowseRefreshContext";
import { catalogQueryParsers } from "@/lib/catalog/catalog-query-parsers";
import { normalizeCatalogSearchQuery } from "@/lib/catalog/catalog-vendor-search";
import { cn } from "@/lib/utils";

export function CatalogBrowseSearchFallback() {
  const t = useTranslations("Pages.catalogBrowse");
  return (
    <label className="relative flex min-h-11 min-w-0 flex-1 items-center">
      <span className="sr-only">{t("searchLabel")}</span>
      <span className="pointer-events-none absolute left-4 text-gray-400">
        <Search className="size-4 stroke-[1.5]" aria-hidden />
      </span>
      <input
        type="search"
        name="catalog-q"
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        disabled
        className="w-full cursor-wait rounded-full border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-card-foreground opacity-70 outline-none"
        autoComplete="off"
      />
    </label>
  );
}

export function CatalogBrowseSearch() {
  const t = useTranslations("Pages.catalogBrowse");
  const [{ search: appliedSearch }, setCatalogQuery] =
    useQueryStates(catalogQueryParsers);
  const refresh = useCatalogBrowseRefreshOptional();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const applied = normalizeCatalogSearchQuery(appliedSearch);
  const [draft, setDraft] = React.useState(applied);

  React.useEffect(() => {
    setDraft(applied);
  }, [applied]);

  React.useEffect(() => {
    setIsSubmitting(false);
  }, [applied]);

  const submit = React.useCallback(() => {
    const next = normalizeCatalogSearchQuery(draft);
    if (next === applied) return;
    setIsSubmitting(true);
    refresh?.beginRefresh();
    void setCatalogQuery(
      {
        search: next || null,
        page: null,
      },
      { shallow: false },
    );
  }, [draft, applied, setCatalogQuery, refresh]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const isSearching = isSubmitting;

  return (
    <label className="relative flex min-h-11 min-w-0 flex-1 items-center">
      <span className="sr-only">{t("searchLabel")}</span>
      {isSearching ? (
        <span className="sr-only" role="status" aria-live="polite">
          {t("searchApplyingHint")}
        </span>
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute left-4 z-10",
          isSearching ? "text-[var(--d-card-accent)]" : "text-gray-400",
        )}
      >
        {isSearching ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Search className="size-4 stroke-[1.5]" aria-hidden />
        )}
      </span>
      <input
        type="search"
        name="catalog-q"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        aria-busy={isSearching || undefined}
        className={cn(
          "w-full rounded-full border border-border bg-card py-2.5 pl-11 text-sm text-card-foreground placeholder:text-muted-foreground/70 outline-none transition-[border-color,background-color,box-shadow,padding] duration-200 focus:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)]",
          isSearching
            ? "border-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_5%,white)] pr-[5.5rem]"
            : "pr-4",
        )}
        autoComplete="off"
      />
      <span
        className={cn(
          "pointer-events-none absolute right-4 z-10 text-xs font-medium text-[var(--d-card-accent)] transition-opacity duration-200",
          isSearching ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={!isSearching}
      >
        {t("searchApplyingShort")}
      </span>
    </label>
  );
}
