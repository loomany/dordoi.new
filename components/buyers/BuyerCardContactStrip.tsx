"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import type { BuyerDirectoryRow } from "@/data/buyers-directory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const waBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2";

const contactFooter =
  "mt-auto flex min-h-[7.5rem] flex-col justify-end gap-3 pt-7";

const socialBtn =
  "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 sm:gap-2 sm:text-sm";

const callBtn = `${socialBtn} w-full py-3.5 text-sm`;

export type BuyerSpotModalStrings = {
  title: string;
  line1: string;
  telegramLabel: string;
};

export type BuyerCardContactStripStrings = {
  ctaContact: string;
  ctaWhatsApp: string;
  ctaCall: string;
  ctaClaimSpot: string;
  ctaTelegram: string;
  ctaInstagram: string;
  closeDialog: string;
  buyerSpotModal: BuyerSpotModalStrings;
};

const LOOMANY_TELEGRAM = "https://t.me/loomany";

type Props = {
  buyer: BuyerDirectoryRow;
  strings: BuyerCardContactStripStrings;
};

export function BuyerCardContactStrip({ buyer, strings }: Props) {
  const [open, setOpen] = useState(false);
  const m = strings.buyerSpotModal;
  const whatsappHref = `https://wa.me/${buyer.whatsappDigits}`;
  const telegramHref = buyer.telegramUrl?.trim() || null;
  const instagramHref = buyer.instagramUrl?.trim() || null;

  if (buyer.openSlot) {
    return (
      <>
        <div className={contactFooter}>
          <button type="button" onClick={() => setOpen(true)} className={waBtn}>
            {strings.ctaClaimSpot}
          </button>
          <div className={callBtn} aria-hidden>
            <span className="invisible">{strings.ctaCall}</span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            closeLabel={strings.closeDialog}
            className="border-slate-200/95 bg-white text-slate-900 sm:p-7"
          >
            <DialogHeader className="pr-10">
              <DialogTitle className="text-left text-base font-semibold leading-snug tracking-tight text-slate-900">
                {m.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              <p>{m.line1}</p>
              <p className="border-t border-slate-100 pt-3 text-slate-800">
                <span className="font-medium text-slate-700">
                  {m.telegramLabel}{" "}
                </span>
                <a
                  href={LOOMANY_TELEGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                >
                  @loomany
                </a>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (buyer.liveListing) {
    const callDigits =
      buyer.phoneDigits?.trim() || buyer.whatsappDigits?.trim() || "";
    const showStackedContactCall =
      Boolean(buyer.whatsappDigits?.trim()) &&
      callDigits.length > 0 &&
      !telegramHref &&
      !instagramHref;
    const hasSocialRow = Boolean(telegramHref || instagramHref);

    return (
      <div className={contactFooter}>
        {showStackedContactCall ? (
          <>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={waBtn}
            >
              {strings.ctaContact}
            </a>
            <a href={`tel:+${callDigits}`} className={callBtn}>
              {strings.ctaCall}
            </a>
          </>
        ) : (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={waBtn}
          >
            {strings.ctaContact}
          </a>
        )}
        {hasSocialRow ? (
          <div
            className={
              telegramHref ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"
            }
          >
            {telegramHref ? (
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className={socialBtn}
              >
                <Send
                  className="size-3.5 shrink-0 sm:size-4"
                  strokeWidth={2.25}
                />
                <span className="truncate">{strings.ctaTelegram}</span>
              </a>
            ) : null}
            {instagramHref ? (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className={socialBtn}
              >
                <InstagramGlyph className="size-3.5 shrink-0 sm:size-4" />
                <span className="truncate">{strings.ctaInstagram}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="mt-auto space-y-3 pt-7">
        <button type="button" onClick={() => setOpen(true)} className={waBtn}>
          {strings.ctaContact}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={socialBtn}
          >
            <Send className="size-3.5 shrink-0 sm:size-4" strokeWidth={2.25} />
            <span className="truncate">{strings.ctaTelegram}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={socialBtn}
          >
            <InstagramGlyph className="size-3.5 shrink-0 sm:size-4" />
            <span className="truncate">{strings.ctaInstagram}</span>
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={strings.closeDialog}
          className="border-slate-200/95 bg-white text-slate-900 sm:p-7"
        >
          <DialogHeader className="pr-10">
            <DialogTitle className="text-left text-base font-semibold leading-snug tracking-tight text-slate-900">
              {m.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>{m.line1}</p>
            <p className="border-t border-slate-100 pt-3 text-slate-800">
              <span className="font-medium text-slate-700">
                {m.telegramLabel}{" "}
              </span>
              <a
                href={LOOMANY_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
              >
                @loomany
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
