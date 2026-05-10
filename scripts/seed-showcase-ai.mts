/**
 * Golden-showcase seed: GPT (тексты) + **только fal.ai Nano Banana 2** (все фото), ватермарк, Storage, БД.
 *
 * Prerequisites: migration `20250511120000_showcase_vendors.sql` applied (fixed vendor/batch UUIDs).
 *
 * Usage:
 *   npx tsx scripts/seed-showcase-ai.mts
 *   npx tsx scripts/seed-showcase-ai.mts --images-only   # только фото fal + URL в БД; тексты вендоров не трогать
 *   npx tsx scripts/seed-showcase-ai.mts --reuse-storage   # без fal: взять уже залитые файлы из vendor-media, только URL в БД
 *   npx tsx scripts/seed-showcase-ai.mts --dry-run
 *
 * Env (`.env.local`):
 *   FAL_KEY или FAL_API_KEY — для полного сида и --images-only (не нужен при --reuse-storage)
 *   OPENAI_API_KEY — для GPT в полном сиде (не нужен при --images-only / --reuse-storage)
 *   NEXT_PUBLIC_SUPABASE_URL или SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: FAL_IMAGE_MODEL (default fal-ai/nano-banana-2), FAL_IMAGE_RESOLUTION, FAL_SAFETY_TOLERANCE, FAL_OUTPUT_FORMAT,
 *   OPENAI_SEED_TEXT_MODEL, VENDOR_MEDIA_BUCKET
 */
