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

function isDordoiSiteHost(host: string): boolean {
  return host === "dordoi.help" || host === "www.dordoi.help";
}

function isGoogleHost(host: string): boolean {
  return host === "google.com" || host.endsWith(".google.com");
}

function isPaidMedium(m: string): boolean {
  return (
    m === "cpc" ||
    m === "ppc" ||
    m === "paid" ||
    m === "paid_search" ||
    m === "paid_social" ||
    m === "ads"
  );
}

function finish(
  channel: DordoiTrafficChannelLabel,
  sourceBucket: DordoiSourceBucket,
  reason: string,
  utm: DordoiChannelClassification["utm"],
  paidParams: DordoiChannelClassification["paidParams"],
): DordoiChannelClassification {
  return { channel, sourceBucket, reason, utm, paidParams };
}

/** Organic search query line for Telegram; omit for non-search channels. */
export function searchQueryLineForTelegram(
  referrer: string | undefined | null,
  channel: DordoiTrafficChannelLabel,
): { show: boolean; text: string } {
  const organic: DordoiTrafficChannelLabel[] = [
    "Google Organic",
    "Bing Organic",
    "Yandex Organic",
    "DuckDuckGo Organic",
    "Yahoo Organic",
  ];
  if (!organic.includes(channel)) {
    return { show: false, text: "" };
  }
  const ref = referrer?.trim() ?? "";
  if (!ref) {
    if (channel === "Google Organic") {
      return { show: true, text: "скрыт Google" };
    }
    return { show: false, text: "" };
  }
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return { show: false, text: "" };
  }
  const q = url.searchParams;
  let raw: string | null = null;
  if (channel === "Google Organic") {
    raw =
      q.get("q")?.trim() ||
      q.get("query")?.trim() ||
      q.get("search")?.trim() ||
      null;
    if (!raw) return { show: true, text: "скрыт Google" };
  } else if (channel === "Bing Organic" || channel === "DuckDuckGo Organic") {
    raw = q.get("q")?.trim() || null;
  } else if (channel === "Yandex Organic") {
    raw = q.get("text")?.trim() || null;
  } else if (channel === "Yahoo Organic") {
    raw = q.get("p")?.trim() || null;
  }
  if (!raw) return { show: false, text: "" };
  return { show: true, text: raw.slice(0, 200) };
}

