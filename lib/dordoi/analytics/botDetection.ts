import type { DordoiBotCategory, DordoiVisitorStatus } from "@/lib/dordoi/analytics/types";

/** Only these may trigger short Telegram "search crawler" messages. */
const SEARCH_CRAWLER_UA: Array<{ needle: string; name: string }> = [
  { needle: "google-inspectiontool", name: "Google-InspectionTool" },
  { needle: "adsbot-google", name: "AdsBot-Google" },
  { needle: "googlebot", name: "Googlebot" },
  { needle: "bingbot", name: "Bingbot" },
  { needle: "yandexbot", name: "YandexBot" },
  { needle: "duckduckbot", name: "DuckDuckBot" },
  { needle: "applebot", name: "Applebot" },
];

const SEO_CRAWLER_UA: Array<{ needle: string; name: string }> = [
  { needle: "ahrefsbot", name: "AhrefsBot" },
  { needle: "semrushbot", name: "SemrushBot" },
  { needle: "mj12bot", name: "MJ12bot" },
  { needle: "dotbot", name: "DotBot" },
  { needle: "petalbot", name: "PetalBot" },
  { needle: "mediapartners-google", name: "Mediapartners-Google" },
];

const GENERIC_BOT = "bot";

export function detectDordoiVisitorStatus(
  userAgent: string | null | undefined,
): DordoiVisitorStatus {
  const ua = userAgent?.trim() ?? "";
  if (!ua) {
    return {
      isBot: false,
      botCategory: "suspicious",
      status: "Suspicious",
    };
  }
  const lower = ua.toLowerCase();

  for (const { needle, name } of SEARCH_CRAWLER_UA) {
    if (lower.includes(needle)) {
      return {
        isBot: true,
        botName: name,
        botCategory: "search_crawler",
        status: "Bot",
      };
    }
  }

  for (const { needle, name } of SEO_CRAWLER_UA) {
    if (lower.includes(needle)) {
      return {
        isBot: true,
        botName: name,
        botCategory: "seo_crawler",
        status: "Bot",
      };
    }
  }

  const suspiciousSnippets = [
    "curl/",
    "wget/",
    "python-requests",
    "postman",
    "axios/",
    "node-fetch",
    "headlesschrome",
  ];
  if (suspiciousSnippets.some((s) => lower.includes(s)) || ua.length < 20) {
    return {
      isBot: false,
      botCategory: "suspicious",
      status: "Suspicious",
    };
  }

  if (lower.includes(GENERIC_BOT)) {
    const nameMatch = /(?:^|[\s/;()])([a-z0-9._-]*bot[a-z0-9._-]*)(?:[\s/;()]|$)/i.exec(
      ua,
    );
    return {
      isBot: true,
      botName: nameMatch?.[1] ?? "bot",
      botCategory: "unknown_bot",
      status: "Bot",
    };
  }

  const browserLike =
    lower.includes("mozilla") ||
    lower.includes("chrome") ||
    lower.includes("safari") ||
    lower.includes("firefox") ||
    lower.includes("edg");

  if (browserLike) {
    return { isBot: false, status: "Human-like visit" };
  }

  return {
    isBot: false,
    botCategory: "suspicious",
    status: "Suspicious",
  };
}
