const BASE = "http://localhost:3000";

const PRIVACY_URLS = [
  "/ru/catalog",
  "/ru/catalog/asso-corsets",
  "/ru/catalog/arusha-kg",
  "/ru/catalog/slavyana-moda",
  "/ru/suppliers",
];

const QUERY_URLS = [
  "/ru/catalog",
  "/ru/catalog?page=2",
  "/ru/catalog?cat=women",
  "/ru/catalog?search=dress",
  "/ru/catalog?sort=new",
  "/ru/catalog?compare=1",
];

const LOCALE_URLS = [
  "/ru/catalog",
  "/kk/catalog",
  "/kg/catalog",
  "/uz/catalog",
  "/tj/catalog",
  "/ru/suppliers",
  "/kk/suppliers",
  "/kg/suppliers",
  "/uz/suppliers",
  "/tj/suppliers",
];

const CONTACT_PATTERNS = [
  { id: "instagram-profile", re: /href=["']https?:\/\/(www\.)?instagram\.com\//i },
  { id: "t.me", re: /(?:href=["']https?:\/\/t\.me\/|>https?:\/\/t\.me\/)/i },
  { id: "wa.me", re: /(?:href=["']https?:\/\/wa\.me\/|>https?:\/\/wa\.me\/)/i },
  { id: "tel:", re: /href=["']tel:/i },
  { id: "telephone-jsonld", re: /"telephone"\s*:/i },
  { id: "sameAs", re: /"sameAs"\s*:/i },
  { id: "whatsapp-cta", re: />Написать в WhatsApp</i },
  { id: "telegram-cta", re: />Telegram</i },
];

const MEDIA_PATTERNS = [
  { id: "cdninstagram", re: /cdninstagram\.com/i },
  { id: "instagram.com-media", re: /instagram\.com\/o1\/v\//i },
];

function pickMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${name}"`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function pickCanonical(html) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  return m?.[1] ?? null;
}

function pickTitle(html) {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
}

function pickH1(html) {
  return html.match(/<h1[^>]*>([^<]*)</i)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function scan(html, patterns) {
  return patterns.filter((p) => p.re.test(html)).map((p) => p.id);
}

async function fetchHtml(path) {
  const res = await fetch(BASE + path, { headers: { Accept: "text/html" } });
  return { path, status: res.status, html: await res.text() };
}

console.log("=== PRIVACY GREP ===");
for (const path of PRIVACY_URLS) {
  const { status, html } = await fetchHtml(path);
  const contact = scan(html, CONTACT_PATTERNS);
  const media = scan(html, MEDIA_PATTERNS);
  const igMention = /instagram/i.test(html) && !media.length && !contact.includes("instagram-profile");
  console.log(`\n${path} [${status}]`);
  console.log("  contact leaks:", contact.length ? contact.join(", ") : "none");
  console.log("  media URLs:", media.length ? media.join(", ") : "none");
  if (igMention) console.log("  text mention 'instagram': possible safe text/bundle");
}

console.log("\n\n=== QUERY SEO ===");
for (const path of QUERY_URLS) {
  const { status, html } = await fetchHtml(path);
  const h1 = pickH1(html);
  const hasGrid = html.includes("gridAria") || html.includes("Каталог поставщиков") || html.includes("catalog");
  console.log(`\n${path} [${status}]`);
  console.log("  robots:", pickMeta(html, "robots"));
  console.log("  canonical:", pickCanonical(html));
  console.log("  h1:", h1);
  console.log("  page shell ok:", hasGrid ? "yes" : "check manually");
}

console.log("\n\n=== TITLE DUPLICATION ===");
for (const path of ["/ru/catalog", "/ru/suppliers", "/ru"]) {
  const { html } = await fetchHtml(path);
  const title = pickTitle(html);
  const dup = title?.includes("| Dordoi.help | Dordoi.help") ? "YES" : "no";
  console.log(`${path}: ${title}`);
  console.log(`  duplicated suffix: ${dup}`);
}

console.log("\n\n=== LOCALE H1/TITLE/DESCRIPTION ===");
for (const path of LOCALE_URLS) {
  const { html } = await fetchHtml(path);
  console.log(`\n${path}`);
  console.log("  title:", pickTitle(html));
  console.log("  description:", (pickMeta(html, "description") ?? "").slice(0, 100) + "...");
  console.log("  h1:", pickH1(html));
}
