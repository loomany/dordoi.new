"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

import { createDordoiSubscriptionCheckoutUrl } from "@/app/actions/subscription";
import {
  clearPendingCheckoutPlan,
  readPendingCheckoutPlan,
} from "@/lib/subscription/pending-checkout";
import { createClient } from "@/utils/supabase/client";

/** После входа/регистрации продолжает оплату, если пользователь нажал «Оплатить» без сессии. */
export function CatalogCheckoutResume() {
  const locale = useLocale();
  const busyRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function tryResume() {
      if (busyRef.current) {
        return;
      }
      const plan = readPendingCheckoutPlan();
      if (!plan) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }

      busyRef.current = true;
      clearPendingCheckoutPlan();

      const result = await createDordoiSubscriptionCheckoutUrl(plan, locale);
      busyRef.current = false;

      if (result.ok) {
        window.location.assign(result.url);
      }
    }

    void tryResume();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void tryResume();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [locale]);

  return null;
}
