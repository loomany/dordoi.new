import { NextResponse } from "next/server";
import { z } from "zod";

import { linkVendorProfileForPhone } from "@/lib/auth/link-vendor-profile";
import { otpCodesEqual } from "@/lib/auth/otp-compare";
import { randomPassword } from "@/lib/auth/password";
import { signRegistrationToken } from "@/lib/auth/registration-token";
import {
  assertValidPhoneDigits,
  normalizePhone,
  PhoneValidationError,
  toE164Digits,
} from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler-client";

const bodySchema = z.object({
  phone: z.string().min(1),
  code: z.string().regex(/^\d{4}$/),
});

export async function POST(request: Request) {
  try {
    const jsonBody = await request.json();
    const parsed = bodySchema.safeParse(jsonBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректное тело запроса", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const digits = normalizePhone(parsed.data.phone);
    assertValidPhoneDigits(digits);
    const { code } = parsed.data;

    const admin = createAdminClient();

    const { data: row, error: fetchOtpError } = await admin
      .from("otp_codes")
      .select("code, expires_at")
      .eq("phone", digits)
      .maybeSingle();

    if (fetchOtpError) {
      console.error("[verify-code] otp fetch", fetchOtpError);
      return NextResponse.json(
        { error: "Не удалось проверить код", code: "OTP_FETCH_FAILED" },
        { status: 500 },
      );
    }

    if (!row) {
      return NextResponse.json(
        { error: "Код не найден. Запросите новый.", code: "CODE_NOT_FOUND" },
        { status: 401 },
      );
    }

    const expiresAt = new Date(row.expires_at).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      await admin.from("otp_codes").delete().eq("phone", digits);
      return NextResponse.json(
        { error: "Срок действия кода истёк", code: "CODE_EXPIRED" },
        { status: 410 },
      );
    }

    if (!otpCodesEqual(row.code, code)) {
      return NextResponse.json(
        { error: "Неверный код", code: "INVALID_CODE" },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", digits)
      .maybeSingle();

    if (profileError) {
      console.error("[verify-code] profile", profileError);
      return NextResponse.json(
        { error: "Не удалось проверить профиль", code: "PROFILE_LOOKUP_FAILED" },
        { status: 500 },
      );
    }

    if (profile?.id) {
      const password = randomPassword();
      const { error: pwError } = await admin.auth.admin.updateUserById(
        profile.id,
        { password },
      );

      if (pwError) {
        console.error("[verify-code] update password", pwError);
        return NextResponse.json(
          { error: "Не удалось выполнить вход", code: "AUTH_UPDATE_FAILED" },
          { status: 500 },
        );
      }

      const { supabase, applyAuthCookiesTo } =
        await createRouteHandlerSupabase();

      const phoneAuth = await supabase.auth.signInWithPassword({
        phone: toE164Digits(digits),
        password,
      });

      let session =
        phoneAuth.error === null ? phoneAuth.data.session : null;

      /** У аккаунта могут быть и телефон, и email; вход по телефону иногда не создаёт сессию — пробуем email из Auth. */
      if (!session) {
        const { data: authUserData } = await admin.auth.admin.getUserById(
          profile.id,
        );
        const emailFromAuth = authUserData.user?.email?.trim();
        if (emailFromAuth) {
          const emailAuth = await supabase.auth.signInWithPassword({
            email: emailFromAuth,
            password,
          });
          session =
            emailAuth.error === null ? emailAuth.data.session : null;
          if (!session) {
            console.error(
              "[verify-code] signIn phone",
              phoneAuth.error,
              "email",
              emailAuth.error,
            );
          }
        } else {
          console.error("[verify-code] signIn", phoneAuth.error);
        }
      }

      if (!session) {
        return NextResponse.json(
          { error: "Не удалось создать сессию", code: "SIGN_IN_FAILED" },
          { status: 500 },
        );
      }

      await admin.from("otp_codes").delete().eq("phone", digits);

      try {
        await linkVendorProfileForPhone(admin, profile.id, digits);
      } catch (e) {
        console.error("[verify-code] link vendor", e);
      }

      const response = NextResponse.json({
        success: true,
        isNewUser: false,
        token: session.access_token,
      });
      applyAuthCookiesTo(response);
      return response;
    }

    try {
      const tempToken = await signRegistrationToken(digits);
      await admin.from("otp_codes").delete().eq("phone", digits);
      return NextResponse.json({
        success: true,
        isNewUser: true,
        tempToken,
      });
    } catch (e) {
      if ((e as Error).message === "AUTH_REGISTRATION_SECRET_MISSING") {
        return NextResponse.json(
          {
            error: "Регистрация не настроена на сервере",
            code: "REGISTRATION_SECRET_MISSING",
          },
          { status: 503 },
        );
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof PhoneValidationError) {
      return NextResponse.json(
        { error: "Неверный формат номера телефона", code: e.code },
        { status: 400 },
      );
    }
    console.error("[verify-code]", e);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
