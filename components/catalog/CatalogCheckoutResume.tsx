"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { createDordoiSubscriptionCheckoutUrl } from "@/app/actions/subscription";
import {
  clearPendingCheckoutPlan,
  hasPendingCheckoutPlan,
  readPendingCheckoutPlan,
} from "@/lib/subscription/pending-checkout";
import { createClient } from "@/utils/supabase/client";

/**
 * После «Оплатить» → регистрация: полноэкранный лоадер, каталог не виден,
 * пока не получена ссылка Lemon Squeezy.
 */
export function CatalogCheckoutResume() {
  const locale = useLocale();
  const t = useTranslations("Pages.catalogBrowse.paywall");
  const busyRef = useRef(false);
  const [preparing, setPreparing] = useState(
    () => typeof window !== "undefined" && hasPendingCheckoutPlan(),
  );
  const [error, setError] = useState<string | null>(null);

  const runCheckout = useCallback(async () => {
    if (busyRef.current) {
      return;
    }

    const plan = readPendingCheckoutPlan();
    if (!plan) {
      setPreparing(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return;
    }

    busyRef.current = true;
    setPreparing(true);
    setError(null);

    const result = await createDordoiSubscriptionCheckoutUrl(plan, locale);
    busyRef.current = false;

    if (result.ok) {
      clearPendingCheckoutPlan();
      window.location.assign(result.url);
      return;
    }

    setPreparing(false);
    setError(t("checkoutPrepareFailed"));
  }, [locale, t]);

  useEffect(() => {
    if (hasPendingCheckoutPlan()) {
      setPreparing(true);
    }
    void runCheckout();

    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user &&
        hasPendingCheckoutPlan()
      ) {
        setPreparing(true);
        void runCheckout();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [runCheckout]);

  if (!preparing && !error) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#FAFAF8]/95 px-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-busy={preparing}
      aria-label={t("checkoutPreparing")}
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        {preparing ? (
          <>
            <Loader2
              className="size-10 animate-spin text-[var(--d-card-accent)]"
              aria-hidden
            />
            <p className="text-base font-medium text-zinc-900">
              {t("checkoutPreparing")}
            </p>
          </>
        ) : null}
        {error ? (
          <>
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
              onClick={() => {
                clearPendingCheckoutPlan();
                setError(null);
              }}
            >
              {t("closeDialog")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
