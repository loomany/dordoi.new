import {
  parseLemonFormattedTotal,
  parseSubscriptionPlan,
  SUBSCRIPTION_PLAN_CURRENCY,
  subscriptionPlanUsdAmount,
} from "@/lib/subscription/plan-pricing";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import type { CheckoutContext } from "@/lib/subscription/pending-checkout";

const STORAGE_PREFIX = "dordoi_gads_payment_conversion:";
const SESSION_VISIT_KEY = `${STORAGE_PREFIX}success_visit`;

export type PaymentConversionParams = {
  orderId?: string | null;
  orderIdentifier?: string | null;
  subscriptionId?: string | null;
  checkoutId?: string | null;
  total?: string | null;
  plan?: string | null;
};

export type PaymentConversionValue = {
  value: number;
  currency: typeof SUBSCRIPTION_PLAN_CURRENCY;
};

export function googleAdsConversionSendTo(): string | null {
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL?.trim();
  if (!label) {
    return null;
  }
  const adsId =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18162967359";
  return `${adsId}/${label}`;
}

export function paymentConversionDedupKey(
  params: PaymentConversionParams,
): string {
  const id =
    params.orderIdentifier?.trim() ||
    params.orderId?.trim() ||
    params.subscriptionId?.trim() ||
    params.checkoutId?.trim();
  return id ? `order:${id}` : "visit";
}

export function hasPaymentConversionBeenSent(dedupKey: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (dedupKey === "visit") {
    return sessionStorage.getItem(SESSION_VISIT_KEY) === "1";
  }
  return localStorage.getItem(`${STORAGE_PREFIX}${dedupKey}`) === "1";
}

export function markPaymentConversionSent(dedupKey: string): void {
  if (typeof window === "undefined") {
    return;
  }
  if (dedupKey === "visit") {
    sessionStorage.setItem(SESSION_VISIT_KEY, "1");
    return;
  }
  localStorage.setItem(`${STORAGE_PREFIX}${dedupKey}`, "1");
}

export function resolvePaymentConversionValue(
  params: PaymentConversionParams,
): PaymentConversionValue | null {
  const fromTotal = parseLemonFormattedTotal(params.total);
  if (fromTotal !== null) {
    return { value: fromTotal, currency: SUBSCRIPTION_PLAN_CURRENCY };
  }
  const plan = parseSubscriptionPlan(params.plan);
  if (!plan) {
    return null;
  }
  return {
    value: subscriptionPlanUsdAmount(plan),
    currency: SUBSCRIPTION_PLAN_CURRENCY,
  };
}

export function parseCheckoutContext(
  raw: string | null | undefined,
): CheckoutContext {
  return raw === "buyers" ? "buyers" : "catalog";
}

export function parsePaymentConversionSearchParams(
  searchParams: URLSearchParams,
): PaymentConversionParams & {
  context: CheckoutContext;
  plan: SubscriptionPlan | null;
} {
  return {
    orderId: searchParams.get("order_id"),
    orderIdentifier: searchParams.get("order_identifier"),
    subscriptionId: searchParams.get("subscription_id"),
    checkoutId: searchParams.get("checkout_id"),
    total: searchParams.get("total"),
    plan: parseSubscriptionPlan(searchParams.get("plan")),
    context: parseCheckoutContext(searchParams.get("context")),
  };
}
