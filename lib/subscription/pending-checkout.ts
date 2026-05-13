import type { SubscriptionPlan } from "@/lib/subscription/plans";

const STORAGE_KEY = "dordoi_pending_checkout_plan";
const URL_PARAM = "subscribe";

function readPlanFromUrl(): SubscriptionPlan | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = new URLSearchParams(window.location.search).get(URL_PARAM);
  if (value === "monthly" || value === "quarterly") {
    return value;
  }
  return null;
}

export function savePendingCheckoutPlan(plan: SubscriptionPlan): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, plan);
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM, plan);
  window.history.replaceState(window.history.state, "", url.toString());
}

export function readPendingCheckoutPlan(): SubscriptionPlan | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === "monthly" || raw === "quarterly") {
    return raw;
  }
  return readPlanFromUrl();
}

export function hasPendingCheckoutPlan(): boolean {
  return readPendingCheckoutPlan() !== null;
}

export function clearPendingCheckoutPlan(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
  const url = new URL(window.location.href);
  url.searchParams.delete(URL_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
}
