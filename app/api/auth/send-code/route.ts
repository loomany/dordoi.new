import { NextResponse } from "next/server";
import { z } from "zod";

import { sendWhatsAppTextMessage } from "@/lib/green-api";
import {
  assertValidPhoneDigits,
  normalizePhone,
  PhoneValidationError,
} from "@/lib/phone";
import { generateOtp4 } from "@/lib/auth/password";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  phone: z.string().min(1),
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

    const admin = createAdminClient();
    const code = generateOtp4();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: upsertError } = await admin.from("otp_codes").upsert(
      { phone: digits, code, expires_at },
      { onConflict: "phone" },
    );

    if (upsertError) {
      console.error("[send-code] otp upsert", upsertError);
      return NextResponse.json(
        { error: "Не удалось сохранить код", code: "OTP_STORE_FAILED" },
        { status: 500 },
      );
    }

    let sendResult;
    try {
      sendResult = await sendWhatsAppTextMessage(
        digits,
        `Ваш код авторизации: ${code}`,
      );
    } catch (e) {
      if ((e as Error).message === "GREEN_API_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error: "Отправка сообщений не настроена на сервере",
            code: "GREEN_API_NOT_CONFIGURED",
          },
          { status: 503 },
        );
      }
      throw e;
    }

    if (!sendResult.ok) {
      console.error(
        "[send-code] Green API",
        sendResult.status,
        sendResult.body.slice(0, 500),
      );
      return NextResponse.json(
        {
          error: "Не удалось отправить сообщение в WhatsApp",
          code: "GREEN_API_SEND_FAILED",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof PhoneValidationError) {
      return NextResponse.json(
        { error: "Неверный формат номера телефона", code: e.code },
        { status: 400 },
      );
    }
    console.error("[send-code]", e);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
