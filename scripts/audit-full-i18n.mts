/**
 * Full i18n audit: messages, vendor DB overlays, SEO manifests, live HTML crawl.
 *
 *   npm run audit:i18n
 *   npm run audit:i18n -- --base=http://localhost:3000
 *   npm run audit:i18n -- --locales=uz,kg --vendor-limit=50
 *   npm run audit:i18n -- --skip-live
 *   npm run audit:i18n -- --json=reports/i18n-audit.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { RouteLocale } from "../lib/seo/route-locale";
import type { SeoCategoryRoute } from "../lib/catalog/seo-category-route-data";
import type { CoreSeoLanding } from "../lib/seo/core-seo-landings";

/** Mirrors lib/seo.ts publicRoutes — inlined for script ESM compatibility. */
const PUBLIC_ROUTES = [
  "/",
  "/catalog",
  "/sell",
  "/suppliers",
  "/buyers",
  "/buyer-service",
  "/about",
  "/help",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/refund",
] as const;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_LOCALES = ["kk", "kg", "uz", "tj"] as const satisfies readonly RouteLocale[];
type TargetLocale = (typeof TARGET_LOCALES)[number];

type IssueKind =
  | "messages-missing"
  | "messages-empty"
  | "messages-identical-ru"
  | "messages-wrong-script"
  | "vendor-db-missing-i18n"
  | "vendor-db-identical-ru"
  | "vendor-db-stale"
  | "static-identical-ru"
  | "static-empty"
  | "live-fetch-fail"
  | "live-faq-ru-leak"
  | "live-faq-wrong-script"
  | "live-page-ru-leak";

type Issue = {
  kind: IssueKind;
  locale: TargetLocale | "all";
  path: string;
  field?: string;
  detail: string;
};

const ALLOW_IDENTICAL_VALUES = new Set([
  "FAQ",
  "WhatsApp",
  "Telegram",
  "Instagram",
  "Dordoi.help",
  "2GIS",
  "Google Maps",
  "Бишкек",
  "Кыргызстан",
  "MOQ",
  "VIP",
  "B2B",
  "B2C",
]);

const ALLOW_IDENTICAL_KEY_SUFFIXES = [
  ".contactPhone",
  ".defaultCity",
  ".defaultCountry",
];

/** CJK in kk/kg/uz/tj overlays usually means a bad machine translation. */
const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff]/u;

const RU_LEAK_PHRASES = [
  "Что можно заказать у",
  "Работает ли ",
  " с оптовыми покупателями",
  "Как связаться с",
  "Можно ли заказать товар с доставкой",
  "Как проверить актуальность цен",
  "Чем Dordoi.help помогает покупателю",
  "Есть ли похожие поставщики",
  "Как найти похожих поставщиков",
  "Частые вопросы о",
  "Чем может помочь",
  "предлагает товары в категории",
  "профиль поставщика на Dordoi.help",
  "для закупки оптом",
  "Условия доставки и отправки нужно уточнять",
  "Поставщик ",
  " на рынке Дордой",
  "Женская одежда оптом",
  "Мужская одежда оптом",
  "Каталог поставщиков",
  "Найти байера",
  "Открыть каталог",
  "Главная страница",
];

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parseLocales(): TargetLocale[] {
  const raw = parseArg("locales");
  if (!raw || raw === "all") return [...TARGET_LOCALES];
  const allowed = new Set<string>(TARGET_LOCALES);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TargetLocale => allowed.has(s));
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

function flattenLeaves(
  obj: unknown,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[p] = v;
    else Object.assign(out, flattenLeaves(v, p));
  }
  return out;
}

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (!o || typeof o !== "object") return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

function isAllowedIdentical(key: string, value: string): boolean {
  if (ALLOW_IDENTICAL_VALUES.has(value.trim())) return true;
  return ALLOW_IDENTICAL_KEY_SUFFIXES.some((s) => key.endsWith(s));
}

function stripPlaceholders(s: string): string {
  return s.replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ").trim();
}

function collectRuMarkersFromStrings(strings: string[]): string[] {
  const markers = new Set<string>();
  for (const raw of strings) {
    const s = stripPlaceholders(raw);
    if (s.length < 12) continue;
    markers.add(s.slice(0, Math.min(48, s.length)));
    if (s.length >= 20) markers.add(s);
  }
  for (const p of RU_LEAK_PHRASES) markers.add(p);
  return [...markers].sort((a, b) => b.length - a.length);
}