export function classifyDordoiTrafficChannel(input: {
  firstTouch?: DordoiFirstTouchPayload;
  search?: string;
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
  const fbclidPresent = paramPresent(params, "fbclid");
  const ttclidPresent = paramPresent(params, "ttclid");

  const utmSource = (params.get("utm_source") ?? "").toLowerCase();
  const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();
  const utmCampaign = params.get("utm_campaign") ?? "";
  const utmContent = params.get("utm_content") ?? "";
  const utmTerm = params.get("utm_term") ?? "";

  const paidMedium = isPaidMedium(utmMedium);
  const googlePaidSource = utmSource.includes("google") && paidMedium;
  const metaSources =
    utmSource.includes("facebook") ||
    utmSource.includes("instagram") ||
    utmSource === "meta" ||
    utmSource === "fb";
  const tiktokPaid = utmSource.includes("tiktok") && paidMedium;
  const telegramPaid = utmSource.includes("telegram") && paidMedium;

  const googlePaidAds =
    gclidPresent ||
    gbraidPresent ||
    wbraidPresent ||
    googlePaidSource ||
    (utmSource.includes("google") && paidMedium);

  const metaPaidAds =
    fbclidPresent ||
    (metaSources && paidMedium) ||
    (paidMedium && (utmSource === "fb" || utmSource === "ig"));

  const tiktokPaidAds = ttclidPresent || tiktokPaid;
  const telegramPaidAds = telegramPaid;

  const genericPaid =
    paidMedium && !googlePaidSource && !metaPaidAds && !tiktokPaidAds;

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

  const paidParams = {
    gclidPresent,
    gbraidPresent,
    wbraidPresent,
    fbclidPresent,
    ttclidPresent,
  };

  const hasUtm =
    Boolean(utm.source) ||
    Boolean(utm.medium) ||
    Boolean(utm.campaign) ||
    Boolean(utm.content) ||
    Boolean(utm.term);

  /* Internal first: same-site navigation should not be Referral */
  if (host && isDordoiSiteHost(host)) {
    return finish(
      "Direct / internal",
      "direct_internal",
      "referrer dordoi.help",
      utm,
      paidParams,
    );
  }

  if (googlePaidAds || (genericPaid && utmSource.includes("google"))) {
    return finish("Google Ads", "google_ads", "google paid", utm, paidParams);
  }
  if (metaPaidAds) {
    const ch: DordoiTrafficChannelLabel =
      utmSource.includes("instagram") || utmSource === "ig"
        ? "Instagram Ads"
        : "Meta Ads";
    return finish(ch, "meta_ads", "meta paid", utm, paidParams);
  }
  if (tiktokPaidAds) {
    return finish("TikTok Ads", "tiktok_ads", "tiktok paid", utm, paidParams);
  }
  if (telegramPaidAds) {
    return finish("Telegram Ads", "telegram_ads", "telegram paid", utm, paidParams);
  }
  if (paidMedium && !gclidPresent && !fbclidPresent && !ttclidPresent) {
    if (utmSource.includes("tiktok")) {
      return finish("TikTok Ads", "tiktok_ads", "utm tiktok paid", utm, paidParams);
    }
    if (metaSources) {
      return finish("Meta Ads", "meta_ads", "utm meta paid", utm, paidParams);
    }
    if (utmSource.includes("telegram")) {
      return finish(
        "Telegram Ads",
        "telegram_ads",
        "utm telegram paid",
        utm,
        paidParams,
      );
    }
    if (utmSource.includes("google")) {
      return finish("Google Ads", "google_ads", "utm google paid", utm, paidParams);
    }
  }

  /* AI referrals */
  if (host) {
    if (
      host.includes("chatgpt.com") ||
      host.includes("chat.openai.com") ||
      utmSource === "chatgpt" ||
      utmSource === "openai"
    ) {
      return finish("ChatGPT", "ai_chatgpt", "ai referrer", utm, paidParams);
    }
    if (
      host === "gemini.google.com" ||
      host === "bard.google.com" ||
      utmSource === "gemini" ||
      utmSource === "bard"
    ) {
      return finish("Gemini", "ai_gemini", "ai referrer", utm, paidParams);
    }
    if (host.includes("perplexity.ai") || utmSource === "perplexity") {
      return finish("Perplexity", "ai_perplexity", "ai referrer", utm, paidParams);
    }
    if (host.includes("claude.ai") || utmSource === "claude" || utmSource === "anthropic") {
      return finish("Claude", "ai_claude", "ai referrer", utm, paidParams);
    }
    if (
      host === "copilot.microsoft.com" ||
      (host.includes("bing.com") && refRaw.toLowerCase().includes("/chat")) ||
      utmSource === "copilot"
    ) {
      return finish("Copilot", "ai_copilot", "ai referrer", utm, paidParams);
    }
  }

  /* Organic search (no paid ids) */
  if (host && isGoogleHost(host)) {
    return finish(
      "Google Organic",
      "google_organic",
      "referrer google",
      utm,
      paidParams,
    );
  }
  if (host && (host.includes("bing.com") || host === "www.bing.com")) {
    return finish("Bing Organic", "bing_organic", "referrer bing", utm, paidParams);
  }
  if (host && host.includes("yandex")) {
    return finish("Yandex Organic", "yandex_organic", "referrer yandex", utm, paidParams);
  }
  if (host && host.includes("duckduckgo")) {
    return finish(
      "DuckDuckGo Organic",
      "duckduckgo_organic",
      "referrer ddg",
      utm,
      paidParams,
    );
  }
  if (host && host.includes("search.yahoo")) {
    return finish("Yahoo Organic", "yahoo_organic", "referrer yahoo", utm, paidParams);
  }

  /* Social / messenger */
  if (
    utmSource === "telegram" ||
    (host &&
      (host === "t.me" || host.endsWith(".t.me") || host.includes("telegram")))
  ) {
    return finish("Telegram", "telegram", "telegram", utm, paidParams);
  }
  if (
    utmSource === "instagram" ||
    (host && (host.includes("instagram") || host === "l.instagram.com"))
  ) {
    return finish("Instagram", "instagram", "instagram", utm, paidParams);
  }
  if (
    utmSource === "facebook" ||
    (host &&
      (host.includes("facebook.") ||
        host === "fb.me" ||
        host.includes("fb.com") ||
        host === "l.facebook.com" ||
        host === "lm.facebook.com"))
  ) {
    return finish("Facebook", "facebook", "facebook", utm, paidParams);
  }
  if (utmSource === "tiktok" || (host && host.includes("tiktok"))) {
    return finish("TikTok", "tiktok", "tiktok", utm, paidParams);
  }
  if (
    utmSource === "whatsapp" ||
    (host && (host.includes("whatsapp.com") || host === "wa.me"))
  ) {
    return finish("WhatsApp", "whatsapp", "whatsapp", utm, paidParams);
  }

  if (!refRaw && !hasUtm && !gclidPresent && !fbclidPresent && !ttclidPresent) {
    return finish("Direct", "direct", "no referrer utm", utm, paidParams);
  }

  if (host) {
    return finish("Referral", "referral", host.slice(0, 120), utm, paidParams);
  }

  return finish("Unknown", "unknown", "unclassified", utm, paidParams);
}
