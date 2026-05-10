import "server-only";

import { createClient } from "@/utils/supabase/server";

export async function fetchBuyerFavoriteKeySet(
  userId: string,
): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buyer_catalog_favorites")
    .select("listing_key")
    .eq("user_id", userId);

  if (error || !data) {
    return new Set();
  }
  return new Set(data.map((r) => r.listing_key as string));
}

export async function fetchBuyerFavoriteKeysOrdered(
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buyer_catalog_favorites")
    .select("listing_key")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return data.map((r) => r.listing_key as string);
}
