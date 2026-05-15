"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

import {
  createDordoiSubscriptionCheckoutUrl,
  type SubscriptionCheckoutResult,
} from "@/app/actions/subscription";
import { useOpenAuthDialog } from "@/components/auth/auth-dialog-context";
import {
  clearPendingCheckoutPlan,
  savePendingCheckoutPlan,
} from "@/lib/subscription/pending-checkout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const LOOMANY_TELEGRAM = "https://t.me/loomany";

export type CatalogAccessPaywallCopy = {
  title: string;
  body: string;
  ctaPayment: string;
  ctaPaymentTransfer: string;
  closeDialog: string;
  planMonthlyPrice?: string;
  checkoutError?: string;
  checkoutLoading?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: CatalogAccessPaywallCopy;
};

export function CatalogAccessPaywallModal({ open, onOpenChange, copy }: Props) {
  const locale = useLocale();
  const openAuthDialog = useOpenAuthDialog();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    savePendingCheckoutPlan("monthly");
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
        await createDordoiSubscriptionCheckoutUrl("monthly", locale);

      if (!result.ok) {
        if (result.error === "auth_required") {
          openAuthDialog();
          return;
        }
        clearPendingCheckoutPlan();
        onOpenChange(true);
        setError(copy.checkoutError ?? "Checkout failed");
        return;
      }

      clearPendingCheckoutPlan();
      window.location.assign(result.url);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={copy.closeDialog}
        className="border-zinc-200/95 bg-[#FAFAF8] text-zinc-900 sm:max-w-md sm:p-7"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-left text-lg font-semibold tracking-tight text-zinc-950">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed text-zinc-600">
            {copy.body}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 flex items-center justify-center rounded-2xl border border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] bg-white px-4 py-4 shadow-sm ring-2 ring-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)]">
          <span className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
            {copy.planMonthlyPrice ?? "$9.99"}
          </span>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            disabled={isPending}
            className={cn(
              landingBlueCtaClassName,
              "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm shadow-md disabled:opacity-70",
            )}
            onClick={handleCheckout}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                <span>{copy.checkoutLoading ?? copy.ctaPayment}</span>
              </>
            ) : (
              copy.ctaPayment
            )}
          </button>

          <a
            href={LOOMANY_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {copy.ctaPaymentTransfer}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
