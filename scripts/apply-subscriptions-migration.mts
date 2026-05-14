/**
 * One-time: create public.subscriptions (Lemon Squeezy webhooks).
 *   npx tsx scripts/apply-subscriptions-migration.mts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Set DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = readFileSync(
  join("supabase/migrations/20260514140000_subscriptions.sql"),
  "utf8",
);

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
try {
  await client.query(sql);
  console.log("subscriptions migration applied");
} finally {
  await client.end();
}
