import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function migrationSql(): string {
  return readFileSync(
    join(process.cwd(), "supabase/migrations/20260514140000_subscriptions.sql"),
    "utf8",
  );
}

function authorize(request: NextRequest): boolean {
  const secret =
    process.env.ADMIN_BOOTSTRAP_SECRET?.trim() ||
    process.env.AUTH_REGISTRATION_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-bootstrap-secret")?.trim();
  return header === secret;
}

/** One-time DDL: `subscriptions` table (needs DATABASE_URL on the server). */
export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL?.trim() ?? process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    return NextResponse.json(
      {
        error: "missing_database_url",
        hint: "Set DATABASE_URL on the host or run migration SQL in Supabase SQL editor.",
        sql: migrationSql(),
      },
      { status: 503 },
    );
  }

  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();
    try {
      await client.query(migrationSql());
    } finally {
      await client.end();
    }
    return NextResponse.json({ ok: true, message: "subscriptions migration applied" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "migration_failed", message }, { status: 500 });
  }
}