function extractFaqSummaries(html: string): string[] {
  const out: string[] = [];
  const re = /<summary[^>]*>([\s\S]*?)<\/summary>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text) out.push(text);
  }
  return out;
}

function findRuLeaks(text: string, markers: string[]): string[] {
  const hits: string[] = [];
  for (const marker of markers) {
    if (marker.length < 8) continue;
    if (text.includes(marker)) hits.push(marker.slice(0, 60));
  }
  return hits;
}

function pickVisibleTextSample(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 150_000);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }
  const workers = Math.min(Math.max(1, concurrency), items.length || 1);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function auditMessages(issues: Issue[], locales: TargetLocale[]): void {
  const ru = JSON.parse(readFileSync(join(ROOT, "messages", "ru.json"), "utf8"));
  const ruFlat = flattenLeaves(ru);

  console.log("=== 1/4 Messages (overlay vs ru.json) ===\n");

  for (const locale of locales) {
    const path = join(ROOT, "messages", `${locale}.json`);
    const overlay = JSON.parse(readFileSync(path, "utf8"));
    const locFlat = flattenLeaves(overlay);

    let missing = 0;
    let empty = 0;
    let identical = 0;
    let wrongScript = 0;

    for (const [key, ruVal] of Object.entries(ruFlat)) {
      const locVal = locFlat[key];
      if (locVal === undefined) {
        missing++;
        issues.push({
          kind: "messages-missing",
          locale,
          path: `messages/${locale}.json`,
          field: key,
          detail: "missing overlay key (runtime falls back to RU)",
        });
      } else if (locVal.trim() === "") {
        empty++;
        issues.push({
          kind: "messages-empty",
          locale,
          path: `messages/${locale}.json`,
          field: key,
          detail: "empty string",
        });
      } else if (CJK_RE.test(locVal)) {
        wrongScript++;
        issues.push({
          kind: "messages-wrong-script",
          locale,
          path: `messages/${locale}.json`,
          field: key,
          detail: locVal.slice(0, 100),
        });
      } else if (
        locVal === ruVal &&
        !isAllowedIdentical(key, locVal) &&
        ruVal.trim().length > 3
      ) {
        identical++;
        const isFaq =
          key.includes("vendorFaq") ||
          key.includes("Pages.faq") ||
          key.includes(".faq");
        if (isFaq || ruVal.length >= 16) {
          issues.push({
            kind: "messages-identical-ru",
            locale,
            path: `messages/${locale}.json`,
            field: key,
            detail: locVal.slice(0, 100),
          });
        }
      }
    }

    const vfKeys = Object.keys(ruFlat).filter((k) =>
      k.startsWith("Pages.providerProfile.vendorFaq."),
    );
    const vfMissing = vfKeys.filter((k) => locFlat[k] === undefined).length;
    console.log(
      `${locale}: missing ${missing}, empty ${empty}, cjk ${wrongScript}, identical-ru (reported) ${identical}, vendorFaq missing ${vfMissing}/${vfKeys.length}`,
    );
  }
  console.log("");
}

