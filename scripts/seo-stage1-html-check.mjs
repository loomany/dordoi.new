const BASE = "http://localhost:3000";
const URLS = [
  "/ru/catalog",
  "/ru/catalog?page=2",
  "/ru/catalog?cat=women",
  "/ru/catalog?compare=1",
  "/ru/suppliers",
  "/ru/catalog/asso-corsets",
  "/ru/catalog/arusha-kg",
  "/ru/catalog/slavyana-moda",
];

const CONTACT_LEAK = [
  "wa.me/",
  "t.me/",
  "tel:",
  'href="https://www.instagram',
  'href="https://instagram',
  '"telephone"',
  '"sameAs"',
];

function pickMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${name}"`,
    "i",
  );
  const m2 = html.match(re2);
  return m2?.[1] ?? null;
}

function pickCanonical(html) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  return m?.[1] ?? null;
}

function pickTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m?.[1] ?? null;
}

function pickH1(html) {
  const m = html.match(/<h1[^>]*>([^<]*)</i);
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? null;
}

function contactLeaks(html) {
  return CONTACT_LEAK.filter((p) => html.includes(p));
}

for (const path of URLS) {
  const url = BASE + path;
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  const html = await res.text();
  const leaks = contactLeaks(html);
  console.log("\n===", path, "status", res.status, "===");
  console.log("title:", pickTitle(html));
  console.log("description:", pickMeta(html, "description"));
  console.log("robots:", pickMeta(html, "robots"));
  console.log("canonical:", pickCanonical(html));
  console.log("h1:", pickH1(html));
  console.log("hreflang count:", (html.match(/hreflang=/g) ?? []).length);
  console.log("contact leaks:", leaks.length ? leaks.join(", ") : "none");
  console.log(
    "locked message:",
    html.includes("Контакт поставщика доступен") ? "yes" : "no",
  );
}
