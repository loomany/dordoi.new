import { NextResponse } from "next/server";
import { z } from "zod";

import { establishSessionAfterOtp } from "@/lib/auth/establish-session";
import { linkVendorProfileForPhone } from "@/lib/auth/link-vendor-profile";
import { otpCodesEqual } from "@/lib/auth/otp-compare";
import { signRegistrationToken } from "@/lib/auth/registration-token";
import {
  assertValidPhoneDigits,
  normalizePhone,
  PhoneValidationError,
} from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("id, name, email")
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
      const sessionResult = await establishSessionAfterOtp(
        admin,
        profile.id,
        digits,
        { profileEmail: profile.email },
      );

      if (!sessionResult) {
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
        token: sessionResult.session.access_token,
        name: profile.name ?? null,
      });
      sessionResult.applyAuthCookiesTo(response);
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
