export function catalogPhotoAlt(
  altBase: string,
  zeroBasedIndex: number,
  slideCount: number,
): string {
  const normalizedBase = altBase.replace(/\s+/g, " ").trim() || "Dordoi.help";
  const current = Math.max(1, zeroBasedIndex + 1);
  const total = Math.max(current, slideCount);
  return `${normalizedBase} — ${current} / ${total}`;
}
