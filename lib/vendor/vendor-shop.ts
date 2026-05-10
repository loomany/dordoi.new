import "server-only";

import type { VendorModerationStatus } from "@/lib/vendor/status";
import { isVendorModerationStatus } from "@/lib/vendor/status";
import {
  fetchVendorRowForAuthenticatedUser,
  type VendorRowSelf,
} from "@/lib/vendor/vendor-session-access";
import { createClient } from "@/utils/supabase/server";

export type VendorShopSelf = {
  id: string;
  store_name: string | null;
  location_row: string | null;
  logo_url: string | null;
  description: string | null;
  categories: string[];
  product_photos: string[];
  container_photo_url: string | null;
  min_batch: string | null;
  payment_methods: string | null;
  delivery_help: boolean;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  samples_available: boolean;
  returns_policy: string | null;
  phone_number: string | null;
  status: VendorModerationStatus;
  language: string;
  created_at: string;
};

function mapRow(row: VendorRowSelf): Omit<VendorShopSelf, "status"> & {
  status: string;
} {
  return {
    id: row.id,
    store_name: row.store_name,
    location_row: row.location_row,
    logo_url: row.logo_url,
    description: row.description,
    categories: Array.isArray(row.categories) ? row.categories : [],
    product_photos: Array.isArray(row.product_photos) ? row.product_photos : [],
    container_photo_url: row.container_photo_url,
    min_batch: row.min_batch,
    payment_methods: row.payment_methods,
    delivery_help: Boolean(row.delivery_help),
    whatsapp_1: row.whatsapp_1,
    whatsapp_2: row.whatsapp_2,
    instagram_url: row.instagram_url,
    telegram_url: row.telegram_url,
    samples_available: Boolean(row.samples_available),
    returns_policy: row.returns_policy,
    phone_number: row.phone_number,
    language: row.language,
    created_at: row.created_at,
    status: row.status,
  };
}

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

  const mapped = mapRow(row);
  const raw = mapped.status;
  const status = isVendorModerationStatus(raw) ? raw : "pending_moderation";

  return {
    ...mapped,
    status,
  };
}
