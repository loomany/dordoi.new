import { digitsOnly } from "@/lib/phone";

/** Одна запись из выгрузки Instagram profile scraper (минимально нужные поля). */
export type InstagramProfileRow = {
  inputUrl?: string;
  profilePicUrl?: string | null;
  profilePicUrlHD?: string | null;
  biography?: string | null;
  followersCount?: number | null;
  externalUrl?: string | null;
  externalUrls?: { url?: string | null }[] | null;
  latestPosts?: InstagramLatestPost[] | null;
};

export type InstagramLatestPost = {
  type?: string;
  displayUrl?: string | null;
  videoUrl?: string | null;
  locationName?: string | null;
  locationId?: string | null;
};

export const INSTAGRAM_PROFILE_IMPORT_SOURCE = "instagram_profile" as const;

const DEFAULT_MIN_BATCH_MARKERS = new Set(
  ["не указано", "не указан", "n/a", "—", "-"].map((s) => s.toLowerCase()),
);

const OPT_REGEX =
  /\b(опт(ом|а)?|wholesale|только\s+опт|оптовые\s+цены|оптовик)\b/i;
const DELIVERY_REGEX =
  /\b(доставк[аи]|карго|отправк[аи]|перевозк[аи]|сдэк|cdek|почт[аы])\b/i;

/** Нормализованный username Instagram (нижний регистр, без @). */
export function canonicalInstagramUsernameFromUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "instagram.com" && host !== "instagr.am") return null;
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path) return null;
    const first = path.split("/").filter(Boolean)[0];
    if (!first) return null;
    const skip = new Set(["p", "reel", "reels", "stories", "tv", "explore"]);
    if (skip.has(first.toLowerCase())) return null;
    return first.toLowerCase();
  } catch {
    return null;
  }
}

export function pickLogoUrl(row: InstagramProfileRow): string | null {
  const hd = row.profilePicUrlHD?.trim();
  if (hd) return hd;
  const p = row.profilePicUrl?.trim();
  return p || null;
}

export function collectExternalUrlStrings(row: InstagramProfileRow): string[] {
  const out: string[] = [];
  const main = row.externalUrl?.trim();
  if (main) out.push(main);
  for (const e of row.externalUrls ?? []) {
    const u = e?.url?.trim();
    if (u) out.push(u);
  }
  return out;
}

/** Первые до 15 displayUrl из latestPosts. */
export function extractProductPhotoUrls(
  posts: InstagramLatestPost[] | null | undefined,
  max = 15,
): string[] {
  if (!Array.isArray(posts)) return [];
  const urls: string[] = [];
  for (const p of posts) {
    const u = p.displayUrl?.trim();
    if (u && !urls.includes(u)) urls.push(u);
    if (urls.length >= max) break;
  }
  return urls;
}

/** До 15 videoUrl из постов с видео. */
export function extractProductVideoUrls(
  posts: InstagramLatestPost[] | null | undefined,
  max = 15,
): string[] {
  if (!Array.isArray(posts)) return [];
  const urls: string[] = [];
  for (const p of posts) {
    const u = p.videoUrl?.trim();
    if (u && !urls.includes(u)) urls.push(u);
    if (urls.length >= max) break;
  }
  return urls;
}

function stripLeadingEmojiAndPunctuation(text: string): string {
  let s = text;
  // Leading bullets / spaces / common punctuation
  while (s.length > 0) {
    const ch = s.codePointAt(0);
    if (ch === undefined) break;
    const len = ch > 0xffff ? 2 : 1;
    const cp = String.fromCodePoint(ch);
    // Emoji ranges (simplified): skip misc symbols & pictographs block start
    const isEmoji =
      (ch >= 0x1f300 && ch <= 0x1faf6) ||
      (ch >= 0x2600 && ch <= 0x27bf) ||
      (ch >= 0x1f000 && ch <= 0x1f9ff) ||
      cp === "•" ||
      cp === "·" ||
      cp === "▪" ||
      cp === "▫" ||
      cp === "◦";
    const isSpace = /\s/u.test(cp);
    const isBullet = /^[•·▪▫◦\-—–\u2022]/u.test(cp);
    if (isEmoji || isSpace || isBullet) {
      s = s.slice(len);
      continue;
    }
    break;
  }
  return s.trimStart();
}

