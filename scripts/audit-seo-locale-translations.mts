/**
 * Audits SEO pages for uz/tj: static manifest vs RU leaks + live HTML smoke.
 *
 *   npm run audit:seo-locales
 *   npm run audit:seo-locales -- --base=http://localhost:3000
 */
import type { RouteLocale } from "../lib/seo/route-locale.ts";
import type { SeoCategoryRoute } from "../lib/catalog/seo-category-route-data.ts";
import type { CoreSeoLanding } from "../lib/seo/core-seo-landings.ts";

const DEFAULT_TARGET_LOCALES = ["uz", "tj"] as const satisfies readonly RouteLocale[];

function parseLocalesArg(): RouteLocale[] {
  const raw = parseArg("locales");
  if (!raw || raw === "all") {
    return ["kk", "kg", "uz", "tj"];
  }
  const parts = raw.split(",").map((s) => s.trim()) as RouteLocale[];
  const allowed = new Set<RouteLocale>(["kk", "kg", "uz", "tj"]);
  const out = parts.filter((p) => allowed.has(p));
  if (out.length === 0) {
    return [...DEFAULT_TARGET_LOCALES];
  }
  return out;
}

type TargetLocale = RouteLocale;

const RU_LEAK_RE =
  /(?:Поставщик|поставщик|Каталог поставщик|Частые вопросы|Главная страница|Навигация по|оптом на рынке Дордой|Рынок Дордой в Бишкеке|Открыть каталог|Найти байера|Женская одежда оптом|Мужская одежда)/u;

const CYRILLIC_RE = /[\u0400-\u04FF]{8,}/u;

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
}

function pickTitle(html: string): string | null {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
}

function pickH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function pickHtmlLang(html: string): string | null {
  return html.match(/<html[^>]+lang="([^"]+)"/i)?.[1] ?? null;
}

function russianLeakHits(text: string): string[] {
  return RU_LEAK_RE.test(text) ? ["ru-phrase"] : [];
}

type Issue = {
  kind:
    | "static-identical-ru"
    | "static-empty"
    | "live-ru-leak"
    | "live-fetch-fail"
    | "live-h1-mismatch";
  locale: TargetLocale;
  path: string;
  field?: string;
  detail: string;
};

function auditStaticField(
  issues: Issue[],
  locale: TargetLocale,
  path: string,
  field: string,
  value: string,
  ruValue: string,
) {
  const t = value.trim();
  if (!t) {
    issues.push({
      kind: "static-empty",
      locale,
      path,
      field,
      detail: "empty string",
    });
    return;
  }
  if (t === ruValue.trim()) {
    issues.push({
      kind: "static-identical-ru",
      locale,
      path,
      field,
      detail: t.slice(0, 100),
    });
  }
}

