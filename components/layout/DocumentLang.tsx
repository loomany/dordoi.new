"use client";

import { htmlLangFromRouteLocale } from "@/lib/hreflang";
import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Keeps `<html lang>` aligned with active locale after client navigations (SSR uses middleware header). */
export function DocumentLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = htmlLangFromRouteLocale(locale);
  }, [locale]);
  return null;
}
