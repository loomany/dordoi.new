"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  avatar: ReactNode;
  title: string;
  subtitle?: string | null;
  unlockLabel: string;
  onUnlock: () => void;
  titleReserveRight?: string;
  className?: string;
};

/**
 * SaaS-paywall: логотип + заголовок + подзаголовок сильно размыты (как inline blur в референсе),
 * поверх — лёгкая вуаль; замок остаётся чётким.
 */
export function CatalogLockedStoreHeader({
  avatar,
  title,
  subtitle,
  unlockLabel,
  onUnlock,
  titleReserveRight,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onUnlock();
      }}
      aria-label={unlockLabel}
      className={cn("relative block w-full min-w-0 text-left", className)}
    >
      <div className="relative overflow-hidden rounded-xl">
        <header
          className={cn(
            "relative flex w-full min-w-0 gap-3 select-none",
            titleReserveRight,
          )}
          style={{
            filter: "blur(16px)",
            WebkitFilter: "blur(16px)",
            transform: "scale(1.04)",
            transformOrigin: "left center",
          }}
          aria-hidden
        >
          <div className="shrink-0 pt-0.5">{avatar}</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold uppercase leading-[1.2] tracking-tight text-card-foreground sm:text-base">
              {title}
            </h2>
            {subtitle?.trim() ? (
              <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                {subtitle.trim()}
              </p>
            ) : (
              <p className="mt-0.5 h-[1.125rem]" />
            )}
          </div>
        </header>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAFAF8]/55 via-white/35 to-[#FAFAF8]/50"
          aria-hidden
        />

        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--d-card-accent)_30%,transparent)] bg-white/95 text-[var(--d-card-accent)] shadow-sm ring-1 ring-[color-mix(in_oklch,var(--d-card-accent)_14%,transparent)]">
            <Lock className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
        </span>
      </div>
    </button>
  );
}
