import type { DordoiVisitorStatus } from "@/lib/dordoi/analytics/types";

const BOT_SUBSTRINGS: Array<{ needle: string; name: string }> = [
  { needle: "googlebot", name: "Googlebot" },
  { needle: "bingbot", name: "Bingbot" },
  { needle: "yandexbot", name: "YandexBot" },
  { needle: "ahrefsbot", name: "AhrefsBot" },
  { needle: "semrushbot", name: "SemrushBot" },
  { needle: "mj12bot", name: "MJ12bot" },
  { needle: "dotbot", name: "DotBot" },
  { needle: "petalbot", name: "PetalBot" },
  { needle: "crawler", name: "crawler" },
  { needle: "spider", name: "spider" },
  { needle: "headlesschrome", name: "HeadlessChrome" },
];

const GENERIC_BOT = "bot";

export function detectDordoiVisitorStatus(
  userAgent: string | null | undefined,
): DordoiVisitorStatus {
  const ua = userAgent?.trim() ?? "";
  if (!ua) {
    return { isBot: false, status: "Suspicious" };
  }
  const lower = ua.toLowerCase();

  for (const { needle, name } of BOT_SUBSTRINGS) {
    if (lower.includes(needle)) {
      return { isBot: true, botName: name, status: "Bot" };
    }
  }

  if (lower.includes(GENERIC_BOT)) {
    const nameMatch = /(?:^|[\s/;()])([a-z0-9._-]*bot[a-z0-9._-]*)(?:[\s/;()]|$)/i.exec(
      ua,
    );
    return {
      isBot: true,
      botName: nameMatch?.[1] ?? "bot",
      status: "Bot",
    };
  }

  const suspiciousSnippets = [
    "curl/",
    "wget/",
    "python-requests",
    "postman",
    "axios/",
    "node-fetch",
  ];
  if (ua.length < 20 || suspiciousSnippets.some((s) => lower.includes(s))) {
    return { isBot: false, status: "Suspicious" };
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

  return { isBot: false, status: "Suspicious" };
}
