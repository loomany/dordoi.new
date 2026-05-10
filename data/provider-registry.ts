/** Structural fields for JSON-LD / WhatsApp — copy lives in messages (RU base). */
export const PROVIDER_SLUGS = ["container-04-12", "tkani-dordoi"] as const;

export type ProviderSlug = (typeof PROVIDER_SLUGS)[number];

export function isProviderSlug(s: string): s is ProviderSlug {
  return (PROVIDER_SLUGS as readonly string[]).includes(s);
}

export type ProviderContact = {
  /** WhatsApp wa.me/{digits} — digits only, no + */
  whatsappDigits: string;
  /** E.164 for schema.org telephone */
  telephoneE164: string;
  /** ISO 3166-1 alpha-2 */
  addressCountry: string;
  addressLocality: string;
  /** Shown in sidebar status dot */
  online: boolean;
};

export const providerContactBySlug: Record<ProviderSlug, ProviderContact> = {
  "container-04-12": {
    whatsappDigits: "996555000412",
    telephoneE164: "+996555000412",
    addressCountry: "KG",
    addressLocality: "Bishkek",
    online: true,
  },
  "tkani-dordoi": {
    whatsappDigits: "996555000513",
    telephoneE164: "+996555000513",
    addressCountry: "KG",
    addressLocality: "Bishkek",
    online: true,
  },
};
