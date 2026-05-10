import "server-only";

import { linkVendorProfileForPhone } from "@/lib/auth/link-vendor-profile";
import { digitsOnly } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

/** Строка vendors для кабинета продавца (обход RLS после проверки JWT на сервере). */
export type VendorRowSelf = {
  id: string;
  user_id: string | null;
  store_name: string | null;
  location_row: string | null;
  logo_url: string | null;
  status: string;
  language: string;
  created_at: string;
  phone_number: string | null;
};

/**
 * Находит анкету продавца для уже аутентифицированного пользователя.
 * Использует admin-клиент только после того, как известен `userId` из сессии.
 *
 * Фильтр: user_id = сессия ИЛИ phone_number = телефон из profiles (цифры),
 * чтобы обойти расхождение формата телефона в auth.users vs vendors.phone_number при RLS.
 */
export async function fetchVendorRowForAuthenticatedUser(
  userId: string,
  knownProfilePhoneDigits?: string | null,
): Promise<VendorRowSelf | null> {
  const admin = createAdminClient();

  let phoneDigits: string | null = null;
  if (knownProfilePhoneDigits !== undefined) {
    phoneDigits = knownProfilePhoneDigits
      ? digitsOnly(String(knownProfilePhoneDigits))
      : null;
  } else {
    const { data: profile } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();
    phoneDigits = profile?.phone ? digitsOnly(String(profile.phone)) : null;
  }

  const orClause =
    phoneDigits && phoneDigits.length > 0
      ? `user_id.eq.${userId},phone_number.eq.${phoneDigits}`
      : `user_id.eq.${userId}`;

  const { data: row, error } = await admin
    .from("vendors")
    .select(
      "id, user_id, store_name, location_row, logo_url, status, language, created_at, phone_number",
    )
    .or(orClause)
    .maybeSingle();

  if (error || !row) {
    if (error) {
      console.error("[vendor-session-access] select", error);
    }
    return null;
  }

  const rowDigits = row.phone_number
    ? digitsOnly(String(row.phone_number))
    : "";
  const linkDigits = phoneDigits || rowDigits;
  if (linkDigits) {
    try {
      await linkVendorProfileForPhone(admin, userId, linkDigits);
    } catch (e) {
      console.error("[vendor-session-access] link", e);
    }
  }

  return row as VendorRowSelf;
}
