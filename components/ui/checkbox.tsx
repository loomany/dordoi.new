"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-flex size-4 shrink-0 items-center justify-center rounded border border-border bg-background outline-none transition-[border-color,background-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-[color-mix(in_oklch,var(--d-card-accent)_55%,transparent)] data-checked:bg-[color-mix(in_oklch,var(--d-card-accent)_18%,transparent)] data-checked:text-foreground dark:data-checked:border-primary/50 dark:data-checked:bg-primary/25",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex text-current [[data-checked]_&]:opacity-100 [[data-unchecked]_&]:opacity-0"
      >
        <Check className="size-3 stroke-[2.5]" aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
