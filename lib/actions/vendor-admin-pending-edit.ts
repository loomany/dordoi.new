"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/assert-admin";
import { routing } from "@/i18n/routing";
import { parseVendorProfileFormData } from "@/lib/vendor/vendor-profile-form-parse";
import { isVendorPendingQueueStatus } from "@/lib/vendor/status";
import { createAdminClient } from "@/lib/supabase/admin";

export type VendorAdminPendingEditActionState =
  | { ok: true }
  | { ok: false; message: string };

export async function updatePendingVendorProfileAsAdminAction(
  _prev: VendorAdminPendingEditActionState | null,
  formData: FormData,
): Promise<VendorAdminPendingEditActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Недостаточно прав для сохранения." };
  }

  const vendorIdRaw = String(formData.get("vendor_id") ?? "").trim();
  const idParsed = z.string().uuid().safeParse(vendorIdRaw);
  if (!idParsed.success) {
    return { ok: false, message: "Некорректный идентификатор заявки." };
  }
  const vendorId = idParsed.data;

  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("vendors")
    .select("id, status")
    .eq("id", vendorId)
    .maybeSingle();

  if (fetchErr || !row) {
    console.error("[updatePendingVendorProfileAsAdminAction] fetch", fetchErr);
    return { ok: false, message: "Заявка не найдена." };
  }

  if (!isVendorPendingQueueStatus(String(row.status))) {
    return {
      ok: false,
      message: "Редактировать можно только заявку со статусом «на модерации» или «на проверке».",
    };
  }

  const parsed = parseVendorProfileFormData(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const { error: updErr } = await admin.from("vendors").update(parsed.patch).eq("id", vendorId);

  if (updErr) {
    console.error("[updatePendingVendorProfileAsAdminAction]", updErr);
    return {
      ok: false,
      message: "Не удалось сохранить в базу. Попробуйте ещё раз или проверьте логи.",
    };
  }

  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/cabinet/admin`, "page");
    revalidatePath(`/${loc}/cabinet/admin/vendor/${vendorId}/edit`, "page");
    revalidatePath(`/${loc}/cabinet/vendor`, "page");
    revalidatePath(`/${loc}/catalog`, "layout");
  }

  redirect(`/${parsed.locale}/cabinet/admin?updated=1`);
}
