/**
 * Full-site i18n audit (every public route + SEO + all vendors × kk/kg/uz/tj)
 * and optional auto-fix via OpenAI (messages + vendor DB).
 *
 *   npm run i18n:full
 *   npm run i18n:full -- --base=https://dordoi.help
 *   npm run i18n:full -- --skip-fix
 *   npm run i18n:full -- --skip-live
 *   npm run i18n:full -- --rounds=1
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import OpenAI from "openai";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["kk", "kg", "uz", "tj"] as const;
type Locale = (typeof LOCALES)[number];

const FIXABLE_MESSAGE_KINDS = new Set([
  "messages-missing",
  "messages-empty",
  "messages-identical-ru",
  "messages-wrong-script",
]);

const FIXABLE_VENDOR_KINDS = new Set([
  "vendor-db-missing-i18n",
  "vendor-db-identical-ru",
  "vendor-db-stale",
]);

type AuditIssue = {
  kind: string;
  locale: string;
  path: string;
  field?: string;
  detail: string;
};

type AuditReport = {
  totalIssues: number;
  summary: Record<string, number>;
  issues: AuditIssue[];
};

const LOCALE_HINTS: Record<string, string> = {
  kk: "Kazakh (Cyrillic), natural UI wording.",
  kg: "Kyrgyz (Cyrillic), natural UI wording.",
  uz: "Uzbek in Latin script (lotin), natural UI wording.",
  tj: "Tajik (Cyrillic), natural UI wording.",
};

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function loadEnvLocal(): void {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function flattenLeaves(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[p] = v;
    else Object.assign(out, flattenLeaves(v, p));
  }
  return out;
}

function setLeafAtPath(
  root: Record<string, unknown>,
  parts: string[],
  value: string,
): void {
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (!isObject(cur[k])) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function run(cmd: string): void {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: process.env });
}

function runAudit(reportPath: string): AuditReport {
  const extra: string[] = [`--json=${reportPath}`, "--warn-only"];
  const base = parseArg("base");
  const skipLive = hasFlag("skip-live");
  const vendorLimit = parseArg("vendor-limit");
  if (base) extra.push(`--base=${base}`);
  if (skipLive) extra.push("--skip-live");
  if (vendorLimit) extra.push(`--vendor-limit=${vendorLimit}`);

  run(`npx tsx scripts/audit-full-i18n.mts ${extra.join(" ")}`);
  return JSON.parse(readFileSync(reportPath, "utf8")) as AuditReport;
}

function messageKeysFromIssues(issues: AuditIssue[]): Map<Locale, Set<string>> {
  const map = new Map<Locale, Set<string>>();
  for (const loc of LOCALES) map.set(loc, new Set());

  for (const issue of issues) {
    if (!FIXABLE_MESSAGE_KINDS.has(issue.kind)) continue;
    if (!LOCALES.includes(issue.locale as Locale)) continue;
    if (!issue.field) continue;
    map.get(issue.locale as Locale)!.add(issue.field);
  }
  return map;
}

async function translateMessageKeys(
  locale: Locale,
  keys: string[],
): Promise<number> {
  if (keys.length === 0) return 0;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4o-mini";
  if (!apiKey) {
    console.error("OPENAI_API_KEY missing — skip message auto-fix");
    return 0;
  }

  const ruFlat = flattenLeaves(
    JSON.parse(readFileSync(join(ROOT, "messages", "ru.json"), "utf8")),
  );
  const locPath = join(ROOT, "messages", `${locale}.json`);
  const loc = JSON.parse(readFileSync(locPath, "utf8")) as Record<string, unknown>;
  const client = new OpenAI({ apiKey });
  const langHint = LOCALE_HINTS[locale] ?? locale;
  const batchSize = 35;
  let written = 0;

  console.log(`\n[fix] ${locale}: re-translating ${keys.length} message keys via AI\n`);

  for (let i = 0; i < keys.length; i += batchSize) {
    const slice = keys.slice(i, i + batchSize);
    const payload: Record<string, string> = {};
    for (const k of slice) {
      const ru = ruFlat[k];
      if (typeof ru === "string" && ru.trim()) payload[k] = ru;
    }
    if (Object.keys(payload).length === 0) continue;

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `Translate UI strings from Russian for locale "${locale}". ${langHint} ` +
            `Never use Chinese/Japanese characters. Never leave Russian text unless it is a proper noun. ` +
            `Return JSON { [dotKey]: string } with the same keys. ` +
            `Preserve placeholders {name}, {vendorName}, {contacts}, etc. ` +
            `Keep verbatim: Dordoi.help, WhatsApp, Telegram, Instagram, URLs, emails.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");
    const translated = JSON.parse(raw) as Record<string, string>;

    for (const key of Object.keys(payload)) {
      const v = translated[key];
      if (typeof v !== "string" || !v.trim()) {
        throw new Error(`Missing translation for ${key}`);
      }
      setLeafAtPath(loc, key.split("."), v);
      written++;
    }
    console.log(
      `  batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(keys.length / batchSize)}`,
    );
  }

  writeFileSync(locPath, JSON.stringify(loc, null, 2) + "\n", "utf8");
  return written;
}

async function autoFix(report: AuditReport): Promise<void> {
  const msgKeys = messageKeysFromIssues(report.issues);
  let targeted = 0;
  for (const locale of LOCALES) {
    const keys = [...msgKeys.get(locale)!];
    targeted += await translateMessageKeys(locale, keys);
  }

  const vendorIssues = report.issues.filter((i) =>
    FIXABLE_VENDOR_KINDS.has(i.kind),
  );
  if (targeted > 0 || vendorIssues.length > 0) {
    if (targeted === 0) {
      console.log("\n[fix] messages: running align pass for missing / RU-identical keys\n");
    }
    run("npm run translate:messages:all");
  }

  if (vendorIssues.length > 0) {
    console.log(
      `\n[fix] vendors: ${vendorIssues.length} DB issues — running translate:vendors:all\n`,
    );
    run("npm run translate:vendors:all");
  }
}

function countFixable(issues: AuditIssue[]): number {
  return issues.filter(
    (i) =>
      FIXABLE_MESSAGE_KINDS.has(i.kind) ||
      FIXABLE_VENDOR_KINDS.has(i.kind) ||
      i.kind === "live-faq-ru-leak" ||
      i.kind === "live-faq-wrong-script" ||
      i.kind === "live-page-ru-leak" ||
      i.kind === "static-identical-ru" ||
      i.kind === "static-empty",
  ).length;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const skipFix = hasFlag("skip-fix");
  const rounds = Math.max(1, Number(parseArg("rounds") ?? "2"));
  mkdirSync(join(ROOT, "reports"), { recursive: true });

  console.log(
    "=== i18n:full — audit every route × kk/kg/uz/tj" +
      (skipFix ? " (audit only)" : " + AI auto-fix") +
      " ===\n",
  );

  let lastReport: AuditReport | null = null;

  for (let round = 1; round <= rounds; round++) {
    const reportPath = join(ROOT, "reports", `i18n-full-round-${round}.json`);
    console.log(`\n──────── Round ${round}/${rounds}: audit ────────\n`);
    lastReport = runAudit(reportPath);

    const fixable = countFixable(lastReport.issues);
    console.log(
      `\nRound ${round} summary: ${lastReport.totalIssues} issues (${fixable} potentially auto-fixable)`,
    );
    console.log(`Report: ${reportPath}\n`);

    if (skipFix || round >= rounds || fixable === 0) break;

    console.log(`\n──────── Round ${round}: auto-fix ────────\n`);
    await autoFix(lastReport);
  }

  const finalPath = join(ROOT, "reports", "i18n-full-latest.json");
  if (lastReport) {
    writeFileSync(finalPath, JSON.stringify(lastReport, null, 2), "utf8");
    console.log(`Final report: ${finalPath}`);
  }

  const remaining = lastReport?.totalIssues ?? 0;
  const liveFails =
    lastReport?.summary?.["live-fetch-fail"] ??
    lastReport?.issues.filter((i) => i.kind === "live-fetch-fail").length ??
    0;

  if (remaining === 0) {
    console.log("\n✓ All checks passed.\n");
    process.exit(0);
  }

  if (remaining === liveFails && liveFails > 0) {
    console.log(
      `\n⚠ ${liveFails} live fetch failures (site down or wrong --base). Messages/DB may still be OK.\n`,
    );
    process.exit(1);
  }

  console.log(`\n✗ ${remaining} issues remain after ${rounds} round(s).\n`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
