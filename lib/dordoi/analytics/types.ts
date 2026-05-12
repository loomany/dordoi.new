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

export type DordoiTrafficChannelLabel =
  | "Paid Google Ads"
  | "Google Organic"
  | "Telegram"
  | "Instagram"
  | "Facebook"
  | "TikTok"
  | "Direct / unknown"
  | "Referral"
  | "Unknown";

export type DordoiSourceBucket =
  | "google_ads"
  | "google_organic"
  | "telegram"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "direct"
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
  };
};

export type DordoiVisitorStatus = {
  isBot: boolean;
  botName?: string;
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
