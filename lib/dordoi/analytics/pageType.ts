import type { DordoiLocale } from "@/lib/dordoi/analytics/types";

const LOCALES: DordoiLocale[] = ["ru", "kk", "kg", "uz", "tj"];

function segment(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** path: e.g. /ru/catalog/foo or /ru/ */
export function detectDordoiPageType(path: string): string {
  const segs = segment(path);
  if (segs.length === 0) return "other";
  const loc = segs[0];
  if (!LOCALES.includes(loc as DordoiLocale)) {
    return "other";
  }
  if (segs.length === 1) return "home";
  const a = segs[1];
  if (a === "catalog") {
    if (segs.length >= 3) return "seller_profile";
    return "catalog";
  }
  if (a === "suppliers") return "suppliers";
  if (a === "buyers") return "buyers";
  if (a === "buyer-service") return "buyer_service";
  if (a === "sell") return "sell";
  if (a === "help") return "help";
  if (a === "contact") return "contact";
  if (a === "privacy" || a === "terms" || a === "refund" || a === "faq") {
    return "legal";
  }
  return "other";
}
