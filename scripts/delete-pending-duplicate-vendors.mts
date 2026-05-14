/**
 * Удаляет из очереди админки pending-записи, дублирующие уже опубликованных продавцов.
 *
 * Dry-run (по умолчанию):
 *   npx tsx scripts/delete-pending-duplicate-vendors.mts
 *
 * Реальное удаление:
 *   npx tsx scripts/delete-pending-duplicate-vendors.mts --execute
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const execute = process.argv.includes("--execute");

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

function findLiveMatch(
  p: Row,
  approvedByGoogle: Map<string, Row[]>,
  approvedByPhone: Map<string, Row[]>,
  approvedByInstagram: Map<string, Row[]>,
  approvedByStoreLoc: Map<string, Row[]>,
): Row | null {
  const gp = p.google_place_id?.trim();
  if (gp) {
    for (const a of approvedByGoogle.get(gp) ?? []) {
      if (a.id !== p.id) return a;
    }
  }
  for (const phone of [p.phone_number, p.whatsapp_1]) {
    const d = digitsOnly(phone);
    if (d.length >= 8) {
      for (const a of approvedByPhone.get(d) ?? []) {
        if (a.id !== p.id) return a;
      }
    }
  }
  const ig = normInstagram(p.instagram_url);
  if (ig) {
    for (const a of approvedByInstagram.get(ig) ?? []) {
      if (a.id !== p.id) return a;
    }
  }
  const sk = `${normStore(p.store_name)}|${normLoc(p.location_row)}`;
  if (normStore(p.store_name) && normLoc(p.location_row)) {
    for (const a of approvedByStoreLoc.get(sk) ?? []) {
      if (a.id !== p.id) return a;
    }
  }
  return null;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data: pending, error: pendingErr } = await sb
  .from("vendors")
  .select(
    "id, slug, seo_slug, store_name, status, phone_number, whatsapp_1, instagram_url, google_place_id, location_row, application_source",
  )
  .in("status", ["pending_moderation", "pending_review"]);

if (pendingErr) {
  console.error("pending query failed:", pendingErr);
  process.exit(1);
}

const { data: approved, error: approvedErr } = await sb
  .from("vendors")
  .select(
    "id, slug, seo_slug, store_name, status, phone_number, whatsapp_1, instagram_url, google_place_id, location_row",
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
  const sk = `${normStore(a.store_name)}|${normLoc(a.location_row)}`;
  if (normStore(a.store_name)) {
    const list = approvedByStoreLoc.get(sk) ?? [];
    list.push(a);
    approvedByStoreLoc.set(sk, list);
  }
}

const toDelete: { pending: Row; live: Row }[] = [];
for (const p of pendingRows) {
  const live = findLiveMatch(
    p,
    approvedByGoogle,
    approvedByPhone,
    approvedByInstagram,
    approvedByStoreLoc,
  );
  if (live) toDelete.push({ pending: p, live });
}

console.log(`=== Delete pending duplicates (${execute ? "EXECUTE" : "dry-run"}) ===\n`);
console.log("Pending in queue:", pendingRows.length);
console.log("Duplicates to delete:", toDelete.length);
console.log("");

for (const { pending: p, live } of toDelete) {
  console.log(
    `${execute ? "DELETE" : "would delete"} pending ${p.id} | ${p.store_name ?? "—"} → live ${live.seo_slug ?? live.slug}`,
  );
}

if (!execute) {
  console.log("\nNo rows deleted. Re-run with --execute to apply.");
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (const { pending: p } of toDelete) {
  const { error } = await sb.from("vendors").delete().eq("id", p.id);
  if (error) {
    failed++;
    console.error(`FAILED ${p.id}:`, error.message);
  } else {
    deleted++;
  }
}

console.log(`\nDeleted: ${deleted}, failed: ${failed}`);
console.log("Remaining pending:", pendingRows.length - deleted);
