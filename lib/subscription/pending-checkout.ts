import type { SubscriptionPlan } from "@/lib/subscription/plans";

const STORAGE_KEY = "dordoi_pending_checkout_plan";

export function savePendingCheckoutPlan(plan: SubscriptionPlan): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, plan);
}

export function readPendingCheckoutPlan(): SubscriptionPlan | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === "monthly" || raw === "quarterly") {
    return raw;
  }
  return null;
}

export function clearPendingCheckoutPlan(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
}
