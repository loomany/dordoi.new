type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
};

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");

const topCategoryPaths = [
  "/ru/categories/zhenskaya-odezhda-optom",
  "/ru/categories/muzhskaya-odezhda-optom",
  "/ru/categories/detskaya-odezhda-optom",
  "/ru/categories/obuv-optom",
  "/ru/categories/tkani-shveynaya-furnitura-optom",
  "/ru/categories/sumki-kozhgalantereya-optom",
  "/ru/categories/nizhnee-bele-kupalniki-optom",
  "/ru/categories/tekstil-dlya-doma-optom",
  "/ru/categories/aksessuary-optom",
];

const privacyPaths = [
  "/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9",
  "/ru/categories/zhenskaya-odezhda-optom",
  "/ru/suppliers/asso-corsets",
];

const guidePaths = [
  "/ru/blog/kak-nayti-postavshchika-dordoi",
  "/ru/blog/kargo-dordoi-kak-rabotaet-dostavka",
  "/ru/blog/kak-kupit-optom-na-dordoe",
  "/ru/blog/dordoi-optom-polnyy-gid",
  "/ru/blog/dordoi-online-katalog-kak-polzovatsya",
  "/ru/blog/dordoi-prais-listy-i-tseny-kak-utochnyat",
  "/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno",
  "/ru/blog/kak-proverit-postavshchika-dordoi",
  "/ru/blog/chek-list-zakupki-na-dordoe",
  "/ru/blog/kak-sravnit-postavshchikov-dordoi",
  "/ru/blog/kak-napisat-postavshchiku-dordoi",
  "/ru/blog/kak-zakupat-na-dordoe-udalenno",
  "/ru/blog/dostavka-s-dordoya-v-kazakhstan",
  "/ru/blog/dostavka-s-dordoya-v-uzbekistan",
  "/ru/blog/dostavka-s-dordoya-v-tajikistan",
  "/ru/blog/dostavka-s-dordoya-v-russia",
  "/ru/blog/kargo-dordoi-skolko-vremeni-zanimaet",
  "/ru/blog/bayer-dordoi-kto-eto-i-zachem-nuzhen",
  "/ru/blog/kak-vybrat-bayera-dordoi",
  "/ru/blog/bayer-dordoi-dlya-kazakhstana",
  "/ru/blog/bayer-ili-samostoyatelnaya-zakupka-dordoi",
  "/ru/blog/zhenskaya-odezhda-optom-dordoi",
  "/ru/blog/muzhskaya-odezhda-optom-dordoi",
  "/ru/blog/detskaya-odezhda-optom-dordoi",
  "/ru/blog/obuv-optom-dordoi",
  "/ru/blog/trikotazh-optom-dordoi",
  "/ru/blog/sumki-optom-dordoi",
  "/ru/blog/tkani-i-furnitura-dordoi",
  "/ru/blog/nizhnee-bele-i-korsety-optom-dordoi",
  "/ru/blog/postelnoe-bele-optom-kyrgyzstan",
  "/ru/blog/postavshchiki-dlya-wildberries-bishkek",
  "/ru/blog/tovary-optom-dlya-marketpleysov-kyrgyzstan",
  "/ru/blog/shveynye-tsekha-bishkek-i-proizvodstvo-odezhdy",
  "/ru/blog/poshiv-odezhdy-pod-klyuch-bishkek",
];

const blogHubPaths = ["/ru/blog", "/kk/blog", "/kg/blog", "/uz/blog", "/tj/blog"];

const coreAiPaths = [
  "/ru/about",
  "/ru/how-it-works",
  "/ru/faq",
  "/ru/for-buyers",
  "/ru/for-sellers",
  "/ru/buyer-service",
  "/ru/kargo-dordoi",
];

const localizedGuideSamplePaths = [
  "/kk/blog/dordoi-koterme-tolyk-nuskaulyk",
  "/kg/blog/dordoi-dununon-toluk-koldonmo",
  "/uz/blog/dordoy-ulgurji-toliq-qollanma",
  "/tj/blog/dordoi-yakluht-dasturi-purra",
  "/kk/blog/dordoi-zhetkizushini-qalai-tabu",
  "/kg/blog/dordoi-zhetkiruuchunu-kantip-tabuu",
  "/uz/blog/dordoy-yetkazib-beruvchini-qanday-topish",
  "/tj/blog/dordoi-taminkunandaro-chi-tavr-yoftan",
];

