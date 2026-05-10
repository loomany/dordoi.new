import Image from "next/image";
import { Star } from "lucide-react";
import type { BuyerProfile } from "@/data/buyers-directory";
import { cn } from "@/lib/utils";

export type BuyerCardStrings = {
  badgeVerified: string;
  experienceLine: string;
  ordersLine: string;
  ctaContact: string;
};

type Props = {
  buyer: BuyerProfile;
  strings: BuyerCardStrings;
  className?: string;
};

const waBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2";

export function BuyerCard({ buyer, strings, className }: Props) {
  const waHref = `https://wa.me/${buyer.whatsappDigits}`;
  const ratingStr =
    buyer.rating % 1 === 0 ? buyer.rating.toFixed(1) : String(buyer.rating);

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
            alt={buyer.name}
            width={80}
            height={80}
            className="size-20 rounded-2xl object-cover shadow-md ring-[3px] ring-slate-100"
            sizes="80px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              {buyer.name}
            </h2>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                {strings.badgeVerified}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100/80">
                <Star
                  className="size-3.5 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                {ratingStr}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium leading-snug text-slate-600">
            {buyer.specialization}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-slate-500">
        {buyer.description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
        {buyer.services.map((s) => (
          <li key={s} className="flex gap-2.5">
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

      <div className="mt-auto pt-7">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={waBtn}
        >
          {strings.ctaContact}
        </a>
      </div>
    </article>
  );
}
