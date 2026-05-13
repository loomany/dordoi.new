/**
 * Аудит: заголовки карточек vs store_name, parsed_ai_data, Instagram.
 * npm run audit:catalog-ai-titles
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  isPlaceholderCatalogStoreName,
  resolveCatalogStoreTitleForCard,
  stripGenericShopSuffixFromStoreTitle,
} from "@/lib/catalog/catalog-card-title";
import { getAiCatalogDisplayOverlay } from "@/lib/catalog/parsed-ai-catalog-overlay";

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
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

type Row = {
  slug: string;
  store_name: string | null;
  instagram_url: string | null;
  parsed_ai_data: unknown;
};

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Need Supabase env");
    process.exit(1);
  }

  const admin = createClient(url, key);
  const { data, error } = await admin
    .from("vendors")
    .select("slug, store_name, instagram_url, parsed_ai_data")
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("store_name");

  if (error) throw error;
  const rows = (data ?? []) as Row[];

  let noAi = 0;
  let stripWouldHelp = 0;
  let placeholderNoBrand = 0;
  let placeholderHasIgNoAiBrand = 0;
  let cardTitleStillBad = 0;

  const badExamples: string[] = [];

  for (const r of rows) {
    const raw = r.store_name?.trim() ?? "";
    const stripped = stripGenericShopSuffixFromStoreTitle(raw);
    const ai = getAiCatalogDisplayOverlay(r.parsed_ai_data);
    const resolved = resolveCatalogStoreTitleForCard({
      dbStoreName: raw,
      fallbackTitle: raw,
      catalogBrandNameFromAi: ai?.catalogBrandName,
      instagramProfileUrl: r.instagram_url,
    });

    if (!r.parsed_ai_data) noAi++;
    if (raw && stripped !== raw) stripWouldHelp++;

    const isPlaceholder = isPlaceholderCatalogStoreName(stripped || raw);
    if (isPlaceholder) {
      placeholderNoBrand++;
      const ig = r.instagram_url?.trim();
      if (ig && !ai?.catalogBrandName) placeholderHasIgNoAiBrand++;
    }

    const titleBad =
      /,\s*(магазин|бутик|шоурум)/iu.test(resolved.storeTitle) ||
      isPlaceholderCatalogStoreName(resolved.storeTitle);

    if (titleBad) {
      cardTitleStillBad++;
      if (badExamples.length < 50) {
        badExamples.push(
          [
            r.slug,
            `store_name: ${raw}`,
            `stripped: ${stripped}`,
            `AI brand: ${ai?.catalogBrandName ?? "—"}`,
            `card title: ${resolved.storeTitle}`,
            `ig: ${r.instagram_url ?? "—"}`,
          ].join("\n  "),
        );
      }
    }
  }

  console.error("──────── Аудит заголовков каталога ────────");
  console.error(`Всего approved:              ${rows.length}`);
  console.error(`Без parsed_ai_data:          ${noAi}`);
  console.error(`Strip помог бы (store_name): ${stripWouldHelp}`);
  console.error(`Заглушка в store_name:       ${placeholderNoBrand}`);
  console.error(`Заглушка + IG, AI brand —:   ${placeholderHasIgNoAiBrand}`);
  console.error(`Плохой итог card title:      ${cardTitleStillBad}`);
  console.error("");
  console.log("Примеры плохих заголовков:\n");
  for (const ex of badExamples) {
    console.log(ex);
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
