"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  googleAdsConversionSendTo,
  hasPaymentConversionBeenSent,
  markPaymentConversionSent,
  parsePaymentConversionSearchParams,
  paymentConversionDedupKey,
  resolvePaymentConversionValue,
} from "@/lib/analytics/google-ads-payment-conversion";

function siteIndexableClient(): boolean {
  return process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";
}

function fireConversion(
  sendTo: string,
  value: number | undefined,
  currency: string | undefined,
): void {
  if (typeof window.gtag !== "function") {
    return;
  }
  const payload: Record<string, string | number> = { send_to: sendTo };
  if (value !== undefined) {
    payload.value = value;
  }
  if (currency) {
    payload.currency = currency;
  }
  window.gtag("event", "conversion", payload);
}

/**
 * Google Ads purchase conversion — only on `/payment/success` after Lemon Squeezy checkout.
 */
export function GoogleAdsPaymentConversion() {
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !siteIndexableClient()) {
      return;
    }

    const sendTo = googleAdsConversionSendTo();
    if (!sendTo) {
      return;
    }

    const params = parsePaymentConversionSearchParams(searchParams);
    const dedupKey = paymentConversionDedupKey(params);
    if (hasPaymentConversionBeenSent(dedupKey)) {
      firedRef.current = true;
      return;
    }

    const amount = resolvePaymentConversionValue(params);

    const attempt = (triesLeft: number) => {
      if (firedRef.current) {
        return;
      }
      if (typeof window.gtag !== "function") {
        if (triesLeft > 0) {
          window.setTimeout(() => attempt(triesLeft - 1), 200);
        }
        return;
      }

      fireConversion(
        sendTo,
        amount?.value,
        amount?.currency,
      );
      markPaymentConversionSent(dedupKey);
      firedRef.current = true;
    };

    attempt(15);
  }, [searchParams]);

  return null;
}
