/**
 * Audit: vendors in admin «Ожидают решения» vs already published (approved).
 *   npx tsx scripts/audit-admin-pending-vs-published.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

type Row = {
  id: string;
  slug: string | null;
  seo_slug: string | null;
  store_name: string | null;
  status: string;
  phone_number: string | null;
  whatsapp_1: string | null;
  instagram_url: string | null;
  google_place_id: string | null;
  location_row: string | null;
  application_source: string | null;
  approved_at: string | null;
  created_at: string;
};

function digitsOnly(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

function normInstagram(v: string | null | undefined): string {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return "";
  return s
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "")
    .replace(/^@/, "");
}

function normStore(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normLoc(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data: pending, error: pendingErr } = await sb
  .from("vendors")
  .select(
    "id, slug, seo_slug, store_name, status, phone_number, whatsapp_1, instagram_url, google_place_id, location_row, application_source, approved_at, created_at",
  )
  .in("status", ["pending_moderation", "pending_review"])
  .order("created_at", { ascending: false });

if (pendingErr) {
  console.error("pending query failed:", pendingErr);
  process.exit(1);
}

const { data: approved, error: approvedErr } = await sb
  .from("vendors")
  .select(
    "id, slug, seo_slug, store_name, status, phone_number, whatsapp_1, instagram_url, google_place_id, location_row, application_source, approved_at, created_at",
  )
  .eq("status", "approved")
  .not("slug", "is", null);

if (approvedErr) {
  console.error("approved query failed:", approvedErr);
  process.exit(1);
}

const pendingRows = (pending ?? []) as Row[];
const approvedRows = (approved ?? []) as Row[];

const approvedByGoogle = new Map<string, Row[]>();
const approvedByPhone = new Map<string, Row[]>();
const approvedByInstagram = new Map<string, Row[]>();
const approvedBySlug = new Map<string, Row>();
const approvedBySeoSlug = new Map<string, Row>();
const approvedByStoreLoc = new Map<string, Row[]>();

for (const a of approvedRows) {
  const gp = a.google_place_id?.trim();
  if (gp) {
    const list = approvedByGoogle.get(gp) ?? [];
    list.push(a);
    approvedByGoogle.set(gp, list);
  }
  for (const phone of [a.phone_number, a.whatsapp_1]) {
    const d = digitsOnly(phone);
    if (d.length >= 8) {
      const list = approvedByPhone.get(d) ?? [];
      list.push(a);
      approvedByPhone.set(d, list);
    }
  }
  const ig = normInstagram(a.instagram_url);
  if (ig) {
    const list = approvedByInstagram.get(ig) ?? [];
    list.push(a);
    approvedByInstagram.set(ig, list);
  }
  const slug = a.slug?.trim();
  if (slug) approvedBySlug.set(slug, a);
  const seo = a.seo_slug?.trim();
  if (seo) approvedBySeoSlug.set(seo, a);
  const sk = `${normStore(a.store_name)}|${normLoc(a.location_row)}`;
  if (normStore(a.store_name)) {
    const list = approvedByStoreLoc.get(sk) ?? [];
    list.push(a);
    approvedByStoreLoc.set(sk, list);
  }
}

type Match = {
  pending: Row;
  approved: Row;
  reason: string;
};

const matches: Match[] = [];
const seenPairs = new Set<string>();

function addMatch(p: Row, a: Row, reason: string) {
  const key = `${p.id}:${a.id}:${reason}`;
  if (seenPairs.has(key)) return;
  seenPairs.add(key);
  matches.push({ pending: p, approved: a, reason });
}

for (const p of pendingRows) {
  const gp = p.google_place_id?.trim();
  if (gp) {
    for (const a of approvedByGoogle.get(gp) ?? []) {
      if (a.id !== p.id) addMatch(p, a, "google_place_id");
    }
  }
  for (const phone of [p.phone_number, p.whatsapp_1]) {
    const d = digitsOnly(phone);
    if (d.length >= 8) {
      for (const a of approvedByPhone.get(d) ?? []) {
        if (a.id !== p.id) addMatch(p, a, "phone/whatsapp");
      }
    }
  }
  const ig = normInstagram(p.instagram_url);
  if (ig) {
    for (const a of approvedByInstagram.get(ig) ?? []) {
      if (a.id !== p.id) addMatch(p, a, "instagram_url");
    }
  }
  const slug = p.slug?.trim();
  if (slug) {
    const a = approvedBySlug.get(slug);
    if (a && a.id !== p.id) addMatch(p, a, "slug");
  }
  const seo = p.seo_slug?.trim();
  if (seo) {
    const a = approvedBySeoSlug.get(seo);
    if (a && a.id !== p.id) addMatch(p, a, "seo_slug");
  }
  const sk = `${normStore(p.store_name)}|${normLoc(p.location_row)}`;
  if (normStore(p.store_name) && normLoc(p.location_row)) {
    for (const a of approvedByStoreLoc.get(sk) ?? []) {
      if (a.id !== p.id) addMatch(p, a, "store_name+location_row");
    }
  }
}

const pendingWithApprovedAt = pendingRows.filter((p) => Boolean(p.approved_at?.trim()));
const pendingWithSlug = pendingRows.filter((p) => Boolean(p.slug?.trim()));

console.log("=== Admin pending vs published audit ===\n");
console.log("Pending queue (pending_moderation + pending_review):", pendingRows.length);
console.log("Published (approved + slug):", approvedRows.length);
console.log("Pending with approved_at set (anomaly):", pendingWithApprovedAt.length);
console.log("Pending with slug assigned:", pendingWithSlug.length);
console.log("Cross-matches (pending ↔ approved duplicate signals):", matches.length);
console.log("");

const byReason = new Map<string, number>();
for (const m of matches) {
  byReason.set(m.reason, (byReason.get(m.reason) ?? 0) + 1);
}
if (byReason.size > 0) {
  console.log("Matches by reason:");
  for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${n}`);
  }
  console.log("");
}

if (pendingWithApprovedAt.length > 0) {
  console.log("--- Pending rows with approved_at ---");
  for (const p of pendingWithApprovedAt.slice(0, 20)) {
    console.log(
      `  ${p.id} | ${p.status} | ${p.store_name ?? "—"} | approved_at=${p.approved_at}`,
    );
  }
  console.log("");
}

if (matches.length > 0) {
  const uniquePending = new Set(matches.map((m) => m.pending.id));
  const uniqueLive = new Set(matches.map((m) => m.approved.id));
  console.log("Unique pending vendors with a live duplicate:", uniquePending.size);
  console.log("Unique live vendors matched:", uniqueLive.size);
  console.log("");
  console.log("--- Sample cross-matches (up to 30) ---");
  for (const { pending: p, approved: a, reason } of matches.slice(0, 30)) {
    console.log(`[${reason}]`);
    console.log(
      `  PENDING  id=${p.id} status=${p.status} src=${p.application_source ?? "—"} store=${p.store_name ?? "—"}`,
    );
    console.log(
      `  LIVE     id=${a.id} slug=${a.slug ?? "—"} seo=${a.seo_slug ?? "—"} store=${a.store_name ?? "—"}`,
    );
    console.log(
      `  URLs     /catalog/${a.slug}  /suppliers/${a.seo_slug ?? a.slug}`,
    );
    console.log("");
  }
} else {
  console.log("No pending vendors matched an already-approved published record.");
}

const uniquePendingWithDup = new Set(matches.map((m) => m.pending.id));
const pendingWithoutDup = pendingRows.filter((p) => !uniquePendingWithDup.has(p.id));
console.log("");
console.log("Pending with NO live duplicate signal:", pendingWithoutDup.length);

const pendingSources = new Map<string, number>();
for (const p of pendingRows) {
  const src = p.application_source ?? "(null)";
  pendingSources.set(src, (pendingSources.get(src) ?? 0) + 1);
}
console.log("Pending by application_source:");
for (const [src, n] of [...pendingSources.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${src}: ${n}`);
}
