/**
 * Quick favicon audit for production or local dev (Yandex / browser requirements).
 *
 * Usage:
 *   npx tsx scripts/seo/audit-favicon.mts
 *   BASE_URL=https://dordoi.help npx tsx scripts/seo/audit-favicon.mts
 */

const baseUrl = (process.env.BASE_URL ?? "https://dordoi.help").replace(/\/+$/, "");

const REQUIRED_STATIC = [
  { path: "/favicon.ico", minBytes: 100, contentTypes: ["image/x-icon", "image/vnd.microsoft.icon"] },
  { path: "/favicon-32.png", minBytes: 100, contentTypes: ["image/png"] },
  { path: "/favicon-120.png", minBytes: 500, contentTypes: ["image/png"] },
  { path: "/apple-touch-icon.png", minBytes: 500, contentTypes: ["image/png"] },
] as const;

async function checkStatic(path: string, minBytes: number, contentTypes: readonly string[]) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: { "user-agent": "YandexBot" },
    redirect: "follow",
  });
  const ct = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const buf = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
  const typeOk = contentTypes.some((t) => ct === t || ct.startsWith(`${t};`));
  return {
    path,
    ok: res.ok && buf.length >= minBytes && typeOk,
    status: res.status,
    contentType: ct,
    bytes: buf.length,
    detail:
      !res.ok
        ? `HTTP ${res.status}`
        : buf.length < minBytes
          ? `too small (${buf.length} < ${minBytes} bytes)`
          : !typeOk
            ? `unexpected Content-Type ${ct || "(empty)"}`
            : undefined,
  };
}

async function checkHomepageLinks() {
  const url = `${baseUrl}/ru`;
  const res = await fetch(url, { headers: { "user-agent": "YandexBot" }, redirect: "follow" });
  const html = res.ok ? await res.text() : "";
  const hasIco = html.includes('href="/favicon.ico"') || html.includes("favicon.ico");
  const has120 = html.includes('href="/favicon-120.png"');
  return {
    path: "/ru (HTML)",
    ok: res.ok && hasIco,
    status: res.status,
    contentType: "text/html",
    bytes: html.length,
    detail: !res.ok
      ? `HTTP ${res.status}`
      : !hasIco
        ? "no <link rel=\"icon\" href=\"/favicon.ico\"> in HTML"
        : !has120
          ? "warn: no favicon-120.png link (optional but recommended for Yandex snippets)"
          : undefined,
    warnOnly: res.ok && hasIco && !has120,
  };
}

async function main() {
  console.log(`Favicon audit — ${baseUrl}\n`);
  const results = [
    ...(await Promise.all(
      REQUIRED_STATIC.map(({ path, minBytes, contentTypes }) =>
        checkStatic(path, minBytes, contentTypes),
      ),
    )),
    await checkHomepageLinks(),
  ];

  let failed = 0;
  for (const r of results) {
    const warn = "warnOnly" in r && r.warnOnly && r.ok;
    const mark = r.ok ? (warn ? "⚠" : "✓") : "✗";
    const extra = r.detail ? ` — ${r.detail}` : "";
    console.log(`${mark} ${r.path} [${r.status}] ${r.contentType || "-"} ${r.bytes}b${extra}`);
    if (!r.ok) failed++;
  }

  if (failed > 0) {
    console.log(`\n${failed} check(s) failed. Run: npm run generate:brand-icons`);
    process.exit(1);
  }
  console.log("\nAll required favicon checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
