"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";

import { requireAdmin } from "@/lib/auth/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeVendorRows,
  VENDOR_APPLICATION_SELECT_FIELDS,
} from "@/lib/vendor/admin-queue";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { VENDOR_PENDING_STATUS } from "@/lib/vendor/status";
import { normalizePhone } from "@/lib/phone";
import { routing } from "@/i18n/routing";

export type ModerationActionState =
  | { ok: true }
  | { ok: false; message: string };

function revalidateCabinetAfterModeration(): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/cabinet/admin`, "page");
    revalidatePath(`/${locale}/cabinet/vendor`, "page");
  }
}

/**
 * Все заявки продавцов со статусом «на модерации».
 * Доступ только при profiles.role === 'admin'.
 */
export async function getPendingVendors(): Promise<VendorApplicationRecord[]> {
  try {
    await requireAdmin();
  } catch {
    unauthorized();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendors")
    .select(VENDOR_APPLICATION_SELECT_FIELDS)
    .eq("status", VENDOR_PENDING_STATUS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPendingVendors]", error);
    return [];
  }

  return normalizeVendorRows(data);
}

/**
 * Смена статуса заявки. Только admin.
 * При approved: profiles.role = 'vendor' для строки с тем же телефоном (digits), что и vendors.phone_number.
 */
export async function updateVendorStatus(
  vendorId: string,
  status: "approved" | "rejected",
): Promise<ModerationActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Нет доступа" };
  }

  const admin = createAdminClient();

  const { data: vendor, error: fetchErr } = await admin
    .from("vendors")
    .select("id, phone_number")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr || !vendor) {
    console.error("[updateVendorStatus] fetch vendor", fetchErr);
    return { ok: false, message: "Заявка не найдена" };
  }

  const { error: updErr } = await admin
    .from("vendors")
    .update({ status })
    .eq("id", vendorId);

  if (updErr) {
    console.error("[updateVendorStatus] update vendor", updErr);
    return { ok: false, message: "Не удалось обновить статус" };
  }

  if (status === "approved") {
    const phoneDigits = normalizePhone(String(vendor.phone_number ?? ""));
    if (phoneDigits.length >= 8) {
      const { error: profileErr } = await admin
        .from("profiles")
        .update({ role: "vendor" })
        .eq("phone", phoneDigits)
        .neq("role", "admin");

      if (profileErr) {
        console.error("[updateVendorStatus] profile role", profileErr);
        /* статус в vendors уже approved; профиль можно поправить вручную */
      }
    }
  }

  revalidateCabinetAfterModeration();
  return { ok: true };
}
