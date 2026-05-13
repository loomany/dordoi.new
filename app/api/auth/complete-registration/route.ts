import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { email, z } from "zod";

import { findAuthUserByPhoneDigits } from "@/lib/auth/find-auth-user-by-phone";
import { linkVendorProfileForPhone } from "@/lib/auth/link-vendor-profile";
import { randomPassword } from "@/lib/auth/password";
import { verifyRegistrationToken } from "@/lib/auth/registration-token";
import { notifyDordoiSiteRegistrationCompleted } from "@/lib/dordoi/analytics/leadNotifications";
import { assertValidPhoneDigits, toE164Digits } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler-client";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().max(320).optional(),
  tempToken: z.string().min(10),
});

function normalizeOptionalEmail(
  raw: string | undefined,
): string | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  if (t === "") return undefined;
  return t;
}

const SITE_REG_LOCALES = new Set(["ru", "kk", "kg", "uz", "tj"]);

function localeHintFromRequest(request: Request): string {
  const h = request.headers.get("accept-language");
  if (!h?.trim()) return "unknown";
  for (const part of h.split(",")) {
    const tag = part.trim().split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split("-")[0] ?? "";
    if (SITE_REG_LOCALES.has(base)) return base;
  }
  return "unknown";
}

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

    const emailNorm = normalizeOptionalEmail(parsed.data.email);
    if (emailNorm !== undefined) {
      const emailCheck = email().safeParse(emailNorm);
      if (!emailCheck.success) {
        return NextResponse.json(
          { error: "Некорректный email", code: "INVALID_EMAIL" },
          { status: 400 },
        );
      }
    }

    let phoneDigits: string;
    try {
      const { phone } = await verifyRegistrationToken(parsed.data.tempToken);
      phoneDigits = phone;
      assertValidPhoneDigits(phoneDigits);
    } catch {
      return NextResponse.json(
        {
          error: "Сессия регистрации недействительна или истекла",
          code: "INVALID_REGISTRATION_TOKEN",
        },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phoneDigits)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json(
        { error: "Аккаунт с этим номером уже существует", code: "PHONE_TAKEN" },
        { status: 409 },
      );
    }

    const password = randomPassword();
    const name = parsed.data.name.trim();

    /** Уже есть в Auth, но строки в `profiles` нет — повторный createUser падает. */
    let authUser: User | null =
      await findAuthUserByPhoneDigits(admin, phoneDigits);

    let createdNewAuthUser = false;

    if (!authUser) {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          phone: toE164Digits(phoneDigits),
          phone_confirm: true,
          email: emailNorm,
          password,
          user_metadata: { full_name: name },
        });

      if (created?.user) {
        authUser = created.user;
        createdNewAuthUser = true;
      } else {
        console.error("[complete-registration] createUser", createError);
        authUser = await findAuthUserByPhoneDigits(admin, phoneDigits);
        if (!authUser) {
          return NextResponse.json(
            { error: "Не удалось создать аккаунт", code: "CREATE_USER_FAILED" },
            { status: 500 },
          );
        }
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Не удалось создать аккаунт", code: "CREATE_USER_FAILED" },
        { status: 500 },
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      authUser.id,
      {
        password,
        user_metadata: { full_name: name },
        phone_confirm: true,
        ...(emailNorm !== undefined
          ? { email: emailNorm, email_confirm: true }
          : {}),
      },
    );

    if (updateError) {
      console.error("[complete-registration] updateUser", updateError);
      return NextResponse.json(
        { error: "Не удалось обновить аккаунт", code: "AUTH_UPDATE_FAILED" },
        { status: 500 },
      );
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: authUser.id,
        phone: phoneDigits,
        name,
        email: emailNorm ?? null,
        role: "buyer",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("[complete-registration] upsert profile", profileError);
      if (createdNewAuthUser) {
        await admin.auth.admin.deleteUser(authUser.id);
      }
      if (profileError.code === "23505") {
        return NextResponse.json(
          {
            error: "Такой email уже используется",
            code: "EMAIL_CONFLICT",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Не удалось завершить регистрацию", code: "PROFILE_INSERT_FAILED" },
        { status: 500 },
      );
    }

    let registrationRole: "buyer" | "vendor" = "buyer";
    try {
      const lr = await linkVendorProfileForPhone(admin, authUser.id, phoneDigits);
      if (lr.linked) {
        registrationRole = "vendor";
      }
    } catch (e) {
      console.error("[complete-registration] link vendor", e);
    }

    const { supabase, applyAuthCookiesTo } = await createRouteHandlerSupabase();

    const phoneAuth = await supabase.auth.signInWithPassword({
      phone: toE164Digits(phoneDigits),
      password,
    });

    let session =
      phoneAuth.error === null ? phoneAuth.data.session : null;

    if (!session && emailNorm !== undefined) {
      const emailAuth = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password,
      });
      session = emailAuth.error === null ? emailAuth.data.session : null;
      if (!session) {
        console.error(
          "[complete-registration] signIn phone",
          phoneAuth.error,
          "email",
          emailAuth.error,
        );
      }
    } else if (!session) {
      console.error("[complete-registration] signIn", phoneAuth.error);
    }

    if (!session) {
      return NextResponse.json(
        { error: "Аккаунт создан, но вход не выполнен", code: "SIGN_IN_FAILED" },
        { status: 500 },
      );
    }

    void notifyDordoiSiteRegistrationCompleted({
      userId: authUser.id,
      email: emailNorm ?? null,
      phoneDigits,
      role: registrationRole,
      localeLabel: localeHintFromRequest(request),
    }).catch((e) =>
      console.error("[complete-registration] dordoi admin registration notify", e),
    );

    const response = NextResponse.json({
      success: true,
      token: session.access_token,
    });
    applyAuthCookiesTo(response);
    return response;
  } catch (e) {
    console.error("[complete-registration]", e);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
