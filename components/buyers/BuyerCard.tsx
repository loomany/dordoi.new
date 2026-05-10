import Image from "next/image";
import { Check, Send } from "lucide-react";
import type { BuyerProfile } from "@/data/buyers-directory";
import { cn } from "@/lib/utils";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export type BuyerCardStrings = {
  verifiedBadgeAria: string;
  experienceLine: string;
  ordersLine: string;
  ctaContact: string;
  ctaTelegram: string;
  ctaInstagram: string;
};

type Props = {
  buyer: BuyerProfile;
  strings: BuyerCardStrings;
  className?: string;
};

const waBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2";

const socialBtn =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 sm:gap-2 sm:text-sm";

export function BuyerCard({ buyer, strings, className }: Props) {
  const waHref = `https://wa.me/${buyer.whatsappDigits}`;

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
            {buyer.name}
          </h2>
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

      <div className="mt-auto space-y-3 pt-7">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={waBtn}
        >
          {strings.ctaContact}
        </a>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={buyer.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={socialBtn}
          >
            <Send className="size-3.5 shrink-0 sm:size-4" strokeWidth={2.25} />
            <span className="truncate">{strings.ctaTelegram}</span>
          </a>
          <a
            href={buyer.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={socialBtn}
          >
            <InstagramGlyph className="size-3.5 shrink-0 sm:size-4" />
            <span className="truncate">{strings.ctaInstagram}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
