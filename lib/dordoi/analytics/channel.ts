import type {
  DordoiChannelClassification,
  DordoiFirstTouchPayload,
  DordoiSourceBucket,
  DordoiTrafficChannelLabel,
} from "@/lib/dordoi/analytics/types";

function normalizeSearchPart(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const t = raw.trim();
  return t.startsWith("?") ? t.slice(1) : t;
}

function mergeParams(
  firstTouch: DordoiFirstTouchPayload | undefined,
  ...searchParts: string[]
): URLSearchParams {
  const merged = new URLSearchParams();
  for (const sp of searchParts) {
    const n = normalizeSearchPart(sp);
    if (!n) continue;
    try {
      const q = new URLSearchParams(n);
      q.forEach((v, k) => merged.set(k, v));
    } catch {
      /* ignore */
    }
  }
  if (firstTouch) {
    const setIf = (k: string, v: string | undefined) => {
      const t = v?.trim();
      if (t) merged.set(k, t);
    };
    setIf("utm_source", firstTouch.utmSource);
    setIf("utm_medium", firstTouch.utmMedium);
    setIf("utm_campaign", firstTouch.utmCampaign);
    setIf("utm_content", firstTouch.utmContent);
    setIf("utm_term", firstTouch.utmTerm);
  }
  return merged;
}

function paramPresent(params: URLSearchParams, key: string): boolean {
  const v = params.get(key)?.trim();
  return Boolean(v && v.length > 0);
}

function hostFromReferrer(ref: string | undefined | null): string | null {
  if (!ref?.trim()) return null;
  try {
    return new URL(ref).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isGoogleHost(host: string): boolean {
  return host === "google.com" || host.endsWith(".google.com");
}

export function classifyDordoiTrafficChannel(input: {
  firstTouch?: DordoiFirstTouchPayload;
  /** Current page query string (with or without ?) */
  search?: string;
  /** Prefer explicit payload referrer, then header */
  referrer?: string | null;
  headerReferrer?: string | null;
}): DordoiChannelClassification {
  const params = mergeParams(
    input.firstTouch,
    ...[input.firstTouch?.firstSearch, input.search].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    ),
  );

  const gclidPresent =
    Boolean(input.firstTouch?.gclidPresent) || paramPresent(params, "gclid");
  const gbraidPresent =
    Boolean(input.firstTouch?.gbraidPresent) || paramPresent(params, "gbraid");
  const wbraidPresent =
    Boolean(input.firstTouch?.wbraidPresent) || paramPresent(params, "wbraid");

  const utmSource = (params.get("utm_source") ?? "").toLowerCase();
  const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();
  const utmCampaign = params.get("utm_campaign") ?? "";
  const utmContent = params.get("utm_content") ?? "";
  const utmTerm = params.get("utm_term") ?? "";

  const paidMedium =
    utmMedium === "cpc" ||
    utmMedium === "ppc" ||
    utmMedium === "paid" ||
    utmMedium === "paid_search";
  const googlePaidSource = utmSource.includes("google") && paidMedium;

  const paidAds =
    gclidPresent ||
    gbraidPresent ||
    wbraidPresent ||
    paidMedium ||
    googlePaidSource;

  const refRaw =
    input.referrer?.trim() ||
    input.headerReferrer?.trim() ||
    input.firstTouch?.firstReferrer?.trim() ||
    "";
  const host = hostFromReferrer(refRaw);

  const utm = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: utmCampaign || undefined,
    content: utmContent || undefined,
    term: utmTerm || undefined,
  };

  const paidParams = { gclidPresent, gbraidPresent, wbraidPresent };

  const finish = (
    channel: DordoiTrafficChannelLabel,
    sourceBucket: DordoiSourceBucket,
    reason: string,
  ): DordoiChannelClassification => ({
    channel,
    sourceBucket,
    reason,
    utm,
    paidParams,
  });

  if (paidAds) {
    let reason = "Paid signal";
    if (gclidPresent) reason = "gclid present";
    else if (gbraidPresent) reason = "gbraid present";
    else if (wbraidPresent) reason = "wbraid present";
    else if (paidMedium) reason = `utm_medium=${utmMedium}`;
    else if (googlePaidSource) reason = "utm_source google + paid medium";
    return finish("Paid Google Ads", "google_ads", reason);
  }

  if (host && isGoogleHost(host)) {
    return finish(
      "Google Organic",
      "google_organic",
      "referrer google, no paid params",
    );
  }

  if (
    utmSource === "telegram" ||
    (host &&
      (host === "t.me" || host.endsWith(".t.me") || host.includes("telegram")))
  ) {
    return finish(
      "Telegram",
      "telegram",
      "utm_source=telegram or referrer telegram",
    );
  }

  if (
    utmSource === "instagram" ||
    (host &&
      (host.includes("instagram") || host === "l.instagram.com"))
  ) {
    return finish("Instagram", "instagram", "instagram referrer or utm");
  }

  if (
    utmSource === "facebook" ||
    (host &&
      (host.includes("facebook.") || host === "fb.me" || host.includes("fb.com")))
  ) {
    return finish("Facebook", "facebook", "facebook referrer or utm");
  }

  if (utmSource === "tiktok" || (host && host.includes("tiktok"))) {
    return finish("TikTok", "tiktok", "tiktok referrer or utm");
  }

  const hasUtm =
    Boolean(utm.source) ||
    Boolean(utm.medium) ||
    Boolean(utm.campaign) ||
    Boolean(utm.content) ||
    Boolean(utm.term);

  if (!refRaw && !hasUtm && !gclidPresent && !gbraidPresent && !wbraidPresent) {
    return finish("Direct / unknown", "direct", "No referrer or UTM");
  }

  if (host) {
    const socialOrSearch =
      isGoogleHost(host) ||
      host.includes("yandex") ||
      host.includes("bing.com") ||
      host.includes("duckduckgo");
    if (!socialOrSearch) {
      return finish("Referral", "referral", `External referrer: ${host}`);
    }
  }

  return finish("Unknown", "unknown", "Could not classify");
}