const contentSpotCheckPaths = [
  "/ru/blog/dordoi-optom-polnyy-gid",
  "/ru/blog/dordoi-online-katalog-kak-polzovatsya",
  "/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno",
  "/ru/blog/zhenskaya-odezhda-optom-dordoi",
  "/ru/blog/postavshchiki-dlya-wildberries-bishkek",
  "/ru/blog/kak-nayti-postavshchika-dordoi",
  "/kk/blog/dordoi-koterme-tolyk-nuskaulyk",
  "/kg/blog/dordoi-dununon-toluk-koldonmo",
  "/uz/blog/dordoy-ulgurji-toliq-qollanma",
  "/tj/blog/dordoi-yakluht-dasturi-purra",
];

const privatePattern =
  /https?:\/\/wa\.me\/[A-Za-z0-9_+%-]+|tel:\+?[0-9][0-9()\-\s]{5,}|https?:\/\/t\.me\/[A-Za-z0-9_+-]{3,}|https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.-]{2,}|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|telephone|sameAs|streetAddress/i;

function url(path: string) {
  return `${baseUrl}${path}`;
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
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
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

async function checkRedirect(path: string, expectedTarget: string): Promise<CheckResult[]> {
  const { response } = await getText(path, { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  const okStatus = response.status === 301 || response.status === 308;
  const okLocation = location === expectedTarget || location === url(expectedTarget);
  return [
    okStatus
      ? pass(`redirect status ${path}`, String(response.status))
      : fail(`redirect status ${path}`, `got ${response.status}`),
    okLocation
      ? pass(`redirect target ${path}`, location)
      : fail(`redirect target ${path}`, `got ${location || "(empty)"}`),
  ];
}

async function checkLlms(): Promise<CheckResult[]> {
  const { response, text } = await getText("/llms.txt");
  return [
    response.status === 200 ? pass("llms.txt status") : fail("llms.txt status", String(response.status)),
    /Dordoi\.help/i.test(text)
      ? pass("llms.txt describes Dordoi.help")
      : fail("llms.txt describes Dordoi.help"),
    /private|privacy|gated|contacts/i.test(text)
      ? pass("llms.txt mentions vendor privacy")
      : fail("llms.txt mentions vendor privacy"),
    /sitemap\.xml/i.test(text)
      ? pass("llms.txt references sitemap")
      : fail("llms.txt references sitemap"),
    /Do not publish phone lists|do not infer, expose, invent/i.test(text)
      ? pass("llms.txt blocks vendor contact publishing")
      : fail("llms.txt blocks vendor contact publishing"),
    !privatePattern.test(text)
      ? pass("llms.txt no private contact patterns")
      : fail("llms.txt no private contact patterns", text.match(privatePattern)?.[0]),
  ];
}

async function checkRobots(): Promise<CheckResult[]> {
  const { response, text } = await getText("/robots.txt");
  const blocksAll = /^Disallow:\s*\/\s*$/im.test(text);
  const hasSitemap = /Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i.test(text);
  const hasAiCrawlers = /GPTBot/i.test(text) && /ChatGPT-User/i.test(text) && /PerplexityBot/i.test(text) && /ClaudeBot/i.test(text);
  const hasSearchBots = /Googlebot/i.test(text) && /YandexBot/i.test(text) && /Bingbot/i.test(text);
  const hasPrivateBlocks = /Disallow:\s*\/api\//i.test(text) && /Disallow:\s*\/admin\//i.test(text) && /Disallow:\s*\/\*\/cabinet\//i.test(text);
  const hasPaymentBlock = /Disallow:\s*\/payment\//i.test(text) || /Disallow:\s*\/\*\/payment\//i.test(text);

  return [
    response.status === 200 ? pass("robots.txt status") : fail("robots.txt status", String(response.status)),
    hasSitemap ? pass("robots.txt sitemap reference") : fail("robots.txt sitemap reference"),
    hasSearchBots ? pass("robots.txt search crawler policy") : fail("robots.txt search crawler policy"),
    hasAiCrawlers ? pass("robots.txt AI crawler policy") : fail("robots.txt AI crawler policy"),
    hasPrivateBlocks ? pass("robots.txt private paths blocked") : fail("robots.txt private paths blocked"),
    hasPaymentBlock ? pass("robots.txt payment paths blocked") : fail("robots.txt payment paths blocked"),
    !blocksAll ? pass("robots.txt public SEO not globally blocked") : fail("robots.txt public SEO not globally blocked"),
  ];
}

async function checkSitemaps(): Promise<CheckResult[]> {
  const root = await getText("/sitemap.xml");
  const core = await getText("/sitemaps/core.xml");
  const text = `${root.text}\n${core.text}`;
  const required = [
    "/ru/about",
    "/ru/for-buyers",
    "/ru/for-sellers",
    "/ru/dordoi-kazakhstan",
    "/ru/blog/kak-nayti-postavshchika-dordoi",
    "/ru/blog/dordoi-optom-polnyy-gid",
    "/ru/blog/kak-proverit-postavshchika-dordoi",
    "/ru/blog/zhenskaya-odezhda-optom-dordoi",
    "/kk/blog/dordoi-koterme-tolyk-nuskaulyk",
    "/kg/blog/dordoi-dununon-toluk-koldonmo",
    "/uz/blog/dordoy-ulgurji-toliq-qollanma",
    "/tj/blog/dordoi-yakluht-dasturi-purra",
    "/ru/categories/zhenskaya-odezhda-optom",
  ];
  const aliases = ["/ru/dordoi-market", "/ru/wholesale", "/ru/cargo"];
  const results: CheckResult[] = [
    root.response.status === 200
      ? pass("sitemap.xml status")
      : fail("sitemap.xml status", String(root.response.status)),
    core.response.status === 200
      ? pass("sitemaps/core.xml status")
      : fail("sitemaps/core.xml status", String(core.response.status)),
    !/localhost|127\.0\.0\.1/i.test(text)
      ? pass("sitemaps no localhost")
      : fail("sitemaps no localhost"),
  ];

  for (const path of required) {
    results.push(text.includes(path) ? pass(`sitemap contains ${path}`) : fail(`sitemap contains ${path}`));
  }
  for (const path of aliases) {
    results.push(!text.includes(path) ? pass(`sitemap excludes alias ${path}`) : fail(`sitemap excludes alias ${path}`));
  }
  return results;
}

async function checkQueryNoindex(): Promise<CheckResult[]> {
  const path = "/ru/catalog?search=test&utm_source=x&gclid=abc";
  const { response, text } = await getText(path);
  const canonicalOk = /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+\/ru\/catalog["']/i.test(text);
  const robotsOk = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*follow/i.test(text);
  return [
    response.status === 200 ? pass("query URL status") : fail("query URL status", String(response.status)),
    canonicalOk ? pass("query canonical clean") : fail("query canonical clean"),
    robotsOk ? pass("query robots noindex follow") : fail("query robots noindex follow"),
  ];
}

async function checkPrivacy(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of privacyPaths) {
    const { response, text } = await getText(path);
    const match = text.match(privatePattern)?.[0];
    results.push(response.status < 500 ? pass(`privacy page status ${path}`, String(response.status)) : fail(`privacy page status ${path}`, String(response.status)));
    results.push(!match ? pass(`privacy grep ${path}`) : fail(`privacy grep ${path}`, match));
  }
  return results;
}

async function checkCategories(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of topCategoryPaths) {
    const { response, text } = await getText(path);
    const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+\/ru\/categories\//i.test(text);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasFaq = /FAQ|Частые вопросы|Можно ли найти поставщиков/i.test(text);
    const hasJsonLd = /application\/ld\+json/i.test(text);
    const hasAnswerBlock = /data-ai-answer-block=["']true["']/i.test(text);
    const privateMatch = text.match(privatePattern)?.[0];
    results.push(response.status === 200 ? pass(`category status ${path}`) : fail(`category status ${path}`, String(response.status)));
    results.push(hasCanonical ? pass(`category canonical ${path}`) : fail(`category canonical ${path}`));
    results.push(hasH1 ? pass(`category H1 ${path}`) : fail(`category H1 ${path}`));
    results.push(hasFaq ? pass(`category FAQ ${path}`) : fail(`category FAQ ${path}`));
    results.push(hasJsonLd ? pass(`category JSON-LD ${path}`) : fail(`category JSON-LD ${path}`));
    results.push(hasAnswerBlock ? pass(`category AI answer block ${path}`) : fail(`category AI answer block ${path}`));
    results.push(!privateMatch ? pass(`category private data ${path}`) : fail(`category private data ${path}`, privateMatch));
  }
  return results;
}

async function checkCoreAiPages(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of coreAiPaths) {
    const { response, text } = await getText(path);
    const hasCanonical = new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+${path.replace(/\//g, "\\/")}["']`, "i").test(text);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasAnswerBlock = /data-ai-answer-block=["']true["']/i.test(text);
    const hasJsonLd = /application\/ld\+json/i.test(text);
    const hasFaq = path.endsWith("/faq") || /"@type":"FAQPage"/i.test(text);
    const privateMatch = text.match(privatePattern)?.[0];
    results.push(response.status === 200 ? pass(`AI core status ${path}`) : fail(`AI core status ${path}`, String(response.status)));
    results.push(hasCanonical ? pass(`AI core canonical ${path}`) : fail(`AI core canonical ${path}`));
    results.push(hasH1 ? pass(`AI core H1 ${path}`) : fail(`AI core H1 ${path}`));
    results.push(hasAnswerBlock ? pass(`AI core answer block ${path}`) : fail(`AI core answer block ${path}`));
    results.push(hasJsonLd ? pass(`AI core schema ${path}`) : fail(`AI core schema ${path}`));
    results.push(hasFaq ? pass(`AI core FAQ ${path}`) : fail(`AI core FAQ ${path}`));
    results.push(!privateMatch ? pass(`AI core private data ${path}`) : fail(`AI core private data ${path}`, privateMatch));
  }
  return results;
}

async function checkGuides(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of guidePaths) {
    const { response, text } = await getText(path);
    const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+\/ru\/blog\//i.test(text);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasBlogPosting = /"@type":"BlogPosting"/i.test(text);
    const hasFaq = /"@type":"FAQPage"/i.test(text);
    const hasAnswerBlock = /data-ai-answer-block=["']true["']/i.test(text);
    const hasInternalLinks = (text.match(/href=["'][^"']+\/ru\//gi) ?? []).length >= 3;
    const privateMatch = text.match(privatePattern)?.[0];
    results.push(response.status === 200 ? pass(`guide status ${path}`) : fail(`guide status ${path}`, String(response.status)));
    results.push(hasCanonical ? pass(`guide canonical ${path}`) : fail(`guide canonical ${path}`));
    results.push(hasH1 ? pass(`guide H1 ${path}`) : fail(`guide H1 ${path}`));
    results.push(hasBlogPosting ? pass(`guide BlogPosting ${path}`) : fail(`guide BlogPosting ${path}`));
    results.push(hasFaq ? pass(`guide FAQ schema ${path}`) : fail(`guide FAQ schema ${path}`));
    results.push(hasAnswerBlock ? pass(`guide AI answer block ${path}`) : fail(`guide AI answer block ${path}`));
    results.push(hasInternalLinks ? pass(`guide internal links ${path}`) : fail(`guide internal links ${path}`));
    results.push(!privateMatch ? pass(`guide private data ${path}`) : fail(`guide private data ${path}`, privateMatch));
  }
  return results;
}

async function checkBlogHubs(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of blogHubPaths) {
    const { response, text } = await getText(path);
    const hasCanonical = new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+${path.replace(/\//g, "\\/")}["']`, "i").test(text);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasCluster = /Dordoi|Дордой|Dordoy|Карго|Kargo|Marketplace|Marketpleys/i.test(text);
    const privateMatch = text.match(privatePattern)?.[0];
    const hasAnswerBlock = /data-ai-answer-block=["']true["']/i.test(text);
    results.push(response.status === 200 ? pass(`blog hub status ${path}`) : fail(`blog hub status ${path}`, String(response.status)));
    results.push(hasCanonical ? pass(`blog hub canonical ${path}`) : fail(`blog hub canonical ${path}`));
    results.push(hasH1 ? pass(`blog hub H1 ${path}`) : fail(`blog hub H1 ${path}`));
    results.push(hasCluster ? pass(`blog hub clusters ${path}`) : fail(`blog hub clusters ${path}`));
    results.push(hasAnswerBlock ? pass(`blog hub AI answer block ${path}`) : fail(`blog hub AI answer block ${path}`));
    results.push(!privateMatch ? pass(`blog hub private data ${path}`) : fail(`blog hub private data ${path}`, privateMatch));
  }
  return results;
}

async function checkLocalizedGuides(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of localizedGuideSamplePaths) {
    const { response, text } = await getText(path);
    const hasCanonical = new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']+${path.replace(/\//g, "\\/")}["']`, "i").test(text);
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasBlogPosting = /"@type":"BlogPosting"/i.test(text);
    const hasAnswerBlock = /data-ai-answer-block=["']true["']/i.test(text);
    const hasHreflang =
      /hrefLang=["']ru["']/i.test(text) &&
      /hrefLang=["']kk["']/i.test(text) &&
      /hrefLang=["']ky["']/i.test(text) &&
      /hrefLang=["']uz["']/i.test(text) &&
      /hrefLang=["']tg["']/i.test(text) &&
      /hrefLang=["']x-default["']/i.test(text);
    const hasWrongHreflang = /hrefLang=["']kg["']|hrefLang=["']tj["']/i.test(text);
    const privateMatch = text.match(privatePattern)?.[0];
    results.push(response.status === 200 ? pass(`localized guide status ${path}`) : fail(`localized guide status ${path}`, String(response.status)));
    results.push(hasCanonical ? pass(`localized guide canonical ${path}`) : fail(`localized guide canonical ${path}`));
    results.push(hasH1 ? pass(`localized guide H1 ${path}`) : fail(`localized guide H1 ${path}`));
    results.push(hasBlogPosting ? pass(`localized guide BlogPosting ${path}`) : fail(`localized guide BlogPosting ${path}`));
    results.push(hasAnswerBlock ? pass(`localized guide AI answer block ${path}`) : fail(`localized guide AI answer block ${path}`));
    results.push(hasHreflang ? pass(`localized guide hreflang ${path}`) : fail(`localized guide hreflang ${path}`));
    results.push(!hasWrongHreflang ? pass(`localized guide no kg/tj hreflang ${path}`) : fail(`localized guide no kg/tj hreflang ${path}`));
    results.push(!privateMatch ? pass(`localized guide private data ${path}`) : fail(`localized guide private data ${path}`, privateMatch));
  }
  return results;
}

async function checkContentSpotChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const path of contentSpotCheckPaths) {
    const { response, text } = await getText(path);
    const htmlWithoutScripts = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    const bodyTextLength = htmlWithoutScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
    const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(text);
    const hasFaq = /FAQ|Частые вопросы|Сұрақ|Савол|Саволҳои|Суроо/i.test(text) || /"@type":"FAQPage"/i.test(text);
    const hasNoUnsafeGuarantee = !/гарантированн(?:ая|ые|ый|о)|guaranteed\s+(?:deal|delivery|supplier)|100%\s+(?:гарант|kafolat)/i.test(text);
    const privateMatch = text.match(privatePattern)?.[0];
    results.push(response.status === 200 ? pass(`content spot status ${path}`) : fail(`content spot status ${path}`, String(response.status)));
    results.push(hasH1 ? pass(`content spot H1 ${path}`) : fail(`content spot H1 ${path}`));
    results.push(bodyTextLength > 2500 ? pass(`content spot non-empty ${path}`, String(bodyTextLength)) : fail(`content spot non-empty ${path}`, String(bodyTextLength)));
    results.push(hasFaq ? pass(`content spot FAQ ${path}`) : fail(`content spot FAQ ${path}`));
    results.push(hasNoUnsafeGuarantee ? pass(`content spot no fake guarantee ${path}`) : fail(`content spot no fake guarantee ${path}`));
    results.push(!privateMatch ? pass(`content spot private data ${path}`) : fail(`content spot private data ${path}`, privateMatch));
  }
  return results;
}

async function main() {
  const checks: CheckResult[] = [];
  checks.push(...(await checkRedirect("/ru/dordoi-market", "/ru/rynok-dordoi")));
  checks.push(...(await checkRedirect("/ru/wholesale", "/ru/dordoi-optom")));
  checks.push(...(await checkRedirect("/ru/cargo", "/ru/kargo-dordoi")));
  checks.push(...(await checkLlms()));
  checks.push(...(await checkRobots()));
  checks.push(...(await checkSitemaps()));
  checks.push(...(await checkQueryNoindex()));
  checks.push(...(await checkPrivacy()));
  checks.push(...(await checkCoreAiPages()));
  checks.push(...(await checkCategories()));
  checks.push(...(await checkBlogHubs()));
  checks.push(...(await checkGuides()));
  checks.push(...(await checkLocalizedGuides()));
  checks.push(...(await checkContentSpotChecks()));

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    const status = item.ok ? "PASS" : "FAIL";
    console.log(`${status} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
  }

  console.log(`\nSEO smoke summary: ${checks.length - failed.length}/${checks.length} passed for ${baseUrl}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
