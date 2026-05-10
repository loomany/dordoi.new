import Image from "next/image";
import { Check } from "lucide-react";
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
  className?: string;
};

export function BuyerCard({ buyer, profile, strings, className }: Props) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_48px_rgba(15,23,42,0.06)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_64px_-16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <Image
            src={buyer.photoSrc}
            alt={profile.name}
            width={80}
            height={80}
            className="size-20 rounded-2xl object-cover shadow-md ring-[3px] ring-slate-100"
            sizes="80px"
          />
          <span
            className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-[22px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-[3px] ring-white"
            aria-label={strings.verifiedBadgeAria}
            role="img"
          >
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {profile.name}
          </h2>
          <p className="mt-2 text-sm font-medium leading-snug text-slate-600">
            {profile.specialization}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-slate-500">
        {profile.description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
        {profile.services.map((s, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/80"
              aria-hidden
            />
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl bg-slate-50/90 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-100/80">
        <p className="font-medium">{strings.experienceLine}</p>
        <p className="mt-1">{strings.ordersLine}</p>
      </div>

      <BuyerCardContactStrip strings={strings} />
    </article>
  );
}