async function main(): Promise<void> {
  const routeData = await import("../lib/catalog/seo-category-route-data.ts");
  const categoryRoutes = await import("../lib/catalog/seo-category-routes.ts");
  const pageLabels = await import("../lib/seo/seo-page-labels.ts");
  const coreLandings = await import("../lib/seo/core-seo-landings.ts");

  const SEO_CATEGORY_ROUTES: SeoCategoryRoute[] =
    routeData.SEO_CATEGORY_ROUTES;
  const seoCategoryPath = categoryRoutes.seoCategoryPath;
  const seoCategoryPageLabels = pageLabels.seoCategoryPageLabels;
  const seoCorePageLabels = pageLabels.seoCorePageLabels;
  const CORE_SEO_LANDINGS: CoreSeoLanding[] = coreLandings.CORE_SEO_LANDINGS;

  const TARGET_LOCALES = parseLocalesArg();

  const issues: Issue[] = [];

  console.log(`=== SEO static manifest (${TARGET_LOCALES.join(" / ")} vs ru) ===\n`);

  for (const route of SEO_CATEGORY_ROUTES) {
    const base = `category:${route.id}`;
    const ru = route.h1ByLocale.ru;
    for (const locale of TARGET_LOCALES) {
      auditStaticField(
        issues,
        locale,
        base,
        "h1",
        route.h1ByLocale[locale],
        ru,
      );
      auditStaticField(
        issues,
        locale,
        base,
        "title",
        route.titleByLocale[locale],
        route.titleByLocale.ru,
      );
      auditStaticField(
        issues,
        locale,
        base,
        "description",
        route.descriptionByLocale[locale],
        route.descriptionByLocale.ru,
      );
      auditStaticField(
        issues,
        locale,
        base,
        "intro",
        route.introByLocale[locale],
        route.introByLocale.ru,
      );
      const faq = route.faqByLocale[locale];
      const faqRu = route.faqByLocale.ru;
      faq.forEach((item, i) => {
        auditStaticField(
          issues,
          locale,
          base,
          `faq[${i}].q`,
          item.question,
          faqRu[i]?.question ?? "",
        );
        auditStaticField(
          issues,
          locale,
          base,
          `faq[${i}].a`,
          item.answer,
          faqRu[i]?.answer ?? "",
        );
      });
    }
  }

  for (const landing of CORE_SEO_LANDINGS) {
    const base = `core:${landing.id}`;
    for (const locale of TARGET_LOCALES) {
      auditStaticField(
        issues,
        locale,
        base,
        "h1",
        landing.h1ByLocale[locale],
        landing.h1ByLocale.ru,
      );
      auditStaticField(
        issues,
        locale,
        base,
        "title",
        landing.titleByLocale[locale],
        landing.titleByLocale.ru,
      );
      auditStaticField(
        issues,
        locale,
        base,
        "intro",
        landing.introByLocale[locale],
        landing.introByLocale.ru,
      );
    }
  }

  for (const locale of TARGET_LOCALES) {
    const catLabels = seoCategoryPageLabels(locale);
    const catRu = seoCategoryPageLabels("ru");
    for (const key of [
      "breadcrumbHome",
      "ctaCatalog",
      "faqTitle",
      "seoTextTitle",
      "vendorPreviewTitle",
    ] as const) {
      auditStaticField(
        issues,
        locale,
        "labels:category",
        key,
        catLabels[key],
        catRu[key],
      );
    }
    const coreLabels = seoCorePageLabels(locale);
    const coreRu = seoCorePageLabels("ru");
    for (const key of ["ctaCatalog", "faqTitle", "quickLinkCatalog"] as const) {
      auditStaticField(
        issues,
        locale,
        "labels:core",
        key,
        coreLabels[key],
        coreRu[key],
      );
    }
  }

  const staticIdentical = issues.filter((i) => i.kind === "static-identical-ru");
  const staticEmpty = issues.filter((i) => i.kind === "static-empty");
  console.log(
    `Categories: ${SEO_CATEGORY_ROUTES.length}, core landings: ${CORE_SEO_LANDINGS.length}`,
  );
  console.log(`Static identical to RU: ${staticIdentical.length}`);
  console.log(`Static empty: ${staticEmpty.length}`);
  if (staticIdentical.length > 0) {
    console.log("\nSample static leaks:");
    for (const i of staticIdentical.slice(0, 12)) {
      console.log(`  [${i.locale}] ${i.path} ${i.field}: ${i.detail}`);
    }
    if (staticIdentical.length > 12) {
      console.log(`  … +${staticIdentical.length - 12} more`);
    }
  }

  const base = (parseArg("base") ?? "http://localhost:3000").replace(/\/$/, "");
  const livePaths: Array<{
    locale: TargetLocale;
    path: string;
    expectedH1?: string;
  }> = [];

  for (const locale of TARGET_LOCALES) {
    for (const landing of CORE_SEO_LANDINGS) {
      livePaths.push({
        locale,
        path: `/${locale}${landing.path}`,
        expectedH1: landing.h1ByLocale[locale],
      });
    }
    livePaths.push({ locale, path: `/${locale}/faq` });
    for (const route of SEO_CATEGORY_ROUTES) {
      livePaths.push({
        locale,
        path: `/${locale}${seoCategoryPath(locale, route)}`,
        expectedH1: route.h1ByLocale[locale],
      });
    }
  }

  console.log(`\n=== Live HTML (${base}) — ${livePaths.length} URLs ===\n`);

  let fetched = 0;
  let liveOk = 0;

  for (const entry of livePaths) {
    const url = `${base}${entry.path}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: "text/html", "Accept-Language": entry.locale },
        redirect: "follow",
      });
      fetched++;
      if (!res.ok) {
        issues.push({
          kind: "live-fetch-fail",
          locale: entry.locale,
          path: entry.path,
          detail: `HTTP ${res.status}`,
        });
        continue;
      }
      const html = await res.text();
      const h1 = pickH1(html);
      const title = pickTitle(html);
      const lang = pickHtmlLang(html);
      const bodySample = html.slice(0, 120_000);

      const leaks = [
        ...russianLeakHits(h1 ?? ""),
        ...russianLeakHits(title ?? ""),
        ...(entry.locale === "uz" && CYRILLIC_RE.test(bodySample)
          ? ["uz-cyrillic-block"]
          : []),
        ...russianLeakHits(bodySample),
      ];

      if (entry.expectedH1 && h1 && h1 !== entry.expectedH1) {
        issues.push({
          kind: "live-h1-mismatch",
          locale: entry.locale,
          path: entry.path,
          detail: `got "${h1}" expected "${entry.expectedH1}"`,
        });
      }

      if (leaks.length > 0) {
        issues.push({
          kind: "live-ru-leak",
          locale: entry.locale,
          path: entry.path,
          detail: `leaks=${leaks.join(",")} lang=${lang} h1=${h1?.slice(0, 60)}`,
        });
      } else {
        liveOk++;
      }
    } catch (err) {
      issues.push({
        kind: "live-fetch-fail",
        locale: entry.locale,
        path: entry.path,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log(`Fetched: ${fetched}/${livePaths.length}, clean: ${liveOk}`);

  const liveLeaks = issues.filter((i) => i.kind === "live-ru-leak");
  const liveFail = issues.filter((i) => i.kind === "live-fetch-fail");
  const h1Mismatch = issues.filter((i) => i.kind === "live-h1-mismatch");

  if (liveLeaks.length > 0) {
    console.log(`\nLive RU leaks: ${liveLeaks.length}`);
    for (const i of liveLeaks.slice(0, 15)) {
      console.log(`  [${i.locale}] ${i.path} — ${i.detail}`);
    }
    if (liveLeaks.length > 15) {
      console.log(`  … +${liveLeaks.length - 15} more`);
    }
  }

  if (h1Mismatch.length > 0) {
    console.log(`\nH1 mismatches: ${h1Mismatch.length}`);
    for (const i of h1Mismatch.slice(0, 8)) {
      console.log(`  [${i.locale}] ${i.path} — ${i.detail}`);
    }
  }

  if (liveFail.length > 0) {
    console.log(`\nFetch failures: ${liveFail.length}`);
    for (const i of liveFail.slice(0, 8)) {
      console.log(`  [${i.locale}] ${i.path} — ${i.detail}`);
    }
  }

  const fatal =
    staticIdentical.length +
    staticEmpty.length +
    liveLeaks.length +
    liveFail.length;

  console.log(
    `\n=== Summary ===\n` +
      `static-identical-ru: ${staticIdentical.length}\n` +
      `static-empty: ${staticEmpty.length}\n` +
      `live-ru-leak: ${liveLeaks.length}\n` +
      `live-fetch-fail: ${liveFail.length}\n` +
      `live-h1-mismatch: ${h1Mismatch.length} (informational)\n`,
  );

  process.exit(fatal > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
