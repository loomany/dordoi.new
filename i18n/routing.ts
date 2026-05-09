import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "kk", "kg", "uz", "tj"],
  defaultLocale: "ru",
  localePrefix: "always",
});