function auditSeoStatic(
  issues: Issue[],
  locales: TargetLocale[],
  SEO_CATEGORY_ROUTES: SeoCategoryRoute[],
  CORE_SEO_LANDINGS: CoreSeoLanding[],
): string[] {
  console.log("=== 2/4 SEO static manifests ===\n");
  const ruMarkers: string[] = [];

  for (const route of SEO_CATEGORY_ROUTES) {
    for (const item of route.faqByLocale.ru) {
      ruMarkers.push(item.question, item.answer);
    }
    for (const locale of locales) {
      const base = `seo:category:${route.id}`;
      const fields: Array<[string, string, string]> = [
        ["h1", route.h1ByLocale[locale], route.h1ByLocale.ru],
        ["title", route.titleByLocale[locale], route.titleByLocale.ru],
        ["description", route.descriptionByLocale[locale], route.descriptionByLocale.ru],
        ["intro", route.introByLocale[locale], route.introByLocale.ru],
      ];
      for (const [field, val, ruVal] of fields) {
        if (!val.trim()) {
          issues.push({
            kind: "static-empty",
            locale,
            path: base,
            field,
            detail: "empty",
          });
        } else if (val.trim() === ruVal.trim()) {
          issues.push({
            kind: "static-identical-ru",
            locale,
            path: base,
            field,
            detail: val.slice(0, 100),
          });
        }
      }
      const faq = route.faqByLocale[locale];
      const faqRu = route.faqByLocale.ru;
      faq.forEach((item, i) => {
        if (item.question.trim() === (faqRu[i]?.question ?? "").trim()) {
          issues.push({
            kind: "static-identical-ru",
            locale,
            path: base,
            field: `faq[${i}].q`,
            detail: item.question.slice(0, 100),
          });
        }
        if (item.answer.trim() === (faqRu[i]?.answer ?? "").trim()) {
          issues.push({
            kind: "static-identical-ru",
            locale,
            path: base,
            field: `faq[${i}].a`,
            detail: item.answer.slice(0, 100),
          });
        }
      });
    }
  }

  for (const landing of CORE_SEO_LANDINGS) {
    for (const locale of locales) {
      const base = `seo:core:${landing.id}`;
      for (const [field, val, ruVal] of [
        ["h1", landing.h1ByLocale[locale], landing.h1ByLocale.ru],
        ["title", landing.titleByLocale[locale], landing.titleByLocale.ru],
        ["intro", landing.introByLocale[locale], landing.introByLocale.ru],
      ] as const) {
        if (!val.trim()) {
          issues.push({
            kind: "static-empty",
            locale,
            path: base,
            field,
            detail: "empty",
          });
        } else if (val.trim() === ruVal.trim()) {
          issues.push({
            kind: "static-identical-ru",
            locale,
            path: base,
            field,
            detail: val.slice(0, 100),
          });
        }
      }
    }
  }

  const staticIssues = issues.filter(
    (i) => i.kind === "static-identical-ru" || i.kind === "static-empty",
  );
  console.log(`SEO static issues: ${staticIssues.length}`);
  console.log("");
  return ruMarkers;
}

async function auditVendorDb(
  issues: Issue[],
  locales: TargetLocale[],
  admin: SupabaseClient,
): Promise<void> {
  console.log("=== 3/4 Vendor DB (parsed_ai_data.i18n) ===\n");

  const { data, error } = await admin
    .from("vendors")
    .select("slug, parsed_ai_data")
    .eq("status", "approved")
    .not("slug", "is", null);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    slug: string;
    parsed_ai_data: unknown;
  }>;

  let missingAny = 0;
  let identicalDesc = 0;

  for (const row of rows) {
    const pad = row.parsed_ai_data as Record<string, unknown> | null;
    const display = pad?.display as Record<string, unknown> | undefined;
    const ruDesc =
      typeof display?.description === "string" ? display.description.trim() : "";
    const i18n = (pad?.i18n ?? {}) as Record<
      string,
      { description?: string }
    >;
    const meta = pad?.i18nMeta as
      | { sourceFingerprint?: string; translatedAt?: Record<string, string> }
      | undefined;

    for (const locale of locales) {
      const entry = i18n[locale];
      if (!entry?.description?.trim()) {
        missingAny++;
        issues.push({
          kind: "vendor-db-missing-i18n",
          locale,
          path: `vendor:${row.slug}`,
          field: "parsed_ai_data.i18n.description",
          detail: "no localized description",
        });
        continue;
      }
      if (ruDesc && entry.description.trim() === ruDesc) {
        identicalDesc++;
        issues.push({
          kind: "vendor-db-identical-ru",
          locale,
          path: `vendor:${row.slug}`,
          field: "parsed_ai_data.i18n.description",
          detail: ruDesc.slice(0, 80),
        });
      }
      if (meta?.sourceFingerprint && !meta.translatedAt?.[locale]) {
        issues.push({
          kind: "vendor-db-stale",
          locale,
          path: `vendor:${row.slug}`,
          field: "i18nMeta.translatedAt",
          detail: "entry exists but translatedAt missing",
        });
      }
    }
  }

  console.log(
    `Vendors: ${rows.length} | missing i18n desc: ${missingAny} | identical to RU desc: ${identicalDesc}`,
  );
  console.log("");
}

type LiveJob = {
  locale: TargetLocale;
  path: string;
  kind: "vendor" | "seo-category" | "seo-core" | "faq" | "catalog" | "static";
};

