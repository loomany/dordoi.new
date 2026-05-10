import "server-only";

import type { VendorModerationStatus } from "@/lib/vendor/status";
import { isVendorModerationStatus } from "@/lib/vendor/status";
import { fetchVendorRowForAuthenticatedUser } from "@/lib/vendor/vendor-session-access";
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

  const row = await fetchVendorRowForAuthenticatedUser(user.id);
  if (!row) {
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
