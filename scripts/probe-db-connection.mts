import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const direct = process.env.DATABASE_URL?.trim();
const ref = "hcwjefvsoyzlqmgbpzjj";
const passMatch = direct?.match(/postgres:([^@]+)@/);
const pass = passMatch ? decodeURIComponent(passMatch[1]) : "";

const { default: pg } = await import("pg");

async function tryUrl(label: string, url: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
  });
  try {
    await client.connect();
    const r = await client.query("select 1 as ok");
    console.log(label, "OK", r.rows[0]);
    await client.end();
    return true;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.log(label, "FAIL", err.code ?? err.message);
    try {
      await client.end();
    } catch {
      /* noop */
    }
    return false;
  }
}

const candidates: [string, string][] = [];
if (direct) candidates.push(["direct", direct]);
if (pass) {
  for (const region of [
    "eu-central-1",
    "us-east-1",
    "ap-southeast-1",
    "eu-west-1",
  ]) {
    candidates.push([
      `pooler-${region}-5432`,
      `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    ]);
    candidates.push([
      `pooler-${region}-6543`,
      `postgresql://postgres.${ref}:${encodeURIComponent(pass)}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    ]);
  }
}

for (const [label, url] of candidates) {
  if (await tryUrl(label, url)) break;
}