async function auditLive(
  issues: Issue[],
  locales: TargetLocale[],
  ruMarkers: string[],
  vendorSlugs: string[],
  SEO_CATEGORY_ROUTES: SeoCategoryRoute[],
  CORE_SEO_LANDINGS: CoreSeoLanding[],
  seoCategoryPath: (locale: RouteLocale, route: SeoCategoryRoute) => string,
): Promise<void> {
  const base = (parseArg("base") ?? "http://localhost:3000").replace(/\/$/, "");
  const concurrency = Number(parseArg("concurrency") ?? "10");
  const vendorLimit = parseArg("vendor-limit")
    ? Number(parseArg("vendor-limit"))
    : undefined;

  const slugs =
    vendorLimit != null && vendorLimit > 0
      ? vendorSlugs.slice(0, vendorLimit)
      : vendorSlugs;

  const jobs: LiveJob[] = [];
  const seen = new Set<string>();
  const push = (job: LiveJob) => {
    const k = `${job.locale}${job.path}`;
    if (seen.has(k)) return;
    seen.add(k);
    jobs.push(job);
  };

  for (const locale of locales) {
    for (const route of PUBLIC_ROUTES) {
      push({
        locale,
        path: route === "/" ? `/${locale}` : `/${locale}${route}`,
        kind: "static",
      });
    }
    push({ locale, path: `/${locale}/faq`, kind: "faq" });
    push({ locale, path: `/${locale}/catalog`, kind: "catalog" });
    for (const landing of CORE_SEO_LANDINGS) {
      push({
        locale,
        path: `/${locale}${landing.path}`,
        kind: "seo-core",
      });
    }
    for (const route of SEO_CATEGORY_ROUTES) {
      push({
        locale,
        path: `/${locale}${seoCategoryPath(locale, route)}`,
        kind: "seo-category",
      });
    }
    for (const slug of slugs) {
      push({
        locale,
        path: `/${locale}/catalog/${encodeURIComponent(slug)}`,
        kind: "vendor",
      });
    }
  }

  console.log(
    `=== 4/4 Live HTML (${base}) — ${jobs.length} URLs, concurrency ${concurrency} ===\n`,
  );

  const ru = JSON.parse(readFileSync(join(ROOT, "messages", "ru.json"), "utf8"));
  const ruVendorFaq = flattenLeaves(getNested(ru, "Pages.providerProfile.vendorFaq"));
  const ruFaqPage = flattenLeaves(getNested(ru, "Pages.faq"));
  const allMarkers = collectRuMarkersFromStrings([
    ...Object.values(ruVendorFaq),
    ...Object.values(ruFaqPage),
    ...ruMarkers,
  ]);

  let fetched = 0;
  let clean = 0;
  let faqChecked = 0;
  let vendorFaqLeaks = 0;

  await mapPool(jobs, concurrency, async (job) => {
    const url = `${base}${job.path}`;
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "text/html",
          "Accept-Language": job.locale,
        },
        redirect: "follow",
      });
      fetched++;
      if (!res.ok) {
        issues.push({
          kind: "live-fetch-fail",
          locale: job.locale,
          path: job.path,
          detail: `HTTP ${res.status}`,
        });
        return;
      }
      const html = await res.text();
      const visible = pickVisibleTextSample(html);
      const summaries = extractFaqSummaries(html);
      if (summaries.length > 0) faqChecked += summaries.length;

      const pageLeaks = findRuLeaks(visible, allMarkers);
      const faqLeaks: string[] = [];
      const faqCjk: string[] = [];
      for (const q of summaries) {
        faqLeaks.push(...findRuLeaks(q, allMarkers));
        if (CJK_RE.test(q)) faqCjk.push(q.slice(0, 80));
      }

      if (faqCjk.length > 0) {
        vendorFaqLeaks++;
        issues.push({
          kind: "live-faq-wrong-script",
          locale: job.locale,
          path: job.path,
          detail: `FAQ CJK: ${[...new Set(faqCjk)].slice(0, 2).join(" | ")}`,
        });
      } else if (faqLeaks.length > 0) {
        vendorFaqLeaks++;
        issues.push({
          kind: "live-faq-ru-leak",
          locale: job.locale,
          path: job.path,
          detail: `FAQ RU leak: ${[...new Set(faqLeaks)].slice(0, 3).join(" | ")} | sample="${summaries[0]?.slice(0, 70)}"`,
        });
      } else if (
        pageLeaks.length > 0 &&
        job.kind !== "vendor"
      ) {
        issues.push({
          kind: "live-page-ru-leak",
          locale: job.locale,
          path: job.path,
          detail: `page RU leak: ${pageLeaks.slice(0, 3).join(" | ")}`,
        });
      } else {
        clean++;
      }
    } catch (err) {
      issues.push({
        kind: "live-fetch-fail",
        locale: job.locale,
        path: job.path,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });

  console.log(
    `Fetched ${fetched}/${jobs.length}, clean ${clean}, FAQ items checked ${faqChecked}, pages with FAQ RU leaks ${vendorFaqLeaks}`,
  );
  console.log("");
}

