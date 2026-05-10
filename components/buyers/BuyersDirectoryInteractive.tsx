"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { BuyerCard } from "@/components/buyers/BuyerCard";
import { BUYERS } from "@/data/buyers-directory";
import type { BuyerCategoryId } from "@/data/buyers-directory";

const CATEGORIES: Array<BuyerCategoryId | "all"> = [
  "all",
  "mens",
  "textile",
  "electronics",
];

const inputClassName =
  "w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none ring-orange-200 transition-shadow focus:border-orange-300 focus:ring-2 focus:ring-orange-200/60";

const selectClassName =
  "w-full min-h-11 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200/60";

export function BuyersDirectoryInteractive() {
  const t = useTranslations("Pages.buyers");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BuyerCategoryId | "all">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BUYERS.filter((b) => {
      if (category !== "all" && b.category !== category) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const blob = [b.name, b.specialization, b.description, ...b.services]
        .join("\n")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [query, category]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex min-h-11 flex-1 items-center">
          <span className="sr-only">{t("searchLabel")}</span>
          <span className="pointer-events-none absolute left-4 text-gray-400">
            <Search className="size-4 stroke-[1.5]" aria-hidden />
          </span>
          <input
            type="search"
            name="buyers-q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className={inputClassName}
            autoComplete="off"
          />
        </label>

        <div className="relative w-full min-w-0 sm:w-80">
          <label className="sr-only" htmlFor="buyers-specialization">
            {t("specializationLabel")}
          </label>
          <select
            id="buyers-specialization"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as BuyerCategoryId | "all")
            }
            className={selectClassName}
            aria-label={t("specializationLabel")}
          >
            {CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {id === "all" ? t("filterAll") : t(`filterOptions.${id}`)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
        </div>
      </div>

      <section
        className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        aria-label={t("gridAria")}
      >
        {filtered.map((b) => (
          <BuyerCard
            key={b.id}
            buyer={b}
            strings={{
              badgeVerified: t("badgeVerified"),
              experienceLine: t("experience", { years: b.experienceYears }),
              ordersLine: t("orders", { count: b.completedOrdersDisplay }),
              ctaContact: t("ctaContact"),
            }}
          />
        ))}
      </section>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-500">{t("noResults")}</p>
      ) : null}
    </>
  );
}
