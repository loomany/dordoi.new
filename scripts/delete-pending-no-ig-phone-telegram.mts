/**
 * Удаляет из очереди модерации магазины без Instagram,
 * у которых Telegram — номер телефона (t.me/+996…), не публичный канал.
 *
 * Dry-run:
 *   npx tsx scripts/delete-pending-no-ig-phone-telegram.mts
 *
 * Удаление:
 *   npx tsx scripts/delete-pending-no-ig-phone-telegram.mts --execute
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
  store_name: string | null;
  status: string;
  instagram_url: string | null;
  telegram_url: string | null;
};

function digitsOnly(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

function telegramPath(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  if (s.startsWith("@")) return s.slice(1);
  if (!s.startsWith("http")) s = `https://${s.replace(/^\/\//, "")}`;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (host === "t.me" || host === "telegram.me" || host.endsWith(".t.me")) {
      return decodeURIComponent(u.pathname.replace(/^\/+/, "").split("/")[0] ?? "");
    }
  } catch {
    /* fall through */
  }
  return s.replace(/^.*t\.me\//i, "").split("/")[0] ?? "";
}

function isPhoneLikeTelegram(raw: string | null | undefined): boolean {
  const path = telegramPath(raw ?? "");
  if (!path) return false;
  if (path.startsWith("+")) return true;
  const d = digitsOnly(path);
  if (d.length >= 8 && d.length / path.replace(/[\s\-()]/g, "").length >= 0.85) {
    return true;
  }
  return false;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("id, store_name, status, instagram_url, telegram_url")
  .in("status", ["pending_moderation", "pending_review"]);

if (error) {
  console.error(error);
  process.exit(1);
}

const toDelete = (data ?? []).filter((r: Row) => {
  if (r.instagram_url?.trim()) return false;
  if (!r.telegram_url?.trim()) return false;
  return isPhoneLikeTelegram(r.telegram_url);
}) as Row[];

console.log(
  `=== Delete pending: no IG + phone Telegram (${execute ? "EXECUTE" : "dry-run"}) ===\n`,
);
console.log("Candidates:", toDelete.length);
console.log("");

for (const r of toDelete) {
  console.log(
    `${execute ? "DELETE" : "would delete"} ${r.id} | ${r.store_name ?? "—"} | ${r.telegram_url?.trim()}`,
  );
}

if (!execute) {
  console.log("\nNo rows deleted. Re-run with --execute to apply.");
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (const r of toDelete) {
  const { error: delErr } = await sb.from("vendors").delete().eq("id", r.id);
  if (delErr) {
    failed++;
    console.error(`FAILED ${r.id}:`, delErr.message);
  } else {
    deleted++;
  }
}

console.log(`\nDeleted: ${deleted}, failed: ${failed}`);

const { count } = await sb
  .from("vendors")
  .select("id", { count: "exact", head: true })
  .in("status", ["pending_moderation", "pending_review"]);

console.log("Remaining in pending queue:", count ?? "?");
