import "server-only";

import { linkVendorProfileForPhone } from "@/lib/auth/link-vendor-profile";
import { digitsOnly } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VendorModerationStatus } from "@/lib/vendor/status";
import { isVendorModerationStatus } from "@/lib/vendor/status";
import { createClient } from "@/utils/supabase/server";

export type VendorShopSelf = {
  id: string;
  store_name: string | null;
  location_row: string | null;
  logo_url: string | null;
  status: VendorModerationStatus;
  language: string;
  created_at: string;
};

export async function getVendorShopForSession(): Promise<VendorShopSelf | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const selectMine = () =>
    supabase
      .from("vendors")
      .select(
        "id, store_name, location_row, logo_url, status, language, created_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

  let { data: row, error } = await selectMine();

  if (!row) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();
      const phoneDigits = profile?.phone
        ? digitsOnly(String(profile.phone))
        : "";
      if (phoneDigits) {
        await linkVendorProfileForPhone(admin, user.id, phoneDigits);
      }
    } catch (e) {
      console.error("[vendor-shop] ensure vendor link by phone", e);
    }
    ({ data: row, error } = await selectMine());
  }

  if (error || !row) {
    return null;
  }

  const raw = row.status as string;
  const status = isVendorModerationStatus(raw) ? raw : "pending_moderation";

  return {
    id: row.id,
    store_name: row.store_name,
    location_row: row.location_row,
    logo_url: row.logo_url,
    status,
    language: row.language,
    created_at: row.created_at,
  };
}
