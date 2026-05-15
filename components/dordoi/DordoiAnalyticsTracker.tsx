"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import type { DordoiFirstTouchPayload, DordoiLocale } from "@/lib/dordoi/analytics/types";

const STORAGE_VISITOR = "dordoi_visitor_id";
const STORAGE_SESSION = "dordoi_session_id";
const STORAGE_FIRST_TOUCH = "dordoi_first_touch";
const STORAGE_UTM_SESSION = "dordoi_utm_session";
const STORAGE_VISITED = "dordoi_visited";
const MS_30D = 30 * 24 * 60 * 60 * 1000;

const MAX_HREF = 300;
const MAX_LABEL = 120;

type DordoiFirstTouchStored = DordoiFirstTouchPayload & {
  firstPath: string;
  firstSearch: string;
  firstReferrer: string;
  createdAt: string;
};

type DordoiUtmSessionStored = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gclid?: string;
  yclid?: string;
};

type DordoiVisitedMark = {
  until: number;
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
  | "yclidPresent"
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
    yclidPresent: g("yclid"),
  };
}

function readUtmSession(): DordoiUtmSessionStored {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_UTM_SESSION);
    if (!raw) return {};
    const o = JSON.parse(raw) as DordoiUtmSessionStored;
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeUtmSession(data: DordoiUtmSessionStored): void {
  sessionStorage.setItem(STORAGE_UTM_SESSION, JSON.stringify(data));
}

function syncUtmSessionFromSearch(search: string): DordoiUtmSessionStored {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const next: DordoiUtmSessionStored = { ...readUtmSession() };
  const pick = (param: string, key: keyof DordoiUtmSessionStored) => {
    const v = q.get(param)?.trim();
    if (v) next[key] = v;
  };
  pick("utm_source", "utmSource");
  pick("utm_medium", "utmMedium");
  pick("utm_campaign", "utmCampaign");
  pick("gclid", "gclid");
  pick("yclid", "yclid");
  writeUtmSession(next);
  return next;
}

function syncUtmSessionFromParams(
  searchParams: URLSearchParams,
): DordoiUtmSessionStored {
  const next: DordoiUtmSessionStored = { ...readUtmSession() };
  const pick = (param: string, key: keyof DordoiUtmSessionStored) => {
    const v = searchParams.get(param)?.trim();
    if (v) next[key] = v;
  };
  pick("utm_source", "utmSource");
  pick("utm_medium", "utmMedium");
  pick("utm_campaign", "utmCampaign");
  pick("gclid", "gclid");
  pick("yclid", "yclid");
  writeUtmSession(next);
  return next;
}

function hasValidVisitedMark(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_VISITED);
    if (!raw) return false;
    const o = JSON.parse(raw) as DordoiVisitedMark;
    if (!o?.until || !Number.isFinite(o.until) || Date.now() >= o.until) {
      localStorage.removeItem(STORAGE_VISITED);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function writeVisitedMark(): void {
  const mark: DordoiVisitedMark = { until: Date.now() + MS_30D };
  localStorage.setItem(STORAGE_VISITED, JSON.stringify(mark));
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

  const utmFromUrl = parseUtmFromSearch(search);
  const utmSession = readUtmSession();
  const snap: DordoiFirstTouchStored = {
    firstPath: clip(pathname, 500),
    firstSearch: clip(search, 2000),
    firstReferrer: clip(typeof document !== "undefined" ? document.referrer : "", 2000),
    utmSource: utmFromUrl.utmSource ?? utmSession.utmSource,
    utmMedium: utmFromUrl.utmMedium ?? utmSession.utmMedium,
    utmCampaign: utmFromUrl.utmCampaign ?? utmSession.utmCampaign,
    gclidPresent: utmFromUrl.gclidPresent || Boolean(utmSession.gclid),
    gbraidPresent: utmFromUrl.gbraidPresent,
    wbraidPresent: utmFromUrl.wbraidPresent,
    yclidPresent: utmFromUrl.yclidPresent || Boolean(utmSession.yclid),
    visitorId: clip(visitorId, 200),
    sessionId: clip(sessionId, 200),
    createdAt: new Date().toISOString(),
  };
  writeFirstTouch(snap);
  return snap;
}

function utmPayloadForPost(
  utmSession: DordoiUtmSessionStored,
): Record<string, string | undefined> {
  return {
    utmSource: utmSession.utmSource,
    utmMedium: utmSession.utmMedium,
    utmCampaign: utmSession.utmCampaign,
    gclid: utmSession.gclid,
    yclid: utmSession.yclid,
  };
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

function DordoiAnalyticsTrackerInner({ locale }: DordoiAnalyticsTrackerProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const clickAttached = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    syncUtmSessionFromParams(searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname || "/";
    if (isExcludedPath(path)) return;

    if (hasValidVisitedMark()) return;

    const searchNow = window.location.search ?? "";
    const utmSession = syncUtmSessionFromSearch(searchNow);
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    ensureFirstTouchSnapshot(path, searchNow, visitorId, sessionId);

    writeVisitedMark();

    void (async () => {
      const firstTouch = readFirstTouch();
      await postEvent({
        eventType: "first_visit",
        path: clip(path + searchNow, 2000),
        search: clip(searchNow, 4000),
        referrer: clip(document.referrer || "", 2000),
        locale,
        sessionId,
        visitorId,
        firstTouch: firstTouch ?? undefined,
        ...utmPayloadForPost(utmSession),
        timestamp: new Date().toISOString(),
      });
    })();
  }, [locale, pathname, searchParams]);

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
      const utmSession = readUtmSession();
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
        ...utmPayloadForPost(utmSession),
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

export function DordoiAnalyticsTracker(props: DordoiAnalyticsTrackerProps) {
  return (
    <Suspense fallback={null}>
      <DordoiAnalyticsTrackerInner {...props} />
    </Suspense>
  );
}
