import type { DordoiDeviceInfo } from "@/lib/dordoi/analytics/types";

export function parseDordoiDevice(ua: string | null | undefined): DordoiDeviceInfo {
  const raw = ua?.trim() ?? "";
  if (!raw) {
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  }
  const u = raw.toLowerCase();

  let os = "Unknown";
  if (u.includes("windows nt")) os = "Windows";
  else if (u.includes("iphone") || u.includes("ipad") || u.includes("ios")) os = "iOS";
  else if (u.includes("android")) os = "Android";
  else if (u.includes("mac os x") || u.includes("macintosh")) os = "macOS";
  else if (u.includes("cros")) os = "ChromeOS";
  else if (u.includes("linux")) os = "Linux";

  let browser = "Unknown";
  if (u.includes("edg/")) browser = "Edge";
  else if (u.includes("opr/") || u.includes("opera")) browser = "Opera";
  else if (u.includes("chrome") && !u.includes("chromium")) browser = "Chrome";
  else if (u.includes("chromium")) browser = "Chromium";
  else if (u.includes("firefox")) browser = "Firefox";
  else if (u.includes("safari") && !u.includes("chrome")) browser = "Safari";

  let device: string = "Unknown";
  if (u.includes("ipad") || (u.includes("tablet") && !u.includes("mobile"))) {
    device = "Tablet";
  } else if (
    u.includes("mobile") ||
    u.includes("iphone") ||
    (u.includes("android") && u.includes("mobile"))
  ) {
    device = "Mobile";
  } else if (
    u.includes("windows") ||
    u.includes("macintosh") ||
    u.includes("linux") ||
    u.includes("x11")
  ) {
    device = "Desktop";
  }

  if (device === "Unknown" && (u.includes("iphone") || u.includes("android"))) {
    device = "Mobile";
  }

  return { browser, os, device };
}
