import Image from "next/image";
import type { ReactNode } from "react";
import { Clock3, Package, Settings2, ShoppingBag, Store } from "lucide-react";

import { cn } from "@/lib/utils";

export function VendorPendingFullscreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center px-2 py-10 sm:px-4">
      <div
        className={cn(
          "w-full max-w-xl rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/90 px-8 py-14 text-center shadow-sm",
          "dark:border-amber-900/45 dark:from-amber-950/40 dark:via-zinc-950 dark:to-orange-950/25",
        )}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-inner dark:bg-amber-950/80 dark:text-amber-200">
          <Clock3 className="size-8" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="text-lg font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">
          {message}
        </p>
      </div>
    </div>
  );
}

export function VendorRejectedNotice({ message }: { message: string }) {
  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center px-2 py-10 sm:px-4">
      <div
        role="alert"
        className={cn(
          "rounded-2xl border border-red-300/95 bg-red-50 px-6 py-5 text-sm leading-relaxed text-red-950 shadow-sm",
          "dark:border-red-800/80 dark:bg-red-950/45 dark:text-red-50",
        )}
      >
        {message}
      </div>
    </div>
  );
}

type ApprovedProps = {
  storeName: string;
  locationRow: string | null;
  logoUrl: string | null;
  logoAlt: string;
  cardProducts: string;
  cardOrders: string;
  cardSettings: string;
};

export function VendorApprovedDashboard({
  storeName,
  locationRow,
  logoUrl,
  logoAlt,
  cardProducts,
  cardOrders,
  cardSettings,
}: ApprovedProps) {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5 border-b border-zinc-200 pb-8 dark:border-zinc-800 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={logoUrl.includes("localhost")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              <Store className="size-10" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {storeName}
          </h1>
          {locationRow ? (
            <p className="mt-2 text-sm text-muted-foreground">{locationRow}</p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <VendorPlaceholderCard
          icon={<Package className="size-5" />}
          label={cardProducts}
        />
        <VendorPlaceholderCard
          icon={<ShoppingBag className="size-5" />}
          label={cardOrders}
        />
        <VendorPlaceholderCard
          icon={<Settings2 className="size-5" />}
          label={cardSettings}
        />
      </div>
    </div>
  );
}

function VendorPlaceholderCard({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-zinc-200/95 bg-zinc-50/80 px-5 py-6",
        "dark:border-zinc-800 dark:bg-zinc-900/35",
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
        {icon}
      </div>
      <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
        {label}
      </p>
    </div>
  );
}
