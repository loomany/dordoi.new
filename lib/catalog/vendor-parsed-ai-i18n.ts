import { createHash } from "node:crypto";

import type { VendorCardCommerceCopy } from "@/lib/catalog/vendor-card-display";

export const VENDOR_TEXT_LOCALES = ["kk", "kg", "uz", "tj"] as const;
export type VendorTextLocale = (typeof VENDOR_TEXT_LOCALES)[number];

/** Локализованный снимок текстовых полей карточки (без tradeType и бренда). */
export type VendorDisplayI18nEntry = {
  description: string;
  subtitle?: string | null;
  commerce?: VendorCardCommerceCopy;
};

export type VendorDisplayI18nMap = Partial<
  Record<VendorTextLocale, VendorDisplayI18nEntry>
>;

export type VendorParsedAiI18nMeta = {
  sourceFingerprint: string;
  translatedAt: Partial<Record<VendorTextLocale, string>>;
};

function asObjectRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

export function isVendorTextLocale(value: string): value is VendorTextLocale {
  return (VENDOR_TEXT_LOCALES as readonly string[]).includes(value);
}

export function fingerprintVendorDisplaySource(fields: {
  description: string;
  subtitle: string | null;
  commerce: VendorCardCommerceCopy;
}): string {
  const payload = JSON.stringify({
    description: fields.description.trim(),
    subtitle: fields.subtitle?.trim() ?? "",
    commerce: fields.commerce,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function readVendorDisplayI18n(
  parsedAiData: unknown,
): VendorDisplayI18nMap | null {
  const root = asObjectRecord(parsedAiData);
  if (!root) return null;
  const i18n = root.i18n;
  if (!i18n || typeof i18n !== "object" || Array.isArray(i18n)) return null;
  return i18n as VendorDisplayI18nMap;
}

export function readVendorParsedAiI18nMeta(
  parsedAiData: unknown,
): VendorParsedAiI18nMeta | null {
  const root = asObjectRecord(parsedAiData);
  if (!root) return null;
  const meta = root.i18nMeta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const o = meta as Record<string, unknown>;
  const sourceFingerprint =
    typeof o.sourceFingerprint === "string" ? o.sourceFingerprint : "";
  const translatedAt =
    o.translatedAt && typeof o.translatedAt === "object" && !Array.isArray(o.translatedAt)
      ? (o.translatedAt as Partial<Record<VendorTextLocale, string>>)
      : {};
  if (!sourceFingerprint) return null;
  return { sourceFingerprint, translatedAt };
}

export function resolveVendorDisplayI18nEntry(
  parsedAiData: unknown,
  locale: string,
): VendorDisplayI18nEntry | null {
  if (locale === "ru" || !isVendorTextLocale(locale)) return null;
  const entry = readVendorDisplayI18n(parsedAiData)?.[locale];
  if (!entry) return null;
  const description = entry.description?.trim();
  if (!description) return null;
  return {
    description,
    subtitle: entry.subtitle,
    commerce: entry.commerce,
  };
}

export function mergeCommerceWithI18n(
  base: VendorCardCommerceCopy,
  i18n?: VendorCardCommerceCopy,
): VendorCardCommerceCopy {
  if (!i18n) return base;
  const pick = (v: string | undefined): string | undefined => {
    const t = v?.trim();
    return t && t.length > 0 ? t : undefined;
  };
  return {
    delivery: pick(i18n.delivery) ?? base.delivery,
    payment: pick(i18n.payment) ?? base.payment,
    samples: pick(i18n.samples) ?? base.samples,
    defects: pick(i18n.defects) ?? base.defects,
  };
}
