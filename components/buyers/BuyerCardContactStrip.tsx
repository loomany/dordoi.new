"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { Loader2, Send } from "lucide-react";
import { useLocale } from "next-intl";

import {
  createDordoiSubscriptionCheckoutUrl,
  type SubscriptionCheckoutResult,
} from "@/app/actions/subscription";
import { useOpenAuthDialog } from "@/components/auth/auth-dialog-context";
import {
  CatalogAccessPaywallModal,
  type CatalogAccessPaywallCopy,
} from "@/components/catalog/CatalogAccessPaywallModal";
import type { BuyerDirectoryRow } from "@/data/buyers-directory";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import {
  clearPendingCheckoutPlan,
  savePendingCheckoutPlan,
} from "@/lib/subscription/pending-checkout";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
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

const externalLinkProps = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};

type GatedContactProps = {
  className: string;
  label: string;
  icon?: ReactNode;
  href: string;
  unlocked: boolean;
  onLockedClick: () => void;
  external?: boolean;
};

function GatedContact({
  className,
  label,
  icon,
  href,
  unlocked,
  onLockedClick,
  external = true,
}: GatedContactProps) {
  const content = (
    <>
      {icon}
      {icon ? <span className="truncate">{label}</span> : label}
    </>
  );
  if (!unlocked) {
    return (
      <button type="button" className={className} onClick={onLockedClick}>
        {content}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} className={className} {...externalLinkProps}>
        {content}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {content}
    </a>
  );
}

export type BuyerSpotModalStrings = {
  title: string;
  line1: string;
  ctaPayment: string;
  checkoutError: string;
  checkoutLoading: string;
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

function BuyerSpotModalBody({
  strings,
  onOpenChange,
}: {
  strings: BuyerSpotModalStrings;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  const openAuthDialog = useOpenAuthDialog();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    savePendingCheckoutPlan("quarterly", "buyers");
    onOpenChange(false);

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        openAuthDialog();
        return;
      }

      const result: SubscriptionCheckoutResult =
        await createDordoiSubscriptionCheckoutUrl("quarterly", locale, "buyers");

      if (!result.ok) {
        if (result.error === "auth_required") {
          openAuthDialog();
          return;
        }
        clearPendingCheckoutPlan();
        onOpenChange(true);
        setError(strings.checkoutError);
        return;
      }

      clearPendingCheckoutPlan();
      window.location.assign(result.url);
    });
  }

  return (
    <>
      <DialogHeader className="pr-10">
        <DialogTitle className="text-left text-base font-semibold leading-snug tracking-tight text-slate-900">
          {strings.title}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm leading-relaxed text-slate-600">
        <p>{strings.line1}</p>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          onClick={handleCheckout}
          className={cn(
            landingBlueCtaClassName,
            "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold shadow-md disabled:opacity-70",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>{strings.checkoutLoading}</span>
            </>
          ) : (
            strings.ctaPayment
          )}
        </button>
        <p className="border-t border-slate-100 pt-3 text-center text-slate-800">
          <span className="font-medium text-slate-700">{strings.telegramLabel} </span>
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
    </>
  );
}

type Props = {
  buyer: BuyerDirectoryRow;
  strings: BuyerCardContactStripStrings;
  contactsUnlocked?: boolean;
  paywallCopy?: CatalogAccessPaywallCopy;
};

export function BuyerCardContactStrip({
  buyer,
  strings,
  contactsUnlocked = false,
  paywallCopy,
}: Props) {
  const [open, setOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const openPaywall = useCallback(() => {
    setPaywallOpen(true);
  }, []);
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
            <BuyerSpotModalBody strings={m} onOpenChange={setOpen} />
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
      <>
        <div className={contactFooter}>
          {showStackedContactCall ? (
            <>
              <GatedContact
                className={waBtn}
                label={strings.ctaContact}
                href={whatsappHref}
                unlocked={contactsUnlocked}
                onLockedClick={openPaywall}
              />
              <GatedContact
                className={callBtn}
                label={strings.ctaCall}
                href={`tel:+${callDigits}`}
                unlocked={contactsUnlocked}
                onLockedClick={openPaywall}
                external={false}
              />
            </>
          ) : (
            <GatedContact
              className={waBtn}
              label={strings.ctaContact}
              href={whatsappHref}
              unlocked={contactsUnlocked}
              onLockedClick={openPaywall}
            />
          )}
          {hasSocialRow ? (
            <div
              className={
                telegramHref ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"
              }
            >
              {telegramHref ? (
                <GatedContact
                  className={socialBtn}
                  label={strings.ctaTelegram}
                  icon={
                    <Send
                      className="size-3.5 shrink-0 sm:size-4"
                      strokeWidth={2.25}
                    />
                  }
                  href={telegramHref}
                  unlocked={contactsUnlocked}
                  onLockedClick={openPaywall}
                />
              ) : null}
              {instagramHref ? (
                <GatedContact
                  className={socialBtn}
                  label={strings.ctaInstagram}
                  icon={<InstagramGlyph className="size-3.5 shrink-0 sm:size-4" />}
                  href={instagramHref}
                  unlocked={contactsUnlocked}
                  onLockedClick={openPaywall}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {paywallCopy ? (
          <CatalogAccessPaywallModal
            open={paywallOpen}
            onOpenChange={setPaywallOpen}
            copy={paywallCopy}
          />
        ) : null}
      </>
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
          <BuyerSpotModalBody strings={m} onOpenChange={setOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
}
