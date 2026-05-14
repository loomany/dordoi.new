/** Stage 1: Dordoi-only admin analytics (isolated from vendor onboarding bot). */

export type DordoiLocale = "ru" | "kk" | "kg" | "uz" | "tj";

export type DordoiEventCategory = "traffic" | "leads" | "vendors" | "system";

export type DordoiTrafficEventType =
  | "first_visit"
  | "catalog_open"
  | "seller_profile_view";

export type DordoiCtaEventType =
  | "contact_click"
  | "whatsapp_click"
  | "telegram_click"
  | "phone_click";

export type DordoiLeadEventType =
  | "seller_registration_started"
  | "seller_registration_submitted"
  | "buyer_request_submitted"
  | "vendor_application_saved"
  | "vendor_approved"
  | "vendor_rejected";

export type DordoiAnalyticsEventType =
  | DordoiTrafficEventType
  | DordoiCtaEventType
  | DordoiLeadEventType;

/** Bot buckets for Telegram policy (search = allow short TG; SEO/suspicious = no TG). */
export type DordoiBotCategory =
  | "search_crawler"
  | "seo_crawler"
  | "unknown_bot"
  | "suspicious";

export type DordoiTrafficChannelLabel =
  | "Google Ads"
  | "TikTok Ads"
  | "Meta Ads"
  | "Instagram Ads"
  | "Facebook Ads"
  | "Telegram Ads"
  | "Google Organic"
  | "Bing Organic"
  | "Yandex Organic"
  | "DuckDuckGo Organic"
  | "Yahoo Organic"
  | "ChatGPT"
  | "Gemini"
  | "Perplexity"
  | "Claude"
  | "Copilot"
  | "Telegram"
  | "Instagram"
  | "Facebook"
  | "TikTok"
  | "WhatsApp"
  | "Direct / internal"
  | "Direct"
  | "Referral"
  | "Unknown";

export type DordoiSourceBucket =
  | "google_ads"
  | "tiktok_ads"
  | "meta_ads"
  | "telegram_ads"
  | "google_organic"
  | "bing_organic"
  | "yandex_organic"
  | "duckduckgo_organic"
  | "yahoo_organic"
  | "ai_chatgpt"
  | "ai_gemini"
  | "ai_perplexity"
  | "ai_claude"
  | "ai_copilot"
  | "telegram"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "whatsapp"
  | "direct"
  | "direct_internal"
  | "referral"
  | "unknown";

export type DordoiChannelClassification = {
  channel: DordoiTrafficChannelLabel;
  sourceBucket: DordoiSourceBucket;
  reason: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  paidParams: {
    gclidPresent: boolean;
    gbraidPresent: boolean;
    wbraidPresent: boolean;
    fbclidPresent: boolean;
    ttclidPresent: boolean;
  };
};

export type DordoiVisitorStatus = {
  isBot: boolean;
  botName?: string;
  botCategory?: DordoiBotCategory;
  status: "Human-like visit" | "Bot" | "Suspicious";
};

export type DordoiDeviceInfo = {
  browser: string;
  os: string;
  device: string;
};

export type DordoiFirstTouchPayload = {
  firstPath?: string;
  firstSearch?: string;
  firstReferrer?: string;
  firstUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclidPresent?: boolean;
  gbraidPresent?: boolean;
  wbraidPresent?: boolean;
  visitorId?: string;
  sessionId?: string;
  createdAt?: string;
};

export type DordoiAnalyticsApiResult = {
  ok: true;
  sent: boolean;
  skippedReason?: string;
};

/** Server-side lead / admin Telegram helpers (Stage 1C+). */
export type DordoiVendorModerationNotifyStatus = "approved" | "rejected";

export type DordoiLeadNotifyResult = {
  ok: true;
  sent: boolean;
  skippedReason?: string;
};

export type DordoiVendorModerationNotifyParams = {
  vendorId: string;
  status: DordoiVendorModerationNotifyStatus;
  storeTitle: string | null | undefined;
  /** DB `vendors.categories` (array, string, or json). */
  categories: unknown;
};

/** Optional attribution for site registration admin notify (separate client stage). */
export type DordoiSiteRegistrationAttribution = {
  channel?: string;
  firstPage?: string;
  campaign?: string;
  utmSource?: string;
  gclid?: string;
};

export type DordoiSiteRegistrationNotifyParams = {
  userId: string;
  email?: string | null;
  /** DB / auth phone as digits only (same as profiles.phone). */
  phoneDigits: string;
  role: "buyer" | "vendor" | "unknown";
  /** Fallback when signup URL has no locale segment (e.g. Accept-Language hint). */
  localeLabel: string;
  /** Optional `Referer` header from signup POST — used to derive 🌐 Язык from path. */
  referrerUrl?: string | null;
  attribution?: DordoiSiteRegistrationAttribution;
};