function printTopIssues(issues: Issue[], kind: IssueKind, limit = 12): void {
  const subset = issues.filter((i) => i.kind === kind);
  if (subset.length === 0) return;
  console.log(`\n--- ${kind} (${subset.length}) ---`);
  for (const i of subset.slice(0, limit)) {
    const field = i.field ? ` [${i.field}]` : "";
    console.log(`  [${i.locale}] ${i.path}${field}: ${i.detail}`);
  }
  if (subset.length > limit) {
    console.log(`  … +${subset.length - limit} more`);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const locales = parseLocales();
  const skipLive = hasFlag("skip-live");
  const skipDb = hasFlag("skip-db");
  const warnOnly = hasFlag("warn-only");
  const issues: Issue[] = [];

  const routeData = await import("../lib/catalog/seo-category-route-data");
  const categoryRoutes = await import("../lib/catalog/seo-category-routes");
  const coreLandings = await import("../lib/seo/core-seo-landings");

  const SEO_CATEGORY_ROUTES = routeData.SEO_CATEGORY_ROUTES;
  const CORE_SEO_LANDINGS = coreLandings.CORE_SEO_LANDINGS;
  const seoCategoryPath = categoryRoutes.seoCategoryPath;

  auditMessages(issues, locales);
  const seoRuMarkers = auditSeoStatic(
    issues,
    locales,
    SEO_CATEGORY_ROUTES,
    CORE_SEO_LANDINGS,
  );

  let vendorSlugs: string[] = [];
  if (!skipDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      console.warn("Skipping DB audit: missing Supabase env\n");
    } else {
      const admin = createClient(url, key);
      await auditVendorDb(issues, locales, admin);
      const { data } = await admin
        .from("vendors")
        .select("slug")
        .eq("status", "approved")
        .not("slug", "is", null)
        .order("slug");
      vendorSlugs = ((data ?? []) as { slug: string }[]).map((r) => r.slug);
    }
  }

  if (!skipLive) {
    if (vendorSlugs.length === 0) {
      console.warn(
        "Live crawl: no vendor slugs from DB — only SEO/faq/catalog pages\n",
      );
    }
    await auditLive(
      issues,
      locales,
      seoRuMarkers,
      vendorSlugs,
      SEO_CATEGORY_ROUTES,
      CORE_SEO_LANDINGS,
      seoCategoryPath,
    );
  }

  const byKind = Object.fromEntries(
    [
      "messages-missing",
      "messages-empty",
      "messages-identical-ru",
      "messages-wrong-script",
      "vendor-db-missing-i18n",
      "vendor-db-identical-ru",
      "vendor-db-stale",
      "static-identical-ru",
      "static-empty",
      "live-fetch-fail",
      "live-faq-ru-leak",
      "live-faq-wrong-script",
      "live-page-ru-leak",
    ].map((k) => [k, issues.filter((i) => i.kind === k).length]),
  ) as Record<IssueKind, number>;

  console.log("=== SUMMARY ===");
  for (const [k, n] of Object.entries(byKind)) {
    if (n > 0) console.log(`  ${k}: ${n}`);
  }
  const total = issues.length;
  console.log(`  TOTAL issues: ${total}\n`);

  printTopIssues(issues, "live-faq-ru-leak", 20);
  printTopIssues(issues, "messages-wrong-script", 10);
  printTopIssues(issues, "live-faq-wrong-script", 10);
  printTopIssues(issues, "messages-identical-ru", 15);
  printTopIssues(issues, "vendor-db-missing-i18n", 10);
  printTopIssues(issues, "vendor-db-identical-ru", 10);
  printTopIssues(issues, "live-fetch-fail", 8);

  const jsonPath =
    parseArg("json") ?? join(ROOT, "reports", "i18n-audit-latest.json");
  mkdirSync(dirname(jsonPath), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    locales,
    skipLive,
    skipDb,
    summary: byKind,
    totalIssues: total,
    issues,
  };
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport written: ${jsonPath}`);

  const fatalKinds: IssueKind[] = [
    "messages-missing",
    "messages-empty",
    "messages-wrong-script",
    "live-faq-ru-leak",
    "live-faq-wrong-script",
    "live-fetch-fail",
    "static-identical-ru",
    "static-empty",
    "vendor-db-missing-i18n",
  ];
  const fatal = issues.filter((i) => fatalKinds.includes(i.kind)).length;

  if (!warnOnly && fatal > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
