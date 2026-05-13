import "server-only";

import { routing } from "@/i18n/routing";

export const DORDOI_LEMON_PROJECT = "dordoi" as const;

function dordoiVariantIdMonthly(): string {
  return (
    process.env.LEMON_SQUEEZY_VARIANT_ID_MONTHLY?.trim() || "1651527"
  );
}

function dordoiVariantIdQuarterly(): string {
  return (
    process.env.LEMON_SQUEEZY_VARIANT_ID_QUARTERLY?.trim() || "1651488"
  );
}

/** Variant IDs каталога Dordoi.help (не ScholarshipTop). */
export function dordoiCatalogVariantIds(): ReadonlySet<string> {
  return new Set([dordoiVariantIdMonthly(), dordoiVariantIdQuarterly()]);
}

export function dordoiCatalogVariantIdForPlan(
  plan: "monthly" | "quarterly",
): string {
  return plan === "quarterly"
    ? dordoiVariantIdQuarterly()
    : dordoiVariantIdMonthly();
}

export function isDordoiCatalogVariantId(
  variantId: string | number | null | undefined,
): boolean {
  if (variantId === null || variantId === undefined) {
    return false;
  }
  return dordoiCatalogVariantIds().has(String(variantId));
}

export function resolveDordoiProjectFromCustomData(
  customData: unknown,
): string | null {
  if (!customData || typeof customData !== "object") {
    return null;
  }
  const project = (customData as Record<string, unknown>).project;
  return typeof project === "string" && project.trim()
    ? project.trim()
    : null;
}

export function isDordoiLemonWebhookEvent(opts: {
  variantId: string | number | null | undefined;
  customData: unknown;
}): boolean {
  if (resolveDordoiProjectFromCustomData(opts.customData) === DORDOI_LEMON_PROJECT) {
    return true;
  }
  return isDordoiCatalogVariantId(opts.variantId);
}

export function dordoiCatalogCheckoutSuccessUrl(locale?: string | null): string {
  const origin = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://dordoi.help"
  ).replace(/\/$/, "");
  const loc =
    locale && routing.locales.includes(locale as (typeof routing.locales)[number])
      ? locale
      : routing.defaultLocale;
  return `${origin}/${loc}/catalog?checkout=success`;
}
