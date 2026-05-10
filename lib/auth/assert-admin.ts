import "server-only";

import { createClient } from "@/utils/supabase/server";

/** Бросает Error с кодом при отсутствии сессии или роли admin. */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    const e = new Error("UNAUTHORIZED");
    (e as Error & { code: string }).code = "UNAUTHORIZED";
    throw e;
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr || profile?.role !== "admin") {
    const e = new Error("FORBIDDEN");
    (e as Error & { code: string }).code = "FORBIDDEN";
    throw e;
  }

  return { userId: user.id };
}
