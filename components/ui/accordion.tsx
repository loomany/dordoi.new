"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("space-y-2", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm dark:border-zinc-700 dark:bg-zinc-950",
        className,
      )}
      {...props}
    />
  );
}

function AccordionHeader({
  className,
  ...props
}: AccordionPrimitive.Header.Props) {
  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className={cn("flex", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        "flex flex-1 cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--d-card-accent)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-ring/40 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className="size-4 text-muted-foreground transition-transform duration-200 data-[panel-open]:rotate-180"
        aria-hidden
      />
    </AccordionPrimitive.Trigger>
  );
}

function AccordionContent({
  className,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden border-t border-border px-4 pb-4 pt-2 text-sm dark:border-zinc-700",
        className,
      )}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent };
