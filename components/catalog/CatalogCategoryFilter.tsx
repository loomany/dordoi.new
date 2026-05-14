"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutGrid, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCatalogBrowseRefreshOptional } from "@/components/catalog/CatalogBrowseRefreshContext";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  CATALOG_CATEGORY_TREE,
  localizeCategoryTree,
  type LocalizedCatalogMainCategory,
} from "@/lib/constants/categories";
import {
  catalogFilterSlugsToMainIds,
  normalizeCatalogCategorySlugs,
} from "@/lib/catalog/catalog-category-filter";
import { catalogQueryParsers } from "@/lib/catalog/catalog-query-parsers";
import { cn } from "@/lib/utils";

const MD_MIN = 768;

function useIsDesktopMd() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | null>(null);
  React.useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isDesktop;
}

type MainRow = { id: string; emoji: string; title: string };

function mainsFromLocalizedTree(tree: LocalizedCatalogMainCategory[]): MainRow[] {
  return tree.map((m) => ({ id: m.id, emoji: m.emoji, title: m.title }));
}

function filterMains(query: string, mains: MainRow[]): MainRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return mains;
  return mains.filter(
    (m) => m.title.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
  );
}

function MainCategoryCheckRow({
  row,
  checked,
  onToggle,
  largeTouch,
}: {
  row: MainRow;
  checked: boolean;
  onToggle: (next: boolean) => void;
  largeTouch?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)] hover:bg-[color-mix(in_oklch,var(--d-card-accent)_6%,transparent)]",
        largeTouch && "min-h-12 items-center py-3",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className="mt-0.5"
        aria-label={row.title}
      />
      <span className="flex min-w-0 items-start gap-2 leading-snug">
        <span className="shrink-0 text-base" aria-hidden>
          {row.emoji}
        </span>
        <span className="min-w-0 text-sm text-foreground">{row.title}</span>
      </span>
    </label>
  );
}

type FilterPanelProps = {
  search: string;
  onSearchChange: (v: string) => void;
  mains: MainRow[];
  draft: Set<string>;
  toggleDraft: (id: string, checked: boolean) => void;
  onResetDraft: () => void;
  onApply: () => void;
  applyLabel: string;
  applyingLabel: string;
  applyPending?: boolean;
  resetLabel: string;
  searchPlaceholder: string;
  noMatchesLabel: string;
  /** Bottom sheet — крупнее тач и нижняя панель с тенью */
  sheetLayout?: boolean;
};

