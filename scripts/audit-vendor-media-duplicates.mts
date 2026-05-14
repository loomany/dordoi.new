/**
 * Аудит: у продавцов с видео+фото — есть ли дубли poster→photo в ленте.
 * Запуск: npx tsx scripts/audit-vendor-media-duplicates.mts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const {
  buildInterleavedCatalogMediaSlides,
  findAdjacentPosterDuplicates,
} = await import("../lib/catalog/catalog-lead-video.ts");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE env");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await sb
  .from("vendors")
  .select("slug, product_photos, product_videos, status")
  .eq("status", "approved")
  .not("slug", "is", null);

if (error) {
  console.error(error);
  process.exit(1);
}

let withBoth = 0;
let pairedEqualLength = 0;
let withPosterDuplicates = 0;
const examples: string[] = [];

for (const row of data ?? []) {
  const photos = (row.product_photos ?? []).filter(Boolean);
  const videos = (row.product_videos ?? []).filter(Boolean);
  if (photos.length === 0 || videos.length === 0) continue;
  withBoth += 1;
  if (photos.length === videos.length) pairedEqualLength += 1;

  const slides = buildInterleavedCatalogMediaSlides({
    productVideos: videos,
    photoUrls: photos,
  });
  const dups = findAdjacentPosterDuplicates(slides);
  if (dups.length > 0) {
    withPosterDuplicates += 1;
    if (examples.length < 8) {
      examples.push(
        `${row.slug}: ${dups.length} adjacent duplicate(s) [${dups.map((d) => d.direction).join(", ")}], ${photos.length} photos / ${videos.length} videos`,
      );
    }
  }
}

console.log("=== Vendor media duplicate audit (approved) ===\n");
console.log("With both photos and videos:", withBoth);
console.log("Equal photo/video counts (Instagram paired thumbs):", pairedEqualLength);
console.log("With adjacent video↔photo poster duplicates:", withPosterDuplicates);
if (examples.length) {
  console.log("\nExamples:");
  for (const line of examples) console.log(" ", line);
} else {
  console.log("\nNo poster duplicate pairs in interleaved slides.");
}
