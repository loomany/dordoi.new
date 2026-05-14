/**
 * Аудит: без Instagram + Telegram как номер телефона (не публичный канал).
 *   npx tsx scripts/audit-no-ig-phone-telegram.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

type Row = {
  id: string;
  store_name: string | null;
  status: string;
  application_source: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  phone_number: string | null;
  whatsapp_1: string | null;
};

function digitsOnly(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Извлекает handle/path из t.me ссылки или @username */
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

/**
 * Telegram указывает на личный контакт по номеру, а не на публичный канал/группу.
 * Признаки: path начинается с +, или почти целиком цифры (>=8).
 */
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

function isPublicTelegramChannel(raw: string | null | undefined): boolean {
  const path = telegramPath(raw ?? "");
  if (!path) return false;
  return !isPhoneLikeTelegram(raw);
}

type Scope = "pending" | "all";

const scopeArg = process.argv.find((a) => a.startsWith("--scope="));
const scope: Scope = scopeArg?.split("=")[1] === "all" ? "all" : "pending";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

let q = sb
  .from("vendors")
  .select(
    "id, store_name, status, application_source, instagram_url, telegram_url, phone_number, whatsapp_1",
  )
  .order("store_name");

if (scope === "pending") {
  q = q.in("status", ["pending_moderation", "pending_review"]);
}

const { data, error } = await q;
if (error) {
  console.error(error);
  process.exit(1);
}

const rows = (data ?? []) as Row[];

const noIg = rows.filter((r) => !r.instagram_url?.trim());
const noIgWithTg = noIg.filter((r) => r.telegram_url?.trim());
const noIgPhoneTg = noIgWithTg.filter((r) => isPhoneLikeTelegram(r.telegram_url));
const noIgPublicTg = noIgWithTg.filter((r) => isPublicTelegramChannel(r.telegram_url));
const noIgNoTg = noIg.filter((r) => !r.telegram_url?.trim());

console.log(`=== Без Instagram + Telegram-номер (scope: ${scope}) ===\n`);
console.log("Всего записей:", rows.length);
console.log("Без Instagram:", noIg.length);
console.log("  из них без Telegram вообще:", noIgNoTg.length);
console.log("  из них с Telegram:", noIgWithTg.length);
console.log("    Telegram как номер (не канал):", noIgPhoneTg.length);
console.log("    Telegram как публичный канал (@username):", noIgPublicTg.length);
console.log("");

if (noIgPhoneTg.length > 0) {
  console.log("--- Список: нет IG + TG-номер ---");
  for (const r of noIgPhoneTg) {
    console.log(
      `  ${r.store_name ?? "—"} | ${r.status} | tg=${r.telegram_url?.trim()} | phone=${r.phone_number ?? r.whatsapp_1 ?? "—"}`,
    );
  }
  console.log("");
}

if (noIgPublicTg.length > 0) {
  console.log("--- Для сравнения: нет IG, но TG-канал (первые 15) ---");
  for (const r of noIgPublicTg.slice(0, 15)) {
    console.log(`  ${r.store_name ?? "—"} | ${r.telegram_url?.trim()}`);
  }
  console.log("");
}

const exportLines = noIgPhoneTg.map((r) =>
  [r.store_name ?? "", r.telegram_url?.trim() ?? "", r.phone_number ?? r.whatsapp_1 ?? ""].join("\t"),
);
const outPath = join(root, "reports", `no-ig-phone-telegram-${scope}.tsv`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  `store_name\ttelegram_url\tphone\n${exportLines.join("\n")}\n`,
  "utf8",
);
console.log(`Saved: reports/no-ig-phone-telegram-${scope}.tsv`);
