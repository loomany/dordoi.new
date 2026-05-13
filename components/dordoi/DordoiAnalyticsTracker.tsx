"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import type { DordoiFirstTouchPayload, DordoiLocale } from "@/lib/dordoi/analytics/types";

const STORAGE_VISITOR = "dordoi_visitor_id";
const STORAGE_SESSION = "dordoi_session_id";
const STORAGE_FIRST_TOUCH = "dordoi_first_touch";
const SESSION_FIRST_VISIT = "dordoi_first_visit_sent";
const LOCAL_LAST_FIRST_VISIT = "dordoi_last_first_visit_notified_at";
const MS_24H = 24 * 60 * 60 * 1000;

const MAX_HREF = 300;
const MAX_LABEL = 120;

type DordoiFirstTouchStored = DordoiFirstTouchPayload & {
  firstPath: string;
  firstSearch: string;
  firstReferrer: string;
  createdAt: string;
};

const ALLOWED_DATA_EVENTS = new Set([
  "seller_registration_started",
  "contact_click",
]);

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function isExcludedPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.includes("/cabinet")) return true;
  if (p.includes("/api")) return true;
  if (p.includes("/_next")) return true;
  if (p.includes("/legacy")) return true;
  if (p.includes("scholarship") || p.includes("scholarships")) return true;
  if (/\.(ico|png|jpe?g|webp|svg|gif|css|js|woff2?|ttf|map|txt|xml|json|pdf|zip)$/i.test(p)) {
    return true;
  }
  return false;
}

function parseUtmFromSearch(search: string): Pick<
  DordoiFirstTouchPayload,
  | "utmSource"
  | "utmMedium"
  | "utmCampaign"
  | "utmContent"
  | "utmTerm"
  | "gclidPresent"
  | "gbraidPresent"
  | "wbraidPresent"
> {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const g = (k: string) => Boolean(q.get(k)?.trim());
  return {
    utmSource: q.get("utm_source")?.trim() || undefined,
    utmMedium: q.get("utm_medium")?.trim() || undefined,
    utmCampaign: q.get("utm_campaign")?.trim() || undefined,
    utmContent: q.get("utm_content")?.trim() || undefined,
    utmTerm: q.get("utm_term")?.trim() || undefined,
    gclidPresent: g("gclid"),
    gbraidPresent: g("gbraid"),
    wbraidPresent: g("wbraid"),
  };
}

function readFirstTouch(): DordoiFirstTouchStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_FIRST_TOUCH);
    if (!raw) return null;
    const o = JSON.parse(raw) as DordoiFirstTouchStored;
    if (!o || typeof o.firstPath !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

function writeFirstTouch(data: DordoiFirstTouchStored): void {
  localStorage.setItem(STORAGE_FIRST_TOUCH, JSON.stringify(data));
}

function getVisitorId(): string {
  let v = localStorage.getItem(STORAGE_VISITOR);
  if (!v || v.length < 4) {
    v = crypto.randomUUID();
    localStorage.setItem(STORAGE_VISITOR, v);
  }
  return v;
}

function getSessionId(): string {
  let s = sessionStorage.getItem(STORAGE_SESSION);
  if (!s || s.length < 4) {
    s = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_SESSION, s);
  }
  return s;
}

function ensureFirstTouchSnapshot(
  pathname: string,
  search: string,
  visitorId: string,
  sessionId: string,
): DordoiFirstTouchStored | null {
  if (readFirstTouch()) return readFirstTouch();
  if (isExcludedPath(pathname)) return null;

  const utm = parseUtmFromSearch(search);
  const snap: DordoiFirstTouchStored = {
    firstPath: clip(pathname, 500),
    firstSearch: clip(search, 2000),
    firstReferrer: clip(typeof document !== "undefined" ? document.referrer : "", 2000),
    ...utm,
    visitorId: clip(visitorId, 200),
    sessionId: clip(sessionId, 200),
    createdAt: new Date().toISOString(),
  };
  writeFirstTouch(snap);
  return snap;
}

async function postEvent(body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/dordoi/analytics/event", {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { skippedReason?: string };
    if (data?.skippedReason === "rate_limited") return false;
    return true;
  } catch {
    return false;
  }
}

