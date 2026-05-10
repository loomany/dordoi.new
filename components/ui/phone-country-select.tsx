"use client";

import { Select } from "@base-ui/react/select";
import { ChevronDownIcon } from "lucide-react";

import {
  PHONE_COUNTRY_ORDER,
  countrySelectLabel,
  type PhoneCountryId,
} from "@/lib/phone-country";
import { cn } from "@/lib/utils";

const triggerClass = cn(
  "flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl border border-zinc-200/95 bg-white px-2 text-left text-sm font-medium text-zinc-900 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 sm:gap-2 sm:px-3",
  "outline-none hover:border-zinc-300 hover:bg-zinc-50/90 hover:shadow-sm",
  "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/25",
  "data-[popup-open]:border-zinc-300 data-[popup-open]:shadow-md",
  "disabled:pointer-events-none disabled:opacity-50",
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900",
);

const popupClass = cn(
  "z-[100] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-zinc-200/95 bg-white py-1 shadow-xl shadow-zinc-950/[0.08] ring-1 ring-zinc-950/[0.04] transition-[opacity,transform] duration-200 ease-out",
  "dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/[0.06]",
);

const itemClass = cn(
  "flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none transition-colors duration-150",
  "data-highlighted:bg-zinc-100 data-highlighted:text-zinc-950",
  "data-selected:bg-sky-50 data-selected:font-medium data-selected:text-sky-950",
  "dark:text-zinc-200 dark:data-highlighted:bg-zinc-800 dark:data-highlighted:text-white",
  "dark:data-selected:bg-sky-950/40 dark:data-selected:text-sky-50",
);

export function PhoneCountrySelect({
  id,
  value,
  onValueChange,
  disabled,
  "aria-label": ariaLabel,
  className,
}: {
  id?: string;
  value: PhoneCountryId;
  onValueChange: (next: PhoneCountryId) => void;
  disabled?: boolean;
  "aria-label": string;
  /** Доп. классы на триггер (ширина задаётся родителем на мобильных). */
  className?: string;
}) {
  return (
    <Select.Root
      id={id}
      value={value}
      onValueChange={(v) => {
        if (v != null) onValueChange(v as PhoneCountryId);
      }}
      disabled={disabled}
      modal={false}
    >
      <Select.Trigger aria-label={ariaLabel} className={cn(triggerClass, className)}>
        <span className="block min-w-0 flex-1 truncate tabular-nums">
          <Select.Value>
            {(v: PhoneCountryId | null) => (v ? countrySelectLabel(v) : "")}
          </Select.Value>
        </span>
        <Select.Icon className="shrink-0 text-zinc-400">
          <ChevronDownIcon className="size-4 opacity-80" aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="z-[100] isolate outline-none"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          collisionAvoidance={{ side: "flip", align: "shift" }}
        >
          <Select.Popup className={popupClass}>
            <Select.List className="max-h-[min(18rem,50vh)] overflow-y-auto p-1 outline-none">
              {PHONE_COUNTRY_ORDER.map((cid) => (
                <Select.Item
                  key={cid}
                  value={cid}
                  className={itemClass}
                  label={countrySelectLabel(cid)}
                >
                  <Select.ItemText>{countrySelectLabel(cid)}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
