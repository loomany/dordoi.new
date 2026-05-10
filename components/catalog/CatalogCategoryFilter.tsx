"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutGrid, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { normalizeCatalogCategorySlugs } from "@/lib/catalog/catalog-category-filter";
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

function filterTree(
  query: string,
  tree: LocalizedCatalogMainCategory[],
): LocalizedCatalogMainCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return tree;
  }
  const out: LocalizedCatalogMainCategory[] = [];
  for (const main of tree) {
    const mainHit =
      main.title.toLowerCase().includes(q) ||
      main.id.toLowerCase().includes(q);
    const subs = main.subcategories.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        mainHit,
    );
    if (subs.length > 0) {
      out.push({ ...main, subcategories: subs });
    }
  }
  return out;
}

function SubcategoryRow({
  label,
  checked,
  onToggle,
  largeTouch,
}: {
  label: string;
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
        aria-label={label}
      />
      <span className="text-sm leading-snug text-foreground">{label}</span>
    </label>
  );
}

function FilterInner({
  search,
  onSearchChange,
  filteredMains,
  activeMainId,
  onPickMain,
  draft,
  toggleDraft,
  onResetDraft,
  onApply,
  applyLabel,
  resetLabel,
  searchPlaceholder,
  mainCategoriesNavAria,
  noMatchesLabel,
  desktop,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filteredMains: LocalizedCatalogMainCategory[],
  activeMainId: string;
  onPickMain: (id: string) => void;
  draft: Set<string>;
  toggleDraft: (id: string, checked: boolean) => void;
  onResetDraft: () => void;
  onApply: () => void;
  applyLabel: string;
  resetLabel: string;
  searchPlaceholder: string;
  mainCategoriesNavAria: string;
  noMatchesLabel: string;
  desktop: boolean;
}) {
  const activeMain = filteredMains.find((m) => m.id === activeMainId) ?? filteredMains[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative shrink-0 px-3 pt-3 md:px-4 md:pt-4">
        <span className="pointer-events-none absolute left-6 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground md:left-7">
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

      {desktop ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,11rem)_1fr] divide-x divide-border overflow-hidden border-t border-border">
          <nav
            className="min-h-0 overflow-y-auto overscroll-contain py-2"
            aria-label={mainCategoriesNavAria}
          >
            {filteredMains.map((main) => {
              const active = main.id === activeMainId;
              return (
                <button
                  key={main.id}
                  type="button"
                  onClick={() => onPickMain(main.id)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "border-l-2 border-l-[color-mix(in_oklch,var(--d-card-accent)_55%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_10%,transparent)] font-medium"
                      : "border-l-2 border-l-transparent hover:bg-muted/60",
                  )}
                >
                  <span className="shrink-0" aria-hidden>
                    {main.emoji}
                  </span>
                  <span className="min-w-0 leading-snug">{main.title}</span>
                </button>
              );
            })}
          </nav>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-3 md:p-4">
            {activeMain ? (
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {activeMain.subcategories.map((sub) => (
                  <SubcategoryRow
                    key={sub.id}
                    label={sub.label}
                    checked={draft.has(sub.id)}
                    onToggle={(next) => toggleDraft(sub.id, next)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{noMatchesLabel}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
          <Accordion multiple defaultValue={[]}>
            {filteredMains.map((main) => (
              <AccordionItem key={main.id} value={main.id}>
                <AccordionHeader>
                  <AccordionTrigger>
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden>{main.emoji}</span>
                      <span className="min-w-0">{main.title}</span>
                    </span>
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent>
                  <div className="flex flex-col gap-1 pt-1">
                    {main.subcategories.map((sub) => (
                      <SubcategoryRow
                        key={sub.id}
                        label={sub.label}
                        checked={draft.has(sub.id)}
                        onToggle={(next) => toggleDraft(sub.id, next)}
                        largeTouch
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-3 py-3 md:px-4",
          !desktop && "sticky bottom-0 z-[1] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]",
        )}
      >
        <Button type="button" variant="outline" size="sm" onClick={onResetDraft}>
          {resetLabel}
        </Button>
        <Button type="button" size="sm" onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}

export function CatalogCategoryFilter() {
  const t = useTranslations("Pages.catalogBrowse");
  const tTree = useTranslations("catalogCategoryTree");
  const localizedTree = React.useMemo(
    () => localizeCategoryTree(CATALOG_CATEGORY_TREE, tTree),
    [tTree],
  );
  const isDesktopMq = useIsDesktopMd();
  const [{ cat }, setCatalogQuery] = useQueryStates(catalogQueryParsers, {
    history: "push",
  });

  const applied = React.useMemo(
    () => normalizeCatalogCategorySlugs(cat ?? []),
    [cat],
  );
  const appliedCount = applied.length;

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState<Set<string>>(() => new Set(applied));
  const [activeMainId, setActiveMainId] = React.useState(
    CATALOG_CATEGORY_TREE[0]?.id ?? "",
  );

  const filteredMains = React.useMemo(
    () => filterTree(search, localizedTree),
    [search, localizedTree],
  );

  const displayActiveMainId =
    filteredMains.find((m) => m.id === activeMainId)?.id ??
    filteredMains[0]?.id ??
    CATALOG_CATEGORY_TREE[0]?.id ??
    "";

  const handleFilterOpenChange = React.useCallback(
    (open: boolean) => {
      setFilterOpen(open);
      setSearch("");
      if (open) {
        setDraft(new Set(applied));
      }
    },
    [applied],
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

  const apply = React.useCallback(() => {
    const next = normalizeCatalogCategorySlugs([...draft]);
    void setCatalogQuery(
      {
        cat: next.length > 0 ? next : null,
        page: null,
      },
      { shallow: false },
    );
    handleFilterOpenChange(false);
  }, [draft, setCatalogQuery, handleFilterOpenChange]);

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

  if (isDesktopMq === null) {
    return <CatalogCategoryFilterFallback />;
  }

  const isDesktop = isDesktopMq;

  return (
    <>
      {isDesktop ? (
        <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
          <PopoverTrigger className={triggerClass} nativeButton>
            {triggerInner}
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverPositioner side="bottom" align="start" sideOffset={10}>
              <PopoverContent className="flex max-h-[min(78vh,36rem)] flex-col overflow-hidden p-0 shadow-2xl">
                <FilterInner
                  search={search}
                  onSearchChange={setSearch}
                  filteredMains={filteredMains}
                  activeMainId={displayActiveMainId}
                  onPickMain={setActiveMainId}
                  draft={draft}
                  toggleDraft={toggleDraft}
                  onResetDraft={resetDraft}
                  onApply={apply}
                  applyLabel={t("categoryFilterApply")}
                  resetLabel={t("categoryFilterReset")}
                  searchPlaceholder={t("categoryFilterSearchPlaceholder")}
                  mainCategoriesNavAria={t("categoryFilterMainCategoriesNav")}
                  noMatchesLabel={t("categoryFilterNoMatches")}
                  desktop
                />
              </PopoverContent>
            </PopoverPositioner>
          </PopoverPortal>
        </Popover>
      ) : (
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
                      <SheetTitle className="text-base font-semibold">
                        {t("categories")}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <FilterInner
                        search={search}
                        onSearchChange={setSearch}
                        filteredMains={filteredMains}
                        activeMainId={displayActiveMainId}
                        onPickMain={setActiveMainId}
                        draft={draft}
                        toggleDraft={toggleDraft}
                        onResetDraft={resetDraft}
                        onApply={apply}
                        applyLabel={t("categoryFilterShowResults")}
                        resetLabel={t("categoryFilterReset")}
                        searchPlaceholder={t("categoryFilterSearchPlaceholder")}
                        mainCategoriesNavAria={t("categoryFilterMainCategoriesNav")}
                        noMatchesLabel={t("categoryFilterNoMatches")}
                        desktop={false}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </SheetContent>
          </Sheet>
        </>
      )}
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
