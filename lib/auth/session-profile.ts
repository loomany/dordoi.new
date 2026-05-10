import "server-only";

import { cabinetPathForProfile } from "@/lib/auth/cabinet-routing";
import type { AppRole } from "@/lib/auth/roles";
import { fetchVendorRowForAuthenticatedUser } from "@/lib/vendor/vendor-session-access";
import { createClient } from "@/utils/supabase/server";

export type SessionProfile = {
  userId: string;
  phone: string | null;
  name: string | null;
  role: AppRole;
  vendorId: string | null;
};

/**
 * Текущий пользователь + профиль + привязка к vendors (если есть).
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("phone, name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr || !profile) {
    return null;
  }

  const role = (profile.role as AppRole) ?? "buyer";

  const vendorRow = await fetchVendorRowForAuthenticatedUser(
    user.id,
    profile.phone ?? null,
  );

  return {
    userId: user.id,
    phone: profile.phone ?? null,
    name: profile.name ?? null,
    role,
    vendorId: vendorRow?.id ?? null,
  };
}

/** Куда вести после /cabinet (корень кабинета). */
export function cabinetHomePath(locale: string, p: SessionProfile): string {
  return cabinetPathForProfile(locale, {
    role: p.role,
    vendorId: p.vendorId,
  });
}
