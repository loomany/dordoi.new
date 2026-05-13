import "server-only";
import { createHash } from "node:crypto";

const bucket = new Map<string, number>();

function gc(now: number): void {
  if (bucket.size < 4000) return;
  for (const [k, exp] of bucket) {
    if (exp <= now) bucket.delete(k);
  }
}

function take(key: string, ttlMs: number): boolean {
  const now = Date.now();
  gc(now);
  const exp = bucket.get(key);
  if (exp !== undefined && exp > now) return false;
  bucket.set(key, now + ttlMs);
  return true;
}

function hashShort(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

const MIN30 = 30 * 60 * 1000;
const MIN10 = 10 * 60 * 1000;
const MIN5 = 5 * 60 * 1000;
const HOUR24 = 24 * 60 * 60 * 1000;

export function rateLimitFirstVisit(sessionId: string): boolean {
  return take(`dordoi:fv:${sessionId}`, MIN30);
}

/** first_visit dedupe by anonymous visitorId (24h). Key uses hash of visitorId only. */
export function rateLimitFirstVisitByVisitor(visitorId: string): boolean {
  const v = visitorId.trim();
  if (v.length < 4) return false;
  return take(`dordoi:fv:vid:${hashShort(v)}`, HOUR24);
}

export function rateLimitCta(
  sessionId: string,
  eventType: string,
  targetHref: string,
): boolean {
  const hrefKey = hashShort((targetHref || "").slice(0, 500));
  return take(`dordoi:cta:${sessionId}:${eventType}:${hrefKey}`, MIN5);
}

export function rateLimitSellerRegistrationSubmitted(key: string): boolean {
  return take(`dordoi:srs:${key}`, MIN10);
}

export function rateLimitBuyerRequestSubmitted(key: string): boolean {
  return take(`dordoi:brs:${key}`, MIN10);
}

export function rateLimitVendorApplicationSaved(key: string): boolean {
  return take(`dordoi:vas:${key}`, MIN10);
}

export function rateLimitVendorModeration(
  vendorId: string,
  status: "approved" | "rejected",
): boolean {
  return take(`dordoi:vm:${vendorId}:${status}`, MIN30);
}

/** Dedupe site registration admin Telegram: same user, 30 min (key must not contain raw PII). */
export function rateLimitSiteRegistrationCompleted(dedupeToken: string): boolean {
  const t = dedupeToken.trim();
  if (!t) return false;
  return take(`dordoi:site_reg:${t}:registration_completed`, MIN30);
}

/** Dedupe subscription payment admin Telegram per Lemon subscription id. */
export function rateLimitSubscriptionPayment(subscriptionId: string): boolean {
  const id = subscriptionId.trim();
  if (!id) return false;
  return take(`dordoi:sub_pay:${hashShort(id)}`, HOUR24);
}

export function buildSellerRegistrationDedupeKey(input: {
  vendorId?: string;
  applicationId?: string;
  sessionId: string;
  phoneFingerprint?: string;
}): string {
  if (input.vendorId?.trim()) return `v:${input.vendorId.trim()}`;
  if (input.applicationId?.trim()) return `a:${input.applicationId.trim()}`;
  if (input.phoneFingerprint?.trim())
    return `p:${hashShort(input.sessionId + "|" + input.phoneFingerprint)}`;
  return `s:${hashShort(input.sessionId + "|srs")}`;
}

export function buildBuyerRequestDedupeKey(input: {
  requestId?: string;
  sessionId: string;
}): string {
  if (input.requestId?.trim()) return `r:${input.requestId.trim()}`;
  return `s:${hashShort(input.sessionId + "|brs")}`;
}

export function buildVendorApplicationDedupeKey(input: {
  vendorId?: string;
  applicationId?: string;
}): string {
  if (input.vendorId?.trim()) return `v:${input.vendorId.trim()}`;
  if (input.applicationId?.trim()) return `a:${input.applicationId.trim()}`;
  return "none";
}
