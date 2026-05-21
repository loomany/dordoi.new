import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

const FILE_PATH = join(process.cwd(), "public", "llms-full.txt");

const PLAIN_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "public, max-age=3600",
} as const;

export async function GET() {
  try {
    const body = await readFile(FILE_PATH, "utf8");
    return new Response(body, { headers: PLAIN_HEADERS });
  } catch {
    return new Response("llms-full.txt not found on server.\n", {
      status: 404,
      headers: PLAIN_HEADERS,
    });
  }
}
