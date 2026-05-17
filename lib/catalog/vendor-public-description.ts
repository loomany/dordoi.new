import { stripPublicContactLeaksFromVendorText } from "@/lib/catalog/catalog-card-title";

const DEFAULT_PUBLIC_VENDOR_DESCRIPTION =
  "Поставщик работает на рынке Дордой и предлагает оптовые товары в выбранной категории.";

function normalizeDescription(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeSentences(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return text;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const sentence of sentences) {
    const key = sentence.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sentence);
  }
  return out.join(" ").trim();
}

export function buildSafeVendorPublicDescription(opts: {
  cardDescription?: string | null;
  categoryLabel?: string | null;
}): string {
  const safeCardDescription = stripPublicContactLeaksFromVendorText(
    opts.cardDescription ?? "",
  );
  const normalizedCardDescription = dedupeSentences(
    normalizeDescription(safeCardDescription),
  );
  if (normalizedCardDescription) {
    return normalizedCardDescription;
  }

  const category = normalizeDescription(opts.categoryLabel ?? "");
  if (category) {
    return `Поставщик работает на рынке Дордой и предлагает оптовые товары в категории «${category}».`;
  }

  return DEFAULT_PUBLIC_VENDOR_DESCRIPTION;
}
