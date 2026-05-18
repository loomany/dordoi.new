import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SEO_CATEGORY_ROUTES } from "../../lib/catalog/seo-category-route-data";
import { seoCategoryPath } from "../../lib/catalog/seo-category-routes";
import { htmlLangFromRouteLocale } from "../../lib/hreflang";
import { publicRoutes } from "../../lib/seo";
import { blogPostPathForLocale } from "../../lib/seo/dordoi-blog-localized";
import { ROUTE_LOCALES, type RouteLocale } from "../../lib/seo/route-locale";
import { BLOG_POSTS_ALL } from "../../lib/seo/stage2-content";

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
};

type RouteEntry = {
  url: string;
  locale: RouteLocale | "none";
  routeType: string;
  sourceFile: string;
  indexableExpected: boolean;
  sitemapExpected: boolean;
  needsTranslationCheck: boolean;
};

type CrawlRow = RouteEntry & {
  status: number;
  title: string;
  description: string;
  h1: string;
  htmlLang: string;
  canonical: string;
  robots: string;
  schema: string;
  titleLanguageOk: boolean;
  descriptionLanguageOk: boolean;
  h1LanguageOk: boolean;
  bodyLanguageOk: boolean;
  hreflangOk: boolean;
  canonicalOk: boolean;
  schemaLanguageOk: boolean;
  aiAnswerBlockOk: boolean;
  faqOk: boolean;
  ruLeakScore: number;
  missingKeysFound: string;
  privateLeakFound: string;
  sitemapFound: boolean;
  notes: string;
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPORT_DIR = join(ROOT, "reports", "seo");
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://dordoi.help").replace(/\/+$/, "");

const privatePattern =
  /https?:\/\/wa\.me\/[A-Za-z0-9_+%-]+|tel:\+?[0-9][0-9()\-\s]{5,}|https?:\/\/t\.me\/[A-Za-z0-9_+-]{3,}|https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.-]{2,}|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|telephone|sameAs|streetAddress/gi;

const allowedPublicContactPatterns = [
  /^https?:\/\/t\.me\/(?:loomany|dordoi_help_admin_bot)$/i,
];

const missingKeyPattern =
  /\b(?:Nav|Pages|Footer|Header|Seo|Common|Catalog|Provider)\.[A-Za-z0-9_.-]+|\[object Object\]|undefined|null|TODO|lorem ipsum/i;

const obviousRuUiPatterns = [
  /Открыть каталог/gi,
  /Каталог поставщиков/gi,
  /Поставщики/gi,
  /Покупателям/gi,
  /Продавцам/gi,
  /Как работает/gi,
  /Главная/gi,
  /Навигация/gi,
  /Частые вопросы/gi,
  /Смежные категории/gi,
  /Полезные ссылки/gi,
  /О поставщике/gi,
  /Контакты доступны/gi,
  /Оплатить/gi,
  /Телефон/gi,
  /Статус/gi,
];

const corePublicPaths = Array.from(
  new Set<string>([
    ...publicRoutes,
    "/how-it-works",
    "/for-buyers",
    "/for-sellers",
    "/kargo-dordoi",
    "/dordoi-optom",
    "/rynok-dordoi",
  ]),
).filter((path) => path !== "/blog");

const vendorSamplePaths = [
  "/catalog/postavshik-zhenskoy-odezhdy-a9e9",
  "/suppliers/asso-corsets",
];

