import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "kk", "kg", "uz", "tj"],
  defaultLocale: "ru",
  localePrefix: "always",
  /** Hreflang + x-default come from `lib/hreflang` / `buildPageMetadata` (BCP 47 ky/tg, x-default → /ru/…). */
  alternateLinks: false,
});
