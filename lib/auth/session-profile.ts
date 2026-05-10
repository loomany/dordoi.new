import "server-only";

import type { AppRole } from "@/lib/auth/roles";
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

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    phone: profile.phone ?? null,
    name: profile.name ?? null,
    role,
    vendorId: vendor?.id ?? null,
  };
}

/** Куда вести после /cabinet (корень кабинета). */
export function cabinetHomePath(locale: string, p: SessionProfile): string {
  if (p.role === "admin") {
    return `/${locale}/cabinet/admin`;
  }
  if (p.role === "vendor" || p.vendorId) {
    return `/${locale}/cabinet/vendor`;
  }
  return `/${locale}/cabinet/buyer`;
}
