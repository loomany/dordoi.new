import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import { randomPassword } from "@/lib/auth/password";
import { resolveLoginEmail } from "@/lib/auth/phone-login-email";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler-client";

export type EstablishedSession = {
  session: Session;
  applyAuthCookiesTo: (response: NextResponse) => void;
};

/**
 * Синхронизирует login-email, ротирует пароль, входит через signInWithPassword({ email }).
 * Работает без Phone provider в Supabase.
 */
export async function createSessionViaEmailLogin(
  admin: SupabaseClient,
  signInClient: SupabaseClient,
  userId: string,
  phoneDigits: string,
  opts?: { profileEmail?: string | null },
): Promise<Session | null> {
  const { data: authRow, error: getUserError } =
    await admin.auth.admin.getUserById(userId);

  if (getUserError || !authRow.user) {
    console.error("[establishSession] getUserById", getUserError);
    return null;
  }

  const authUser = authRow.user;
  const loginEmail = resolveLoginEmail(
    phoneDigits,
    authUser.email,
    opts?.profileEmail,
  );

  if (authUser.email?.trim() !== loginEmail) {
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, {
      email: loginEmail,
      email_confirm: true,
    });
    if (emailError) {
      console.error("[establishSession] sync login email", emailError);
      return null;
    }
  }

  const password = randomPassword();
  const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
    password,
  });
  if (pwError) {
    console.error("[establishSession] update password", pwError);
    return null;
  }

  const { data, error } = await signInClient.auth.signInWithPassword({
    email: loginEmail,
    password,
  });

  if (error || !data.session) {
    console.error("[establishSession] signInWithPassword", error);
    return null;
  }

  return data.session;
}

/**
 * Создаёт Supabase-сессию после кастомного OTP и буферизует auth-куки для Route Handler.
 */
export async function establishSessionAfterOtp(
  admin: SupabaseClient,
  userId: string,
  phoneDigits: string,
  opts?: { profileEmail?: string | null },
): Promise<EstablishedSession | null> {
  const { supabase, applyAuthCookiesTo } = await createRouteHandlerSupabase();

  const session = await createSessionViaEmailLogin(
    admin,
    supabase,
    userId,
    phoneDigits,
    opts,
  );
  if (!session) return null;

  return { session, applyAuthCookiesTo };
}