function FilterPanel({
  search,
  onSearchChange,
  mains,
  draft,
  toggleDraft,
  onResetDraft,
  onApply,
  applyLabel,
  applyingLabel,
  applyPending = false,
  resetLabel,
  searchPlaceholder,
  noMatchesLabel,
  sheetLayout,
}: FilterPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className={cn(
          "relative shrink-0",
          sheetLayout ? "px-3 pt-3" : "border-b border-border/60 px-4 pt-4",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 text-muted-foreground",
            sheetLayout ? "left-6" : "left-7",
          )}
        >
          <Search className="size-4 stroke-[1.5]" aria-hidden />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)]"
          autoComplete="off"
        />
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2",
          sheetLayout ? "px-3" : "px-2",
        )}
      >
        {mains.length > 0 ? (
          <div className="flex flex-col gap-1 pt-1">
            {mains.map((row) => (
              <MainCategoryCheckRow
                key={row.id}
                row={row}
                checked={draft.has(row.id)}
                onToggle={(next) => toggleDraft(row.id, next)}
                largeTouch={Boolean(sheetLayout)}
              />
            ))}
          </div>
        ) : (
          <p className={cn("text-sm text-muted-foreground", sheetLayout ? "px-3" : "px-2")}>
            {noMatchesLabel}
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card py-3",
          sheetLayout
            ? "sticky bottom-0 z-[1] px-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]"
            : "px-4",
        )}
      >
        <Button type="button" variant="outline" size="sm" onClick={onResetDraft} disabled={applyPending}>
          {resetLabel}
        </Button>
        <Button type="button" size="sm" onClick={onApply} disabled={applyPending}>
          {applyPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              {applyingLabel}
            </>
          ) : (
            applyLabel
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Фильтр по основным категориям: кнопка в одной строке с поиском.
 * Desktop — Popover со списком; mobile — bottom sheet.
 */
export function CatalogCategoryFilter() {
  const t = useTranslations("Pages.catalogBrowse");
  const tTree = useTranslations("catalogCategoryTree");
  const localizedTree = React.useMemo(
    () => localizeCategoryTree(CATALOG_CATEGORY_TREE, tTree),
    [tTree],
  );
  const allMains = React.useMemo(() => mainsFromLocalizedTree(localizedTree), [localizedTree]);

  const [{ cat }, setCatalogQuery] = useQueryStates(catalogQueryParsers, {
    history: "push",
  });

  const applied = React.useMemo(() => normalizeCatalogCategorySlugs(cat ?? []), [cat]);
  const appliedMainIds = React.useMemo(
    () => [...catalogFilterSlugsToMainIds(applied)],
    [applied],
  );
  const appliedCount = appliedMainIds.length;

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState<Set<string>>(() => new Set(appliedMainIds));

  const filteredMains = React.useMemo(
    () => filterMains(search, allMains),
    [search, allMains],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация с URL после навигации / смены `?cat=`.
    setDraft(new Set(appliedMainIds));
  }, [appliedMainIds]);

  const handleFilterOpenChange = React.useCallback(
    (open: boolean) => {
      setFilterOpen(open);
      setSearch("");
      if (open) {
        setDraft(new Set(appliedMainIds));
      }
    },
    [appliedMainIds],
  );

  const toggleDraft = React.useCallback((id: string, checked: boolean) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const refresh = useCatalogBrowseRefreshOptional();
  const isApplying = refresh?.isRefreshing ?? false;

  const apply = React.useCallback(() => {
    const next = normalizeCatalogCategorySlugs([...draft]);
    const unchanged =
      next.length === applied.length && next.every((id) => applied.includes(id));
    if (!unchanged) {
      refresh?.beginRefresh();
    }
    void setCatalogQuery(
      {
        cat: next.length > 0 ? next : null,
        page: null,
      },
      { shallow: false },
    );
    handleFilterOpenChange(false);
  }, [draft, setCatalogQuery, handleFilterOpenChange, refresh, applied]);

  const resetDraft = React.useCallback(() => {
    setDraft(new Set());
  }, []);

  const triggerClass = cn(
    "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)] hover:bg-[color-mix(in_oklch,var(--d-card-accent)_8%,transparent)] md:w-auto",
    filterOpen && "border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_8%,transparent)]",
  );

  const triggerInner = (
    <>
      <LayoutGrid className="size-4 text-gray-500" aria-hidden />
      {appliedCount > 0
        ? t("categoriesWithCount", { count: appliedCount })
        : t("categories")}
      <ChevronDown className="size-4 text-gray-400" aria-hidden />
    </>
  );

  const isDesktopMq = useIsDesktopMd();
  if (isDesktopMq === null) {
    return <CatalogCategoryFilterFallback />;
  }

  const isDesktop = isDesktopMq;

  const panelPropsBase = {
    search,
    onSearchChange: setSearch,
    mains: filteredMains,
    draft,
    toggleDraft,
    onResetDraft: resetDraft,
    onApply: apply,
    applyPending: isApplying,
    applyingLabel: t("categoryFilterApplyingShort"),
    resetLabel: t("categoryFilterReset"),
    searchPlaceholder: t("categoryFilterSearchPlaceholder"),
    noMatchesLabel: t("categoryFilterNoMatches"),
  };

  if (isDesktop) {
    return (
      <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
        <PopoverTrigger className={triggerClass} nativeButton>
          {triggerInner}
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner side="bottom" align="start" sideOffset={10}>
            <PopoverContent className="flex w-[min(100vw-2rem,22rem)] max-w-[22rem] flex-col overflow-hidden p-0 shadow-2xl">
              <FilterPanel
                {...panelPropsBase}
                applyLabel={t("categoryFilterApply")}
                sheetLayout={false}
              />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverPortal>
      </Popover>
    );
  }

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setFilterOpen(true)}>
        {triggerInner}
      </button>
      <Sheet open={filterOpen} onOpenChange={handleFilterOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton
          className={cn(
            "h-[100dvh] max-h-[100dvh] gap-0 rounded-t-2xl p-0",
            "data-[side=bottom]:data-ending-style:translate-y-0 data-[side=bottom]:data-starting-style:translate-y-0",
            "data-[side=bottom]:transition-opacity data-[side=bottom]:duration-200",
          )}
        >
          <AnimatePresence mode="wait">
            {filterOpen ? (
              <motion.div
                key="catalog-cat-sheet"
                initial={{ opacity: 0.88, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.92, y: 10 }}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <SheetHeader className="shrink-0 border-b border-border pb-2 text-left">
                  <SheetTitle className="text-base font-semibold">{t("categories")}</SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <FilterPanel
                    {...panelPropsBase}
                    applyLabel={t("categoryFilterShowResults")}
                    sheetLayout
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CatalogCategoryFilterFallback() {
  const t = useTranslations("Pages.catalogBrowse");
  return (
    <button
      type="button"
      disabled
      className="inline-flex min-h-11 w-full shrink-0 cursor-wait items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium opacity-70 md:w-auto"
    >
      <LayoutGrid className="size-4 text-gray-500" aria-hidden />
      {t("categories")}
      <ChevronDown className="size-4 text-gray-400" aria-hidden />
    </button>
  );
}