function url(path: string) {
  return `${baseUrl}${path}`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Array<keyof T>) {
  return [
    columns.map((column) => String(column)).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

async function getText(path: string, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url(path), { ...init, signal: controller.signal });
      const text = await response.text();
      return { response, text };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`fetch failed for ${path}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function pass(name: string, detail?: string): CheckResult {
  return { name, ok: true, detail };
}

function fail(name: string, detail?: string): CheckResult {
  return { name, ok: false, detail };
}

function textBetween(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.trim().replace(/\s+/g, " ") ?? "";
}

function attr(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.trim() ?? "";
}

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstPrivateLeak(text: string) {
  for (const match of text.matchAll(privatePattern)) {
    const value = match[0];
    if (allowedPublicContactPatterns.some((pattern) => pattern.test(value))) {
      continue;
    }
    return value;
  }
  return "";
}

function hasCyrillicOutsideBrand(text: string) {
  return /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІіЇїӮӯ]/.test(
    text.replace(/Dordoi\.help|Dordoy|Дордой|FAQ|WhatsApp|Telegram|Instagram|Google|2GIS/gi, ""),
  );
}

function ruLeakScore(locale: RouteLocale | "none", text: string) {
  if (locale === "ru" || locale === "none") return 0;
  let score = 0;
  for (const pattern of obviousRuUiPatterns) {
    score += text.match(pattern)?.length ?? 0;
  }
  if (locale === "uz" && hasCyrillicOutsideBrand(text)) score += 5;
  return score;
}

function languageOk(locale: RouteLocale | "none", value: string) {
  if (!value || locale === "none") return true;
  if (locale === "ru") return true;
  if (locale === "uz") return !hasCyrillicOutsideBrand(value);
  return ruLeakScore(locale, value) === 0;
}

function expectedHreflangTags() {
  return ["ru", "kk", "ky", "uz", "tg", "x-default"];
}

function hasHreflang(html: string, tag: string) {
  return new RegExp(`hrefLang=["']${tag}["']|hreflang=["']${tag}["']`, "i").test(html);
}

function routeEntries(): RouteEntry[] {
  const entries: RouteEntry[] = [];
  for (const locale of ROUTE_LOCALES) {
    for (const path of corePublicPaths) {
      entries.push({
        url: `/${locale}${path === "/" ? "" : path}`,
        locale,
        routeType: "core",
        sourceFile: `app/[locale]${path === "/" ? "" : path}/page.tsx`,
        indexableExpected: true,
        sitemapExpected: true,
        needsTranslationCheck: true,
      });
    }

    for (const route of SEO_CATEGORY_ROUTES) {
      entries.push({
        url: `/${locale}${seoCategoryPath(locale, route)}`,
        locale,
        routeType: "category",
        sourceFile: "app/[locale]/categories/[categorySlug]/page.tsx",
        indexableExpected: true,
        sitemapExpected: true,
        needsTranslationCheck: true,
      });
    }

    entries.push({
      url: `/${locale}/blog`,
      locale,
      routeType: "blog_hub",
      sourceFile: "app/[locale]/blog/page.tsx",
      indexableExpected: true,
      sitemapExpected: true,
      needsTranslationCheck: true,
    });

    for (const post of BLOG_POSTS_ALL) {
      entries.push({
        url: `/${locale}${blogPostPathForLocale(post.slug, locale)}`,
        locale,
        routeType: "blog_guide",
        sourceFile: "app/[locale]/blog/[slug]/page.tsx",
        indexableExpected: true,
        sitemapExpected: true,
        needsTranslationCheck: true,
      });
    }

    for (const path of vendorSamplePaths) {
      entries.push({
        url: `/${locale}${path}`,
        locale,
        routeType: "vendor_sample_locked",
        sourceFile: path.includes("/suppliers/")
          ? "app/[locale]/suppliers/[seoSlug]/page.tsx"
          : "app/[locale]/catalog/[slug]/page.tsx",
        indexableExpected: true,
        sitemapExpected: false,
        needsTranslationCheck: true,
      });
    }
  }

  entries.push(
    {
      url: "/sitemap.xml",
      locale: "none",
      routeType: "technical",
      sourceFile: "app/sitemap.xml/route.ts",
      indexableExpected: false,
      sitemapExpected: false,
      needsTranslationCheck: false,
    },
    {
      url: "/sitemaps/core.xml",
      locale: "none",
      routeType: "technical",
      sourceFile: "app/sitemaps/core.xml/route.ts",
      indexableExpected: false,
      sitemapExpected: false,
      needsTranslationCheck: false,
    },
    {
      url: "/robots.txt",
      locale: "none",
      routeType: "technical",
      sourceFile: "app/robots.ts",
      indexableExpected: false,
      sitemapExpected: false,
      needsTranslationCheck: false,
    },
    {
      url: "/llms.txt",
      locale: "none",
      routeType: "technical",
      sourceFile: "app/llms.txt/route.ts",
      indexableExpected: false,
      sitemapExpected: false,
      needsTranslationCheck: true,
    },
  );

  return entries;
}

async function crawl(entries: RouteEntry[], sitemapText: string): Promise<CrawlRow[]> {
  const rows: CrawlRow[] = [];
  for (const entry of entries) {
    try {
      const { response, text } = await getText(entry.url);
      const body = visibleText(text);
      const title = textBetween(text, /<title[^>]*>([\s\S]*?)<\/title>/i);
      const description = attr(text, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
      const h1 = textBetween(text, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const htmlLang = attr(text, /<html[^>]+lang=["']([^"']+)["']/i);
      const canonical = attr(text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      const robots = attr(text, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
      const schema = /application\/ld\+json/i.test(text) ? "present" : "";
      const expectedLang = entry.locale === "none" ? "" : htmlLangFromRouteLocale(entry.locale);
      const expectedCanonical =
        entry.locale === "none" ? "" : `${siteUrl}/${entry.url.replace(/^\/+/, "")}`.replace(/\/$/, entry.url.endsWith("/") ? "/" : "");
      const canonicalOk =
        entry.locale === "none" ||
        !entry.indexableExpected ||
        (entry.routeType === "vendor_sample_locked"
          ? canonical.replace(/\/$/, "").startsWith(`${siteUrl}/${entry.locale}/suppliers/`)
          : canonical.replace(/\/$/, "") === expectedCanonical.replace(/\/$/, ""));
      const hreflangOk =
        entry.locale === "none" ||
        !entry.indexableExpected ||
        (expectedHreflangTags().every((tag) => hasHreflang(text, tag)) &&
          !/hrefLang=["'](?:kg|tj)["']|hreflang=["'](?:kg|tj)["']/i.test(text));
      const schemaLanguageOk =
        entry.locale === "none" ||
        !schema ||
        [...text.matchAll(/"inLanguage"\s*:\s*"([^"]+)"/g)].every(
          (match) => match[1] === expectedLang,
        );
      const leakScore = ruLeakScore(entry.locale, body);
      const missingKeys = body.match(missingKeyPattern)?.[0] ?? "";
      const privateLeak = firstPrivateLeak(text);
      const aiExpected =
        entry.routeType === "category" ||
        entry.routeType === "blog_hub" ||
        entry.routeType === "blog_guide" ||
        /\/(?:catalog|suppliers|about|how-it-works|faq|for-buyers|for-sellers|buyer-service|kargo-dordoi)$/.test(
          entry.url,
        );
      const aiAnswerBlockOk = !aiExpected || /data-ai-answer-block=["']true["']/i.test(text);
      const faqExpected =
        entry.routeType === "category" ||
        entry.routeType === "blog_guide" ||
        /\/(?:faq|about|how-it-works|for-buyers|for-sellers|buyer-service|kargo-dordoi)$/.test(entry.url);
      const faqOk = !faqExpected || /FAQ|Частые вопросы|Tez-tez|Савол|Суроо|Сұрақ|"@type":"FAQPage"/i.test(text);
      const sitemapFound = !entry.sitemapExpected || sitemapText.includes(entry.url);

      rows.push({
        ...entry,
        status: response.status,
        title,
        description,
        h1,
        htmlLang,
        canonical,
        robots,
        schema,
        titleLanguageOk: languageOk(entry.locale, title),
        descriptionLanguageOk: languageOk(entry.locale, description),
        h1LanguageOk: languageOk(entry.locale, h1),
        bodyLanguageOk: leakScore === 0 && !missingKeys,
        hreflangOk,
        canonicalOk,
        schemaLanguageOk,
        aiAnswerBlockOk,
        faqOk,
        ruLeakScore: leakScore,
        missingKeysFound: missingKeys,
        privateLeakFound: privateLeak,
        sitemapFound,
        notes: response.status >= 400 ? `HTTP ${response.status}` : "",
      });
    } catch (error) {
      rows.push({
        ...entry,
        status: 0,
        title: "",
        description: "",
        h1: "",
        htmlLang: "",
        canonical: "",
        robots: "",
        schema: "",
        titleLanguageOk: false,
        descriptionLanguageOk: false,
        h1LanguageOk: false,
        bodyLanguageOk: false,
        hreflangOk: false,
        canonicalOk: false,
        schemaLanguageOk: false,
        aiAnswerBlockOk: false,
        faqOk: false,
        ruLeakScore: 0,
        missingKeysFound: "",
        privateLeakFound: "",
        sitemapFound: false,
        notes: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return rows;
}

async function checkRedirect(path: string, expectedTarget: string): Promise<CheckResult[]> {
  const { response } = await getText(path, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const okStatus = response.status === 301 || response.status === 308;
  const okLocation = location === expectedTarget || location === url(expectedTarget);
  return [
    okStatus ? pass(`redirect status ${path}`, String(response.status)) : fail(`redirect status ${path}`, `got ${response.status}`),
    okLocation ? pass(`redirect target ${path}`, location) : fail(`redirect target ${path}`, `got ${location || "(empty)"}`),
  ];
}

async function main() {
  const entries = routeEntries();
  const sitemapRoot = await getText("/sitemap.xml");
  const sitemapCore = await getText("/sitemaps/core.xml");
  const sitemapText = `${sitemapRoot.text}\n${sitemapCore.text}`;
  const rows = await crawl(entries, sitemapText);

  const routeColumns: Array<keyof CrawlRow> = [
    "url",
    "locale",
    "routeType",
    "sourceFile",
    "status",
    "indexableExpected",
    "canonical",
    "hreflangOk",
    "htmlLang",
    "title",
    "description",
    "h1",
    "schema",
    "sitemapExpected",
    "sitemapFound",
    "bodyLanguageOk",
    "notes",
  ];
  const visibleColumns: Array<keyof CrawlRow> = [
    "url",
    "locale",
    "status",
    "titleLanguageOk",
    "descriptionLanguageOk",
    "h1LanguageOk",
    "bodyLanguageOk",
    "htmlLang",
    "hreflangOk",
    "canonicalOk",
    "schemaLanguageOk",
    "aiAnswerBlockOk",
    "faqOk",
    "ruLeakScore",
    "missingKeysFound",
    "privateLeakFound",
    "sitemapFound",
    "notes",
  ];
  const hreflangColumns: Array<keyof CrawlRow> = [
    "url",
    "locale",
    "htmlLang",
    "canonical",
    "canonicalOk",
    "hreflangOk",
    "notes",
  ];

  writeFileSync(
    join(REPORT_DIR, "dordoi-full-route-i18n-inventory-2026-05-18.csv"),
    toCsv(rows, routeColumns),
  );
  writeFileSync(
    join(REPORT_DIR, "dordoi-full-multilingual-route-inventory-2026-05-18.csv"),
    toCsv(rows, routeColumns),
  );
  writeFileSync(
    join(REPORT_DIR, "dordoi-i18n-visible-crawl-2026-05-18.csv"),
    toCsv(rows, visibleColumns),
  );
  writeFileSync(
    join(REPORT_DIR, "dordoi-i18n-full-crawl-2026-05-18.csv"),
    toCsv(rows, visibleColumns),
  );
  writeFileSync(
    join(REPORT_DIR, "dordoi-hreflang-canonical-all-locales-2026-05-18.csv"),
    toCsv(rows.filter((row) => row.locale !== "none" && row.indexableExpected), hreflangColumns),
  );

  const checks: CheckResult[] = [];
  checks.push(
    sitemapRoot.response.status === 200 ? pass("sitemap.xml status") : fail("sitemap.xml status", String(sitemapRoot.response.status)),
    sitemapCore.response.status === 200 ? pass("sitemaps/core.xml status") : fail("sitemaps/core.xml status", String(sitemapCore.response.status)),
    !/localhost|127\.0\.0\.1/i.test(sitemapText) ? pass("sitemaps no localhost") : fail("sitemaps no localhost"),
    !/\/(?:kk|kg|uz|tj)\/blog\/dordoi-optom-polnyy-gid/i.test(sitemapText)
      ? pass("sitemap excludes noncanonical localized source slugs")
      : fail("sitemap excludes noncanonical localized source slugs"),
  );

  checks.push(...(await checkRedirect("/ru/dordoi-market", "/ru/rynok-dordoi")));
  checks.push(...(await checkRedirect("/ru/wholesale", "/ru/dordoi-optom")));
  checks.push(...(await checkRedirect("/ru/cargo", "/ru/kargo-dordoi")));

  for (const row of rows) {
    if (row.status >= 400 || row.status === 0) checks.push(fail(`status ${row.url}`, String(row.status)));
    if (row.indexableExpected && !row.canonicalOk) checks.push(fail(`canonical ${row.url}`, row.canonical));
    if (row.indexableExpected && !row.hreflangOk) checks.push(fail(`hreflang ${row.url}`));
    if (row.indexableExpected && row.locale !== "none" && row.htmlLang !== htmlLangFromRouteLocale(row.locale)) {
      checks.push(fail(`html lang ${row.url}`, row.htmlLang));
    }
    if (row.indexableExpected && !row.sitemapFound) checks.push(fail(`sitemap contains ${row.url}`));
    if (row.privateLeakFound) checks.push(fail(`privacy ${row.url}`, row.privateLeakFound));
    if (row.missingKeysFound) checks.push(fail(`missing key ${row.url}`, row.missingKeysFound));
    if (!row.aiAnswerBlockOk) checks.push(fail(`AI answer block ${row.url}`));
    if (row.locale === "uz" && row.ruLeakScore > 5) {
      checks.push(fail(`Uzbek visible language ${row.url}`, `score ${row.ruLeakScore}`));
    }
  }

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    const status = item.ok ? "PASS" : "FAIL";
    console.log(`${status} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
  }
  console.log(`\nFull i18n smoke summary: ${checks.length - failed.length}/${checks.length} passed for ${baseUrl}`);
  console.log(`Crawled ${rows.length} routes; reports written to reports/seo.`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
