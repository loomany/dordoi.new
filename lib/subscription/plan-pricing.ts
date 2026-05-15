import type { SubscriptionPlan } from "@/lib/subscription/plans";

export const SUBSCRIPTION_PLAN_CURRENCY = "USD" as const;

const PLAN_USD: Record<SubscriptionPlan, number> = {
  monthly: 9.99,
  quarterly: 300,
};

export function subscriptionPlanUsdAmount(
  plan: SubscriptionPlan,
): number {
  return PLAN_USD[plan];
}

export function parseSubscriptionPlan(
  raw: string | null | undefined,
): SubscriptionPlan | null {
  if (raw === "monthly" || raw === "quarterly") {
    return raw;
  }
  return null;
}

/** Lemon Squeezy `[total]` — formatted string, e.g. "$9.99" or "9.99". */
export function parseLemonFormattedTotal(
  raw: string | null | undefined,
): number | null {
  if (!raw?.trim()) {
    return null;
  }
  const normalized = raw.trim().replace(/,/g, "");
  const match = normalized.match(/[\d.]+/);
  if (!match) {
    return null;
  }
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}