/**
 * Краткое описание для каталога (100–150 символов), без ведущих эмодзи/маркеров.
 */
export function catalogShortDescriptionFromBiography(
  biography: string | null | undefined,
  _minLen = 100,
  maxLen = 150,
): string | null {
  const raw = biography?.trim();
  if (!raw) return null;
  let s = stripLeadingEmojiAndPunctuation(raw.replace(/\s+/g, " "));
  if (!s) return null;
  if (s.length <= maxLen) return s;
  const slice = s.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLen * 0.55 ? slice.slice(0, lastSpace) : slice;
  const trimmed = cut.replace(/[\s,.;:!?\-—]+$/u, "");
  return trimmed.length > 0 ? `${trimmed}…` : null;
}

export function detectWholesaleInText(text: string): boolean {
  return OPT_REGEX.test(text);
}

export function detectDeliveryInText(text: string): boolean {
  return DELIVERY_REGEX.test(text);
}

export function isPlaceholderMinBatch(value: string | null | undefined): boolean {
  const t = value?.trim().toLowerCase() ?? "";
  if (!t) return true;
  return DEFAULT_MIN_BATCH_MARKERS.has(t);
}

/**
 * Предлагаемое значение min_batch из био (если есть маркеры опта).
 */
export function suggestMinBatchFromBiography(
  biography: string | null | undefined,
): string | null {
  const bio = biography?.trim() ?? "";
  if (!bio || !detectWholesaleInText(bio)) return null;
  return "Опт";
}

/** Первый WhatsApp в виде цифр для whatsapp_1 (если нашли wa.me или длинный номер в тексте). */
export function extractWhatsappDigitsFromProfile(
  row: InstagramProfileRow,
): string | null {
  const haystack: string[] = [];
  const bio = row.biography?.trim();
  if (bio) haystack.push(bio);
  haystack.push(...collectExternalUrlStrings(row));

  const waMeGlobal = /https?:\/\/wa\.me\/(\d{8,15})/gi;
  for (const text of haystack) {
    waMeGlobal.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = waMeGlobal.exec(text)) !== null) {
      const d = digitsOnly(m[1] ?? "");
      if (d.length >= 8) return d;
    }
  }

  const plusPhone = /\+?\d[\d\s().\-–]{10,}\d/g;
  for (const text of haystack) {
    const m = text.match(plusPhone);
    if (!m) continue;
    for (const frag of m) {
      const d = digitsOnly(frag);
      if (d.length >= 8 && d.length <= 15) return d;
    }
  }
  return null;
}

/** Подсказка модератору по локации из постов, если отличается от location_row. */
export function buildInstagramLocationModerationAppend(params: {
  posts: InstagramLatestPost[] | null | undefined;
  locationRow: string | null | undefined;
}): string | null {
  const rowNorm = normalizeLocationHint(params.locationRow);
  const seen = new Set<string>();
  const hints: string[] = [];
  for (const p of params.posts ?? []) {
    const name = p.locationName?.trim();
    if (!name) continue;
    const id = p.locationId?.trim();
    const key = `${name}|${id ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const nameNorm = normalizeLocationHint(name);
    if (nameNorm && nameNorm !== rowNorm) {
      hints.push(id ? `${name} (id: ${id})` : name);
    }
    if (hints.length >= 5) break;
  }
  if (hints.length === 0) return null;
  return `Instagram (локации в постах): ${hints.join("; ")}`;
}

function normalizeLocationHint(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

export function mergeModerationNoteAppend(
  existing: string | null | undefined,
  append: string,
): string {
  const base = existing?.trim() ?? "";
  if (!base) return append;
  if (base.includes(append)) return base;
  return `${base}\n\n${append}`;
}