import { fal } from "@fal-ai/client";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function createAdminSupabase(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const VENDOR_1_ID = "10000000-0000-4000-8000-000000000001";
const VENDOR_2_ID = "10000000-0000-4000-8000-000000000002";
const BATCH_1_ID = "20000000-0000-4000-8000-000000000001";
const BATCH_2_ID = "20000000-0000-4000-8000-000000000002";

const TELEGRAM_CHAT_1 = -991000000001;
const TELEGRAM_CHAT_2 = -991000000002;

const LOGO_PROMPT =
  "Minimalist modern brand mark for SaaS marketplace 'Dordoi.help': clean typography, light blue and navy, symbolizing trade. " +
  "Show it as a photorealistic photograph of the logo UV-printed on matte white acrylic reception signage, soft daylight, subtle real reflections and edge bevel—NOT a cartoon mascot, NOT 3D plastic toy, NOT illustrated sticker.";

/** Prepended to every product image prompt (30 items). Per project spec. */
const PRODUCT_PROMPT_PREFIX =
  "Photorealistic, high-end commercial catalog photography. Shot on a Canon EOS R5, 85mm lens. Professional model. Natural studio lighting, soft shadows. Focus on fabric texture and realistic details. Ultra-detailed, 8k resolution. NO CGI, NO 3D RENDER.";

/** Люди на кадре — казахи / центральная Азия (для витрины рынков СНГ). Не про манекены без лица. */
const KAZAKH_PEOPLE_NOTE =
  "Whenever a real person or recognizable face or hands-on model is shown (not a headless mannequin), depict ethnically Kazakh or Central Asian appearance—natural facial features, skin tones, and hair typical of Kazakhstan/Kyrgyz region wholesale buyers and sellers; respectful documentary catalog look, no caricature.";

/** Extra guardrails for catalog shots (not duplicated in prefix). */
const PRODUCT_PROMPT_SUFFIX_NO_STYLIZED =
  "No cartoon, plastic toy, anime, vector illustration, or synthetic CGI skin. Vertical 9:16 frame, single hero subject, wholesale B2B catalog composition.";

const CLOTHING_SHOWROOM_PROMPT =
  "Photorealistic indoor shot of a bustling wholesale clothing booth at Dordoi market. Realistic racks filled with actual clothes, slightly messy but organized, fluorescent lighting matching the market atmosphere. " +
  "If any shoppers, sellers, or try-on models appear in the background or mid-ground, they should look Kazakh or Central Asian—authentic bazaar faces, candid documentary style. " +
  "NO CGI, NO 3D RENDER, no illustration.";

const FOOTWEAR_SHOWROOM_PROMPT =
  "Photorealistic interior shot of a wholesale shoe and underwear booth, rows of realistic shoeboxes, industrial market metal shelves. " +
  "If any people appear (staff, buyers), depict Kazakh or Central Asian adults, natural regional features, candid market realism. " +
  "NO CGI, NO 3D RENDER, no illustration.";

/** Subject line(s) for image API (fal or DALL·E); global prefix/suffix applied in code. */
type CatalogProductLine = { subject: string; altSubjects?: string[] };

const CLOTHING_PRODUCT_LINES: CatalogProductLine[] = [
  { subject: "Female model wearing a realistic red winter down jacket." },
  { subject: "Female model in a summer floral linen dress, sunny street setting." },
  { subject: "Male model, close up on raw denim jeans texture, straight fit." },
  { subject: "Young male model wearing a black urban streetwear hoodie." },
  { subject: "Male model in a sharp classic navy blue business suit." },
  { subject: "Female model in a full sportswear tracksuit set, running pose." },
  {
    subject: "Realistic child model wearing a colorful patterned playwear set.",
    altSubjects: [
      "Child-sized colorful patterned cotton playwear outfit on a department-store child mannequin, neutral studio background.",
    ],
  },
  { subject: "Female model wearing an elegant beige wool coat, autumn setting." },
  { subject: "Flat lay product shot of a basic white cotton t-shirt (multipack)." },
  { subject: "Female model in a sparkling material evening gown." },
  { subject: "Male model wearing chinos and a polo shirt, casual smart look." },
  { subject: "Female model in a cozy, knit oversized sweater." },
  {
    subject: "Female model wearing a bikini set on a realistic beach.",
    altSubjects: [
      "Adult female model at the shoreline wearing modest resort swimwear with a long opaque beach cover-up, department-store catalog framing.",
      "Wholesale tabletop display of folded women's swimwear sets with hang-tags on neutral linen, no people, beach boutique styling.",
    ],
  },
  { subject: "Female model in an elegant Modest fashion (Abaya/Hijab) dress." },
  { subject: "Female model wearing an activewear yoga set, doing a stretch." },
];

const FOOTWEAR_PRODUCT_LINES: CatalogProductLine[] = [
  { subject: "Close up of male model's feet wearing white leather casual sneakers." },
  { subject: "Luxury product photography of black women's high heels (stilettos)." },
  { subject: "Realistic leather winter boots, heavy duty thread, product shot." },
  { subject: "Close up of a packaged box set of men's luxury socks." },
  {
    subject:
      "Premium women's lingerie set (lace) displayed on a realistic mannequin or flat lay.",
    altSubjects: [
      "Department-store torso mannequin wearing a modest lace bralette and high-waist brief set, neutral backdrop, conservative catalog angle.",
    ],
  },
  {
    subject: "Child model's feet wearing colorful sandals.",
    altSubjects: [
      "Colorful children's sandals on a white product pedestal next to a shoebox, studio catalog shot, no people.",
    ],
  },
  { subject: "Close up of realistic running shoes in action (on feet), soft focus background." },
  { subject: "Male model wearing classic oxford dress shoes, studio setting." },
  { subject: "Male model's feet wearing sports socks." },
  {
    subject: "Packaged multipack of men's boxers, clean product shot.",
    altSubjects: [
      "Sealed retail carton of men's boxer briefs multipack on white tabletop, overhead angle, labels visible.",
    ],
  },
  { subject: "Lifestyle photography of female feet wearing cozy home slippers." },
  { subject: "Photorealistic wholesale display of leather backpacks and satchels." },
  { subject: "Close up of a boxed set with a silk scarf and tie." },
  { subject: "Female model's feet wearing trendy sandals." },
  { subject: "Realistic colorful cotton socks displayed on hanging hooks." },
];

function fullProductPrompt(body: string): string {
  return `${PRODUCT_PROMPT_PREFIX} ${KAZAKH_PEOPLE_NOTE} ${body} ${PRODUCT_PROMPT_SUFFIX_NO_STYLIZED}`;
}

function productPromptVariants(line: CatalogProductLine): string[] {
  const bodies = [line.subject, ...(line.altSubjects ?? [])];
  return bodies.map(fullProductPrompt);
}

function loadEnvLocal(): void {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Только перегенерация медиа и полей URL; description / store_name / categories не меняются. */
function imagesOnlyMode(): boolean {
  return hasFlag("images-only") || hasFlag("media-only");
}

function reuseStorageMode(): boolean {
  return hasFlag("reuse-storage") || hasFlag("restore-storage");
}

function resolveOpenAiKey(): string {
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) {
    throw new Error(
      "Missing OPENAI_API_KEY (set in .env.local or the environment).",
    );
  }
  return k;
}

function resolveSupabaseUrl(): string {
  const u =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!u) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL for Storage/public URLs.",
    );
  }
  return u;
}

