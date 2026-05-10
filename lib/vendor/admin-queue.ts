import "server-only";

import { requireAdmin } from "@/lib/auth/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { VENDOR_PENDING_STATUS } from "@/lib/vendor/status";

export type { VendorApplicationRecord };

/** @deprecated Используйте VendorApplicationRecord */
export type AdminVendorRow = VendorApplicationRecord;

/** Единый список полей для карточки модерации и списков. */
export const VENDOR_APPLICATION_SELECT_FIELDS =
  "id, store_name, phone_number, status, language, location_row, logo_url, container_photo_url, product_photos, min_batch, payment_methods, delivery_help, returns_policy, whatsapp_1, whatsapp_2, instagram_url, telegram_url, created_at, telegram_chat_id";

export async function fetchVendorsForModeration(opts: {
  filter: "pending" | "all";
}): Promise<VendorApplicationRecord[]> {
  await requireAdmin();
  const admin = createAdminClient();
  let q = admin
    .from("vendors")
    .select(VENDOR_APPLICATION_SELECT_FIELDS)
    .order("created_at", { ascending: false });

  if (opts.filter === "pending") {
    q = q.eq("status", VENDOR_PENDING_STATUS);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[fetchVendorsForModeration]", error);
    return [];
  }

  return normalizeVendorRows(data);
}

export function normalizeVendorRows(
  data: unknown,
): VendorApplicationRecord[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const photos = r.product_photos;
    return {
      ...r,
      product_photos: Array.isArray(photos) ? (photos as string[]) : [],
      delivery_help: Boolean(r.delivery_help),
    } as VendorApplicationRecord;
  });
}
