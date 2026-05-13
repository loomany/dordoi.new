import "server-only";

import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import type { SubscriptionPlan } from "@/lib/subscription/plans";

let configured = false;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function ensureLemonSqueezyConfigured(): void {
  if (configured) {
    return;
  }
  lemonSqueezySetup({ apiKey: requireEnv("LEMON_SQUEEZY_API_KEY") });
  configured = true;
}

export function lemonSqueezyStoreId(): string {
  return requireEnv("LEMON_SQUEEZY_STORE_ID");
}

export function lemonSqueezyVariantIdMonthly(): string {
  return requireEnv("LEMON_SQUEEZY_VARIANT_ID_MONTHLY");
}

export function lemonSqueezyVariantIdQuarterly(): string {
  return requireEnv("LEMON_SQUEEZY_VARIANT_ID_QUARTERLY");
}

export function lemonSqueezyVariantIdForPlan(plan: SubscriptionPlan): string {
  return plan === "quarterly"
    ? lemonSqueezyVariantIdQuarterly()
    : lemonSqueezyVariantIdMonthly();
}