function resolveServiceRole(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!k) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return k;
}

function resolveBucket(): string {
  return (process.env.VENDOR_MEDIA_BUCKET ?? "vendor-media").trim();
}

function textModel(): string {
  return (process.env.OPENAI_SEED_TEXT_MODEL ?? "gpt-4o-mini").trim();
}

function resolveFalKey(): string | null {
  const k =
    process.env.FAL_KEY?.trim() || process.env.FAL_API_KEY?.trim() || "";
  return k.length > 0 ? k : null;
}

function falImageEndpoint(): string {
  return (process.env.FAL_IMAGE_MODEL ?? "fal-ai/nano-banana-2").trim();
}

type FalResolution = "0.5K" | "1K" | "2K" | "4K";

function falImageResolution(): FalResolution {
  const r = (process.env.FAL_IMAGE_RESOLUTION ?? "1K").trim().toUpperCase();
  if (r === "0.5K" || r === "1K" || r === "2K" || r === "4K") return r;
  return "1K";
}

/** Все изображения сида — только через этот бэкенд (Nano Banana 2 на fal). */
type FalImageBackend = { endpointId: string; falKey: string };

function requireFalNanoBananaBackend(): FalImageBackend {
  const falKey = resolveFalKey();
  if (!falKey) {
    throw new Error(
      "Нужен FAL_KEY (или FAL_API_KEY) в .env.local — фотографии для витрины только через fal Nano Banana 2 (DALL·E отключён). Ключ: https://fal.ai/dashboard",
    );
  }
  return { endpointId: falImageEndpoint(), falKey };
}

function dalleSizeToFalAspectRatio(
  size: "1024x1024" | "1792x1024" | "1024x1792",
): "1:1" | "16:9" | "9:16" {
  if (size === "1024x1024") return "1:1";
  if (size === "1792x1024") return "16:9";
  return "9:16";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const wait = 800 * 2 ** i;
      console.warn(`${label} failed (try ${i + 1}/${attempts}), retry in ${wait}ms`, e);
      await sleep(wait);
    }
  }
  throw last;
}

async function applyWatermarkJpeg(imageBytes: Buffer): Promise<Buffer> {
  const meta = await sharp(imageBytes).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const base = Math.min(w, h);
  const margin = Math.max(12, Math.round(base * 0.022));
  const fontSize = Math.max(14, Math.round(base * 0.032));
  const strokeW = Math.max(2, Math.round(fontSize * 0.09));
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w - margin}" y="${h - margin}"
    font-family="Arial, Helvetica, system-ui, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="#ffffff"
    text-anchor="end"
    dominant-baseline="alphabetic"
    stroke="#000000"
    stroke-width="${strokeW}"
    stroke-opacity="0.35"
    paint-order="stroke fill"
  >Dordoi.help</text>
</svg>`;

  return sharp(imageBytes)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status} ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateImageBytesWithFal(
  endpointId: string,
  prompt: string,
  size: "1024x1024" | "1792x1024" | "1024x1792",
): Promise<Buffer> {
  const aspect_ratio = dalleSizeToFalAspectRatio(size);
  const safety_tolerance =
    (process.env.FAL_SAFETY_TOLERANCE ?? "5").trim() || "5";
  const output_format = (
    (process.env.FAL_OUTPUT_FORMAT ?? "jpeg").trim().toLowerCase() === "png"
      ? "png"
      : "jpeg"
  ) as "jpeg" | "png";

  const result = await fal.subscribe(endpointId, {
    input: {
      prompt,
      num_images: 1,
      aspect_ratio,
      output_format,
      safety_tolerance,
      resolution: falImageResolution(),
      limit_generations: true,
    },
    logs: false,
  });

  const data = result.data as {
    images?: Array<{ url?: string }>;
  };
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("fal: missing image URL in response");
  return await retry("downloadImage", () => downloadImage(url));
}

async function generateAndWatermark(
  falBackend: FalImageBackend | null,
  promptVariants: string[],
  size: "1024x1024" | "1792x1024" | "1024x1792",
  dryRun: boolean,
): Promise<{ jpeg: Buffer; revisedPrompt?: string } | null> {
  if (dryRun) {
    const head = promptVariants[0] ?? "";
    console.log(`[dry-run] image ${size}: ${head.slice(0, 120)}…`);
    return null;
  }

  if (promptVariants.length === 0) {
    throw new Error("generateAndWatermark: empty promptVariants");
  }

  if (!falBackend) {
    throw new Error("generateAndWatermark: falBackend missing");
  }

  let lastErr: unknown;

  for (let vi = 0; vi < promptVariants.length; vi++) {
    const prompt = promptVariants[vi];
    const transientAttempts = 3;
    for (let t = 0; t < transientAttempts; t++) {
      try {
        const raw = await generateImageBytesWithFal(
          falBackend.endpointId,
          prompt,
          size,
        );
        const jpeg = await applyWatermarkJpeg(raw);
        await sleep(800);
        return { jpeg, revisedPrompt: undefined };
      } catch (e) {
        lastErr = e;
        const wait = 800 * 2 ** t;
        console.warn(
          `fal image error (variant ${vi + 1}/${promptVariants.length}, try ${t + 1}/${transientAttempts}), retry in ${wait}ms`,
          e,
        );
        await sleep(wait);
      }
    }
    if (vi < promptVariants.length - 1) {
      console.warn(
        `fal: trying alternate prompt variant ${vi + 2}/${promptVariants.length}…`,
      );
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Image generation failed: ${String(lastErr)}`);
}

