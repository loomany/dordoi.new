import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-static";

const BODY = readFileSync(
  join(/* turbopackIgnore: true */ process.cwd(), "public", "llms.txt"),
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
