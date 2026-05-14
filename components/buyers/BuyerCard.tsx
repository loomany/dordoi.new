import Image from "next/image";
import { Check, UserPlus } from "lucide-react";
import type { CatalogAccessPaywallCopy } from "@/components/catalog/CatalogAccessPaywallModal";
import type { BuyerDirectoryRow } from "@/data/buyers-directory";
import {
  BuyerCardContactStrip,
  type BuyerCardContactStripStrings,
} from "@/components/buyers/BuyerCardContactStrip";
import { cn } from "@/lib/utils";

export type BuyerCardStrings = BuyerCardContactStripStrings & {
  verifiedBadgeAria: string;
  experienceLine: string;
  ordersLine: string;
  openSlotBadge: string;
  openSlotBadgeAria: string;
};

/** Localized copy from `Pages.buyers.cards.<id>` */
export type BuyerCardProfileText = {
  name: string;
  specialization: string;
  description: string;
  services: string[];
};

type Props = {
  buyer: BuyerDirectoryRow;
  profile: BuyerCardProfileText;
  strings: BuyerCardStrings;
  contactsUnlocked?: boolean;
  paywallCopy?: CatalogAccessPaywallCopy;
  className?: string;
};

export function BuyerCard({
  buyer,
  profile,
  strings,
  contactsUnlocked = false,
  paywallCopy,
  className,
}: Props) {
  const isOpenSlot = Boolean(buyer.openSlot);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl p-8 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5",
        isOpenSlot
          ? "border-2 border-dashed border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 via-white to-white shadow-[0_1px_2px_rgba(16,185,129,0.06),0_18px_48px_rgba(16,185,129,0.08)] hover:border-emerald-300 hover:shadow-[0_24px_64px_-16px_rgba(16,185,129,0.14)]"
          : "border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_64px_-16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="relative shrink-0">
          {isOpenSlot ? (
            <div
              className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/80 text-emerald-600 shadow-sm ring-[3px] ring-white"
              aria-hidden
            >
              <UserPlus className="size-9" strokeWidth={1.75} />
            </div>
          ) : buyer.initialsLabel ? (
            <div
              className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-md ring-[3px] ring-slate-100"
              aria-hidden
            >
              {buyer.initialsLabel}
            </div>
          ) : buyer.photoSrc ? (
            <Image
              src={buyer.photoSrc}
              alt={profile.name}
              width={80}
              height={80}
              className="size-20 rounded-2xl object-cover shadow-md ring-[3px] ring-slate-100"
              sizes="80px"
            />
          ) : null}
          {!isOpenSlot ? (
            <span
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-[22px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-[3px] ring-white"
              aria-label={strings.verifiedBadgeAria}
              role="img"
            >
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          {isOpenSlot ? (
            <span
              className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800"
              aria-label={strings.openSlotBadgeAria}
            >
              {strings.openSlotBadge}
            </span>
          ) : null}
          <h2
            className={cn(
              "text-lg font-bold tracking-tight text-slate-900",
              isOpenSlot && "mt-2",
            )}
          >
            {profile.name}
          </h2>
          {!isOpenSlot ? (
            <p className="mt-2 text-sm font-medium leading-snug text-slate-600">
              {profile.specialization}
            </p>
          ) : null}
        </div>
      </div>

      <p
        className={cn(
          "mt-5 text-sm leading-relaxed",
          isOpenSlot ? "text-slate-600" : "text-slate-500",
        )}
      >
        {profile.description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
        {profile.services.map((s, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className={cn(
                "mt-2 size-1.5 shrink-0 rounded-full",
                isOpenSlot ? "bg-emerald-500/80" : "bg-primary/80",
              )}
              aria-hidden
            />
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ul>

      {isOpenSlot ? (
        <div
          className="mt-5 rounded-xl bg-transparent px-4 py-3 text-xs opacity-0"
          aria-hidden
        >
          <p className="font-medium">{strings.experienceLine}</p>
          <p className="mt-1">{strings.ordersLine}</p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-slate-50/90 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-100/80">
          <p className="font-medium">{strings.experienceLine}</p>
          <p className="mt-1">{strings.ordersLine}</p>
        </div>
      )}

      <BuyerCardContactStrip
        buyer={buyer}
        strings={strings}
        contactsUnlocked={contactsUnlocked}
        paywallCopy={paywallCopy}
      />
    </article>
  );
}