async function uploadVendorMedia(
  admin: SupabaseClient,
  bucket: string,
  telegramChatId: number,
  filenameHint: string,
  jpeg: Buffer,
): Promise<string> {
  const safe = filenameHint.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const objectPath = `${telegramChatId}/gold_${crypto.randomUUID().slice(0, 8)}_${safe}.jpg`;

  const { error } = await admin.storage.from(bucket).upload(objectPath, jpeg, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
  if (!data.publicUrl) throw new Error("getPublicUrl returned empty");
  return data.publicUrl;
}

/** `gold_<8hex>_<hint>.jpg` → hint (e.g. logo_clothing, product_12). */
function parseGoldUploadHint(fileName: string): string | null {
  const base = fileName.includes("/") ? fileName.split("/").pop()! : fileName;
  const m = /^gold_[a-f0-9]{8}_(.+)\.jpe?g$/i.exec(base);
  return m ? m[1] : null;
}

function fileTimeMs(f: { created_at?: string | null; updated_at?: string | null }): number {
  const t = f.updated_at || f.created_at || "";
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? ms : 0;
}

async function listBucketFilesFlat(
  admin: SupabaseClient,
  bucket: string,
  folder: string,
): Promise<Array<{ path: string; created_at?: string | null; updated_at?: string | null }>> {
  const out: Array<{
    path: string;
    created_at?: string | null;
    updated_at?: string | null;
  }> = [];
  const limit = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: "updated_at", order: "desc" },
    });
    if (error) {
      throw new Error(`Storage list ${folder}/: ${error.message}`);
    }
    if (!data?.length) break;
    for (const row of data) {
      if (!row.name) continue;
      out.push({
        path: `${folder}/${row.name}`,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

/**
 * Собирает публичные URL уже загруженных файлов (последняя версия по updated_at на каждый hint).
 * Не вызывает fal — только чтение Storage + getPublicUrl.
 */
async function collectShowcaseMediaUrlsFromStorage(
  admin: SupabaseClient,
  bucket: string,
): Promise<Map<string, string>> {
  const folder1 = String(TELEGRAM_CHAT_1);
  const folder2 = String(TELEGRAM_CHAT_2);

  const files1 = await listBucketFilesFlat(admin, bucket, folder1);
  const files2 = await listBucketFilesFlat(admin, bucket, folder2);

  type Best = { path: string; t: number };
  /** Ключ `telegramFolder::hint` — у двух вендоров одинаковые product_1…15 в разных папках. */
  const bestByFolderHint = new Map<string, Best>();

  function consider(path: string, meta: { created_at?: string | null; updated_at?: string | null }) {
    const slash = path.indexOf("/");
    if (slash <= 0) return;
    const fold = path.slice(0, slash);
    const base = path.slice(slash + 1);
    const hint = parseGoldUploadHint(base);
    if (!hint) return;
    const t = fileTimeMs(meta);
    const ck = `${fold}::${hint}`;
    const prev = bestByFolderHint.get(ck);
    if (!prev || t >= prev.t) {
      bestByFolderHint.set(ck, { path, t });
    }
  }

  for (const f of files1) consider(f.path, f);
  for (const f of files2) consider(f.path, f);

  function hintToJobKey(folder: string, hint: string): string | null {
    if (folder === folder1) {
      if (hint === "logo_clothing") return "v1_logo";
      if (hint === "showroom_clothing") return "v1_showroom";
      const pm = /^product_(\d+)$/.exec(hint);
      if (pm) return `v1_product_${pm[1]}`;
    }
    if (folder === folder2) {
      if (hint === "logo_footwear") return "v2_logo";
      if (hint === "showroom_footwear") return "v2_showroom";
      const pm = /^product_(\d+)$/.exec(hint);
      if (pm) return `v2_product_${pm[1]}`;
    }
    return null;
  }

  const urls = new Map<string, string>();

  for (const [ck, { path }] of bestByFolderHint) {
    const sep = ck.indexOf("::");
    if (sep <= 0) continue;
    const folder = ck.slice(0, sep);
    const hint = ck.slice(sep + 2);
    const key = hintToJobKey(folder, hint);
    if (!key) continue;
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) continue;
    urls.set(key, data.publicUrl);
  }

  const required: string[] = [
    "v1_logo",
    "v2_logo",
    "v1_showroom",
    "v2_showroom",
    ...CLOTHING_PRODUCT_LINES.map((_, i) => `v1_product_${i + 1}`),
    ...FOOTWEAR_PRODUCT_LINES.map((_, i) => `v2_product_${i + 1}`),
  ];

  const missing = required.filter((k) => !urls.has(k));
  if (missing.length > 0) {
    throw new Error(
      `В Storage не хватает файлов для: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}. ` +
        `Папки: ${folder1}/, ${folder2}/ (ожидаются имена вида gold_xxxxxxxx_<hint>.jpg). ` +
        `Либо залей недостающее, либо один раз запусти полный сид без --reuse-storage.`,
    );
  }

  return urls;
}

type StoreCopy = { description: string; description_detail: string | null };

async function generateStoreCopy(
  openai: OpenAI | null,
  spec: {
    storeLabel: string;
    bullets: string;
    mandatoryCaps: string;
    emojiHint: string;
  },
  dryRun: boolean,
): Promise<StoreCopy> {
  if (dryRun) {
    return {
      description: `[dry-run] ${spec.storeLabel}`,
      description_detail: null,
    };
  }

  if (!openai) {
    throw new Error("generateStoreCopy: OpenAI client missing");
  }

  const user = `Ты копирайтер оптового маркетплейса Dordoi.help.

Магазин: ${spec.storeLabel}

Факты для текста:
${spec.bullets}

Обязательно включи в поле description дословно (CAPS) эту строку целиком:
${spec.mandatoryCaps}

Стиль: профессиональный B2B-опт, русский язык. Начни поле description с одного подходящего эмодзи (${spec.emojiHint}). Без Markdown и без заголовков #.

Верни строго JSON с ключами:
- description: основной текст карточки (как на превью каталога), 2–4 предложения плюс обязательная CAPS-строка.
- description_detail: развёрнутое продолжение для страницы магазина (3–6 предложений), без повторения CAPS-строки дословно второй раз; можно упомянуть ассортимент и работу с байерами.`;

  const res = await retry("chat.completions", () =>
    openai.chat.completions.create({
      model: textModel(),
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Отвечай только валидным JSON-объектом на русском. Не добавляй комментарии.",
        },
        { role: "user", content: user },
      ],
    }),
  );

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty GPT response for store copy");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : "";
  const detailRaw = parsed.description_detail;
  const description_detail =
    typeof detailRaw === "string" && detailRaw.trim().length > 0
      ? detailRaw.trim()
      : null;

  if (!description.includes(spec.mandatoryCaps)) {
    console.warn(
      "GPT omitted mandatory CAPS line; appending for compliance:",
      spec.mandatoryCaps,
    );
    return {
      description: `${description}\n\n${spec.mandatoryCaps}`,
      description_detail,
    };
  }

  return { description, description_detail };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const dryRun = hasFlag("dry-run");
  const reuseStorage = reuseStorageMode();
  const imagesOnly = imagesOnlyMode();

  if (!dryRun) {
    resolveSupabaseUrl();
    resolveServiceRole();
    if (!reuseStorage && !imagesOnly) {
      resolveOpenAiKey();
    }
  }

  const bucket = resolveBucket();
  const falBackend: FalImageBackend | null =
    dryRun || reuseStorage ? null : requireFalNanoBananaBackend();
  if (!dryRun && falBackend) {
    fal.config({ credentials: falBackend.falKey });
  }
  const openai =
    dryRun || reuseStorage || imagesOnly
      ? null
      : new OpenAI({ apiKey: resolveOpenAiKey() });
  const admin = dryRun ? null : createAdminSupabase();

  console.log(
    dryRun
      ? "Dry run: no API calls, no DB/storage writes."
      : reuseStorage
        ? `Bucket: ${bucket}, режим --reuse-storage: fal не вызываем, только Storage → БД`
        : `Bucket: ${bucket}, text: ${textModel()}, images: fal ${falBackend!.endpointId} (${falImageResolution()}) — только Nano Banana`,
  );

  const skipGpt = reuseStorage || imagesOnly;
  const [copy1, copy2] = skipGpt
    ? await Promise.resolve([
        { description: "", description_detail: null } as StoreCopy,
        { description: "", description_detail: null } as StoreCopy,
      ])
    : await Promise.all([
        generateStoreCopy(openai, {
          storeLabel: "Dordoi.help | Пример #1",
          bullets:
            "КРУПНЫЙ И МЕЛКИЙ ОПТ, ПРЯМОЕ ПРОИЗВОДСТВО. Женская, мужская, детская одежда; сезонные коллекции.",
          mandatoryCaps:
            "ОФИЦИАЛЬНОЕ ОТКРЫТИЕ КАТАЛОГА — 21 МАЯ! ЗАЙМИ СВОЕ МЕСТО!",
          emojiHint: "🔥 или 🚀",
        }, dryRun),
        generateStoreCopy(openai, {
          storeLabel: "Dordoi.help | Пример #2",
          bullets:
            "ОПТ, КОРЕЯ, ТУРЦИЯ, КИТАЙ. Обувь, бельё, носки, аксессуары; работа с оптовиками СНГ.",
          mandatoryCaps: "21 МАЯ — ЗАПУСК ТРАФИКА! БУДЬ В ЧИСЛЕ ПЕРВЫХ!",
          emojiHint: "🚀 или 🔥",
        }, dryRun),
      ]);

  type Planned = {
    key: string;
    promptVariants: string[];
    size: "1024x1024" | "1792x1024" | "1024x1792";
    telegramChatId: number;
    filenameHint: string;
  };

  const queue: Planned[] = [];

  queue.push({
    key: "v1_logo",
    promptVariants: [LOGO_PROMPT],
    size: "1024x1024",
    telegramChatId: TELEGRAM_CHAT_1,
    filenameHint: "logo_clothing",
  });
  queue.push({
    key: "v2_logo",
    promptVariants: [LOGO_PROMPT],
    size: "1024x1024",
    telegramChatId: TELEGRAM_CHAT_2,
    filenameHint: "logo_footwear",
  });

  queue.push({
    key: "v1_showroom",
    promptVariants: [CLOTHING_SHOWROOM_PROMPT],
    size: "1792x1024",
    telegramChatId: TELEGRAM_CHAT_1,
    filenameHint: "showroom_clothing",
  });
  queue.push({
    key: "v2_showroom",
    promptVariants: [FOOTWEAR_SHOWROOM_PROMPT],
    size: "1792x1024",
    telegramChatId: TELEGRAM_CHAT_2,
    filenameHint: "showroom_footwear",
  });

  CLOTHING_PRODUCT_LINES.forEach((line, i) => {
    queue.push({
      key: `v1_product_${i + 1}`,
      promptVariants: productPromptVariants(line),
      size: "1024x1792",
      telegramChatId: TELEGRAM_CHAT_1,
      filenameHint: `product_${i + 1}`,
    });
  });

  FOOTWEAR_PRODUCT_LINES.forEach((line, i) => {
    queue.push({
      key: `v2_product_${i + 1}`,
      promptVariants: productPromptVariants(line),
      size: "1024x1792",
      telegramChatId: TELEGRAM_CHAT_2,
      filenameHint: `product_${i + 1}`,
    });
  });

  const urls = new Map<string, string>();

  if (!dryRun && reuseStorage && admin) {
    console.log("Сканирую vendor-media (уже загруженные gold_* файлы)…");
    const fromBucket = await collectShowcaseMediaUrlsFromStorage(admin, bucket);
    fromBucket.forEach((url, key) => urls.set(key, url));
    console.log(`Найдено ${urls.size} публичных URL, fal не вызывался.`);
  } else {
    for (const job of queue) {
      console.log(`Generating ${job.key}…`);
      const out = await generateAndWatermark(
        falBackend,
        job.promptVariants,
        job.size,
        dryRun,
      );
      if (!dryRun && out && admin) {
        const pub = await uploadVendorMedia(
          admin,
          bucket,
          job.telegramChatId,
          job.filenameHint,
          out.jpeg,
        );
        urls.set(job.key, pub);
        console.log(`  → ${pub}`);
      }
    }
  }

  if (dryRun) {
    console.log("Dry run finished.");
    return;
  }

  const logo1 = urls.get("v1_logo");
  const logo2 = urls.get("v2_logo");
  const sr1 = urls.get("v1_showroom");
  const sr2 = urls.get("v2_showroom");
  if (!logo1 || !logo2 || !sr1 || !sr2) {
    throw new Error("Missing generated URLs for logo/showroom");
  }

  const photos1 = CLOTHING_PRODUCT_LINES.map((_, i) => {
    const u = urls.get(`v1_product_${i + 1}`);
    if (!u) throw new Error(`Missing product URL v1 ${i + 1}`);
    return u;
  });
  const photos2 = FOOTWEAR_PRODUCT_LINES.map((_, i) => {
    const u = urls.get(`v2_product_${i + 1}`);
    if (!u) throw new Error(`Missing product URL v2 ${i + 1}`);
    return u;
  });

  const mediaOnly = imagesOnly || reuseStorage;

  const { error: e1 } = await admin!
    .from("vendors")
    .update(
      mediaOnly
        ? {
            logo_url: logo1,
            container_photo_url: sr1,
            product_photos: photos1,
          }
        : {
            store_name: "Dordoi.help | Пример #1",
            description: copy1.description,
            description_detail: copy1.description_detail,
            logo_url: logo1,
            container_photo_url: sr1,
            product_photos: photos1,
            categories: [
              "Женская одежда",
              "Мужская одежда",
              "Детская одежда",
              "Верхняя одежда",
            ],
          },
    )
    .eq("id", VENDOR_1_ID);

  if (e1) throw new Error(`Update vendor 1: ${e1.message}`);

  const { error: e2 } = await admin!
    .from("vendors")
    .update(
      mediaOnly
        ? {
            logo_url: logo2,
            container_photo_url: sr2,
            product_photos: photos2,
          }
        : {
            store_name: "Dordoi.help | Пример #2",
            description: copy2.description,
            description_detail: copy2.description_detail,
            logo_url: logo2,
            container_photo_url: sr2,
            product_photos: photos2,
            categories: [
              "Обувь",
              "Нижнее белье",
              "Чулочно-носочные изделия",
              "Сумки и Аксессуары",
            ],
          },
    )
    .eq("id", VENDOR_2_ID);

  if (e2) throw new Error(`Update vendor 2: ${e2.message}`);

  await admin!.from("vendor_photo_batch_items").delete().eq("batch_id", BATCH_1_ID);
  await admin!.from("vendor_photo_batch_items").delete().eq("batch_id", BATCH_2_ID);

  const items1 = photos1.map((photo_url, idx) => ({
    batch_id: BATCH_1_ID,
    photo_url,
    position: (idx + 1) as number,
  }));
  const items2 = photos2.map((photo_url, idx) => ({
    batch_id: BATCH_2_ID,
    photo_url,
    position: (idx + 1) as number,
  }));

  const { error: bi1 } = await admin!
    .from("vendor_photo_batch_items")
    .insert(items1);
  if (bi1) throw new Error(`Insert batch items 1: ${bi1.message}`);

  const { error: bi2 } = await admin!
    .from("vendor_photo_batch_items")
    .insert(items2);
  if (bi2) throw new Error(`Insert batch items 2: ${bi2.message}`);

  if (reuseStorage) {
    console.log(
      "Done. Ссылки на фото восстановлены из Storage (fal/GPT не вызывались, тексты вендоров не меняли).",
    );
  } else if (imagesOnly) {
    console.log(
      "Done. Только медиа обновлено (fal + ватермарк), описания вендоров не трогали.",
    );
  } else {
    console.log("Done. Showcase vendors synced with AI media + GPT copy.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
