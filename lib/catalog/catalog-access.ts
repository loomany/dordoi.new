import "server-only";

import type { SessionProfile } from "@/lib/auth/session-profile";
import { checkSubscriptionStatus } from "@/lib/subscription/check-subscription";

/** Полный каталог — только активная подписка (админы без ограничений). */
export async function hasFullCatalogAccess(
  profile: SessionProfile | null | undefined,
): Promise<boolean> {
  if (!profile?.userId) {
    return false;
  }
  if (profile.role === "admin") {
    return true;
  }
  return checkSubscriptionStatus(profile.userId);
}
