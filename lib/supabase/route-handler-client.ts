import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Клиент Supabase для Route Handlers: читает куки запроса и **буферизует** записи.
 * После `signIn*` вызовите {@link applyAuthCookiesTo} на том же {@link NextResponse},
 * который возвращаете из handler — иначе в App Router `Set-Cookie` часто не попадает
 * в ответ `fetch`, и сессия в браузере не создаётся (вход «не куда идти»).
 */
export async function createRouteHandlerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  const cookieStore = await cookies();
  const pending: PendingCookie[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          pending.push({ name, value, options }),
        );
      },
    },
  });

  function applyAuthCookiesTo(response: NextResponse) {
    pending.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
  }

  return { supabase, applyAuthCookiesTo };
}
