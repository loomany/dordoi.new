"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />;
}

function PopoverPositioner({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  ...props
}: PopoverPrimitive.Positioner.Props) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      className={cn("z-50 outline-none", className)}
      side={side}
      align={align}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function PopoverContent({
  className,
  ...props
}: PopoverPrimitive.Popup.Props) {
  return (
    <PopoverPrimitive.Popup
      data-slot="popover-content"
      className={cn(
        "z-50 w-[min(90vw,56rem)] max-h-[min(70vh,32rem)] overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl shadow-zinc-950/10 ring-1 ring-zinc-950/[0.04] outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/[0.06]",
        className,
      )}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-heading text-sm font-semibold", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
};
