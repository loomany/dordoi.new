import fs from "node:fs";
import path from "node:path";

let cachedLogoDataUrl: string | null = null;

/** Inline brand logo for OG / Twitter ImageResponse. */
export function brandLogoDataUrl(): string {
  if (!cachedLogoDataUrl) {
    const filePath = path.join(process.cwd(), "public/brand/logo-192.png");
    const buf = fs.readFileSync(filePath);
    cachedLogoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return cachedLogoDataUrl;
}
