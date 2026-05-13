"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

import {
  createDordoiSubscriptionCheckoutUrl,
  type SubscriptionCheckoutResult,
} from "@/app/actions/subscription";
import { useOpenAuthDialog } from "@/components/auth/auth-dialog-context";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { savePendingCheckoutPlan } from "@/lib/subscription/pending-checkout";
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

export type CatalogAccessPaywallCopy = {
  title: string;
  body: string;
  ctaPayment: string;
  closeDialog: string;
  planMonthlyLabel?: string;
  planMonthlyPrice?: string;
  planQuarterlyLabel?: string;
  planQuarterlyPrice?: string;
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
  const [plan, setPlan] = useState<SubscriptionPlan>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function beginAuthThenCheckout(selectedPlan: SubscriptionPlan) {
    savePendingCheckoutPlan(selectedPlan);
    onOpenChange(false);
    openAuthDialog();
  }

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        beginAuthThenCheckout(plan);
        return;
      }

      const result: SubscriptionCheckoutResult =
        await createDordoiSubscriptionCheckoutUrl(plan, locale);

      if (!result.ok) {
        if (result.error === "auth_required") {
          beginAuthThenCheckout(plan);
          return;
        }
        setError(copy.checkoutError ?? "Checkout failed");
        return;
      }

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

        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <PlanOption
            active={plan === "monthly"}
            label={copy.planMonthlyLabel ?? "$9.99 / month"}
            price={copy.planMonthlyPrice ?? "$9.99"}
            onSelect={() => setPlan("monthly")}
          />
          <PlanOption
            active={plan === "quarterly"}
            label={copy.planQuarterlyLabel ?? "$300 / 3 months"}
            price={copy.planQuarterlyPrice ?? "$300"}
            onSelect={() => setPlan("quarterly")}
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          className={cn(
            landingBlueCtaClassName,
            "mt-1 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm shadow-md disabled:opacity-70",
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
      </DialogContent>
    </Dialog>
  );
}

function PlanOption({
  active,
  label,
  price,
  onSelect,
}: {
  active: boolean;
  label: string;
  price: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition-colors",
        active
          ? "border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] bg-white shadow-sm ring-2 ring-[color-mix(in_oklch,var(--d-card-accent)_22%,transparent)]"
          : "border-zinc-200/90 bg-white/70 hover:border-zinc-300",
      )}
    >
      <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="mt-1 block text-xl font-bold tracking-tight text-zinc-950">
        {price}
      </span>
    </button>
  );
}