function labelFromElement(el: Element | null): string {
  if (!el) return "";
  const a = el.closest("a");
  if (!a) return "";
  const aria = a.getAttribute("aria-label")?.trim();
  if (aria) return clip(aria, MAX_LABEL);
  const title = a.getAttribute("title")?.trim();
  if (title) return clip(title, MAX_LABEL);
  const text = a.textContent?.trim().replace(/\s+/g, " ") ?? "";
  return clip(text, MAX_LABEL);
}

export type DordoiAnalyticsTrackerProps = {
  locale: DordoiLocale;
};

export function DordoiAnalyticsTracker({ locale }: DordoiAnalyticsTrackerProps) {
  const pathname = usePathname() ?? "/";
  const clickAttached = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname || "/";
    if (isExcludedPath(path)) return;

    if (sessionStorage.getItem(SESSION_FIRST_VISIT) === "1") return;

    const lastRaw = localStorage.getItem(LOCAL_LAST_FIRST_VISIT);
    if (lastRaw) {
      const lastMs = Number(lastRaw);
      if (Number.isFinite(lastMs) && Date.now() - lastMs < MS_24H) {
        return;
      }
    }

    const searchNow = window.location.search ?? "";
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    ensureFirstTouchSnapshot(path, searchNow, visitorId, sessionId);

    void (async () => {
      const firstTouch = readFirstTouch();
      const ok = await postEvent({
        eventType: "first_visit",
        path: clip(path + searchNow, 2000),
        search: clip(searchNow, 4000),
        referrer: clip(document.referrer || "", 2000),
        locale,
        sessionId,
        visitorId,
        firstTouch: firstTouch ?? undefined,
        timestamp: new Date().toISOString(),
      });
      if (ok) {
        sessionStorage.setItem(SESSION_FIRST_VISIT, "1");
        localStorage.setItem(LOCAL_LAST_FIRST_VISIT, String(Date.now()));
      }
    })();
  }, [locale, pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || clickAttached.current) return;
    clickAttached.current = true;

    const handler = (ev: MouseEvent) => {
      const path = window.location.pathname || "/";
      if (isExcludedPath(path)) return;

      const t = ev.target;
      if (!(t instanceof Element)) return;

      const a = t.closest("a[href]");
      const hrefRaw = a?.getAttribute("href")?.trim() ?? "";
      const hrefLower = hrefRaw.toLowerCase();

      const customHost = t.closest("[data-analytics-event]");
      const customEv = customHost
        ?.getAttribute("data-analytics-event")
        ?.trim() ?? "";

      let eventType:
        | "whatsapp_click"
        | "telegram_click"
        | "phone_click"
        | "contact_click"
        | "seller_registration_started"
        | null = null;

      if (hrefRaw.startsWith("tel:")) {
        eventType = "phone_click";
      } else if (hrefLower.includes("wa.me") || hrefLower.includes("whatsapp")) {
        eventType = "whatsapp_click";
      } else if (hrefLower.includes("t.me") || hrefLower.includes("telegram")) {
        eventType = "telegram_click";
      } else if (hrefRaw.startsWith("mailto:")) {
        eventType = "contact_click";
      }

      if (!eventType && customEv && ALLOWED_DATA_EVENTS.has(customEv)) {
        if (customEv === "seller_registration_started") {
          eventType = "seller_registration_started";
        } else if (customEv === "contact_click") {
          eventType = "contact_click";
        }
      }

      if (!eventType) return;

      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const ft = readFirstTouch();
      const targetHref = hrefRaw ? clip(hrefRaw, MAX_HREF) : undefined;
      const targetLabel = a
        ? labelFromElement(t)
        : clip(
            customHost?.textContent?.trim().replace(/\s+/g, " ") ?? "",
            MAX_LABEL,
          );

      void postEvent({
        eventType,
        path: clip(path + (window.location.search || ""), 2000),
        search: clip(window.location.search || "", 4000),
        referrer: clip(document.referrer || "", 2000),
        locale,
        sessionId,
        visitorId,
        firstTouch: ft ?? undefined,
        targetHref: targetHref || undefined,
        targetLabel: targetLabel || undefined,
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener("click", handler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      clickAttached.current = false;
    };
  }, [locale]);

  return null;
}
