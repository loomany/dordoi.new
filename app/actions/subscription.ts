"use server";

import { createCheckout, getSubscription } from "@lemonsqueezy/lemonsqueezy.js";

import { getSessionProfile } from "@/lib/auth/session-profile";
import {
  DORDOI_LEMON_PROJECT,
  dordoiBuyersCheckoutSuccessUrl,
  dordoiCatalogCheckoutSuccessUrl,
  dordoiCatalogVariantIdForPlan,
} from "@/lib/lemonsqueezy/dordoi";
import { ensureLemonSqueezyConfigured, lemonSqueezyStoreId } from "@/lib/lemonsqueezy/config";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import type { CheckoutContext } from "@/lib/subscription/pending-checkout";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubscriptionCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type SubscriptionPortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Lemon Squeezy API: числовой variant id; UUID из checkout-ссылки — null. */
function numericVariantId(variantId: string): number | null {
  if (/^\d+$/.test(variantId)) {
    return Number(variantId);
  }
  return null;
}

/**
 * Checkout только для подписки каталога Dordoi.help.
 * Variant: monthly → 1651527 ($9.99), quarterly → 1651488 ($300).
 */
export async function createDordoiSubscriptionCheckoutUrl(
  plan: SubscriptionPlan,
  locale?: string,
  context: CheckoutContext = "catalog",
): Promise<SubscriptionCheckoutResult> {
  const profile = await getSessionProfile();
  if (!profile) {
    return { ok: false, error: "auth_required" };
  }

  try {
    ensureLemonSqueezyConfigured();
    const storeId = lemonSqueezyStoreId();
    const variantId = dordoiCatalogVariantIdForPlan(plan);
    const redirectUrl =
      context === "buyers"
        ? dordoiBuyersCheckoutSuccessUrl(locale)
        : dordoiCatalogCheckoutSuccessUrl(locale);

    const response = await createCheckout(storeId, variantId, {
      checkoutData: {
        custom: {
          user_id: profile.userId,
          project: DORDOI_LEMON_PROJECT,
        },
        ...(profile.name ? { name: profile.name } : {}),
      },
      productOptions: {
        redirectUrl,
        ...(numericVariantId(variantId) !== null
          ? { enabledVariants: [numericVariantId(variantId)!] }
          : {}),
      },
      checkoutOptions: {
        embed: false,
      },
    });

    if (response.error) {
      console.error("[createDordoiSubscriptionCheckoutUrl]", response.error);
      return { ok: false, error: "checkout_failed" };
    }

    const checkoutUrl = response.data?.data.attributes.url;
    if (!checkoutUrl) {
      return { ok: false, error: "checkout_missing_url" };
    }

    return { ok: true, url: checkoutUrl };
  } catch (error) {
    console.error("[createDordoiSubscriptionCheckoutUrl]", error);
    return { ok: false, error: "checkout_failed" };
  }
}

/** @deprecated Используйте createDordoiSubscriptionCheckoutUrl */
export async function createSubscriptionCheckoutUrl(
  plan: SubscriptionPlan,
  locale?: string,
): Promise<SubscriptionCheckoutResult> {
  return createDordoiSubscriptionCheckoutUrl(plan, locale);
}

export async function getSubscriptionCustomerPortalUrl(): Promise<SubscriptionPortalResult> {
  const profile = await getSessionProfile();
  if (!profile) {
    return { ok: false, error: "auth_required" };
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("subscriptions")
    .select("subscription_id")
    .eq("user_id", profile.userId)
    .maybeSingle();

  if (error) {
    console.error("[getSubscriptionCustomerPortalUrl]", error);
    return { ok: false, error: "subscription_lookup_failed" };
  }

  const subscriptionId =
    typeof row?.subscription_id === "string" ? row.subscription_id.trim() : "";
  if (!subscriptionId) {
    return { ok: false, error: "no_subscription" };
  }

  try {
    ensureLemonSqueezyConfigured();
    const response = await getSubscription(subscriptionId);
    if (response.error) {
      console.error("[getSubscriptionCustomerPortalUrl]", response.error);
      return { ok: false, error: "portal_failed" };
    }

    const portalUrl = response.data?.data.attributes.urls.customer_portal;
    if (!portalUrl) {
      return { ok: false, error: "portal_missing_url" };
    }

    return { ok: true, url: portalUrl };
  } catch (error) {
    console.error("[getSubscriptionCustomerPortalUrl]", error);
    return { ok: false, error: "portal_failed" };
  }
}
