import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

import { digitsOnly } from "@/lib/phone";

const PER_PAGE = 1000;

/**
 * Ищет пользователя в Supabase Auth по номеру (только цифры, как в `profiles.phone`).
 * Нужен, если в `auth.users` уже есть запись после неудачного шага профиля («сирота»).
 */
export async function findAuthUserByPhoneDigits(
  admin: SupabaseClient,
  phoneDigits: string,
): Promise<User | null> {
  let page: number | null = 1;
  while (page != null) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      console.error("[find-auth-user-by-phone] listUsers", error);
      return null;
    }
    const hit = data.users.find(
      (u) => digitsOnly(u.phone ?? "") === phoneDigits,
    );
    if (hit) return hit;
    page = data.nextPage;
  }
  return null;
}
