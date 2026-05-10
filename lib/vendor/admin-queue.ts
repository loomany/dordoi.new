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
  "id, store_name, phone_number, status, language, location_row, description, description_detail, categories, logo_url, container_photo_url, product_photos, min_batch, payment_methods, delivery_help, samples_available, samples_note, returns_policy, whatsapp_1, whatsapp_2, instagram_url, telegram_url, created_at, telegram_chat_id";

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

export async function fetchVendorApplicationByIdForAdmin(
  id: string,
): Promise<VendorApplicationRecord | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select(VENDOR_APPLICATION_SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[fetchVendorApplicationByIdForAdmin]", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeVendorRows([data])[0] ?? null;
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
    const cats = r.categories;
    const desc = r.description;
    const descDetail = r.description_detail;
    return {
      ...r,
      description: typeof desc === "string" ? desc : null,
      description_detail:
        typeof descDetail === "string" ? descDetail : null,
      categories: Array.isArray(cats)
        ? (cats as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
      product_photos: Array.isArray(photos) ? (photos as string[]) : [],
      delivery_help: Boolean(r.delivery_help),
      samples_available: Boolean(r.samples_available),
    } as VendorApplicationRecord;
  });
}
