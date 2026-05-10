import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/auth/roles";
import { digitsOnly } from "@/lib/phone";

/**
 * После входа по OTP: найти анкету из Telegram-бота по совпадению телефона (только цифры)
 * и проставить vendors.user_id + profiles.role = vendor.
 */
export async function linkVendorProfileForPhone(
  admin: SupabaseClient,
  userId: string,
  phoneDigits: string,
): Promise<{ linked: boolean; vendorId?: string }> {
  const { data: candidates, error } = await admin
    .from("vendors")
    .select("id, phone_number, user_id")
    .is("user_id", null);

  if (error) {
    console.error("[link-vendor]", error);
    return { linked: false };
  }

  const row = (candidates ?? []).find(
    (v) => digitsOnly(String(v.phone_number ?? "")) === phoneDigits,
  );

  if (!row?.id) {
    return { linked: false };
  }

  const { error: upErr } = await admin
    .from("vendors")
    .update({ user_id: userId })
    .eq("id", row.id)
    .is("user_id", null);

  if (upErr) {
    console.error("[link-vendor] update", upErr);
    return { linked: false };
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const current = (prof?.role as AppRole | undefined) ?? "buyer";
  if (current !== "admin") {
    await admin.from("profiles").update({ role: "vendor" }).eq("id", userId).neq(
      "role",
      "admin",
    );
  }

  return { linked: true, vendorId: row.id };
}
