import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-static";

/** Loaded at build/start from repo public/ — avoids runtime 404 when async read fails on Railway. */
const BODY = readFileSync(
  join(/* turbopackIgnore: true */ process.cwd(), "public", "llms-full.txt"),
  "utf8",
);

const PLAIN_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, max-age=3600",
} as const;

function plainResponse() {
  return new Response(BODY, { headers: PLAIN_HEADERS });
}

export function GET() {
  return plainResponse();
}

export function HEAD() {
  return plainResponse();
}
