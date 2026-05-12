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
import {
  VENDOR_PENDING_QUEUE_STATUSES,
} from "@/lib/vendor/status";
import { normalizePhone } from "@/lib/phone";
import { routing } from "@/i18n/routing";
import {
  buildVendorSlug,
  buildVendorSlugWithIdSuffix,
} from "@/lib/catalog/vendor-slug";
import { notifyDordoiVendorModerationStatusChanged } from "@/lib/dordoi/analytics/leadNotifications";
import { notifyVendorApplicationApproved } from "@/lib/telegram/notify-vendor-approved";

export type ModerationActionState =
  | { ok: true }
  | { ok: false; message: string };

function revalidateCabinetAfterModeration(): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/cabinet/admin`, "page");
    revalidatePath(`/${locale}/cabinet/vendor`, "page");
    revalidatePath(`/${locale}/catalog`, "page");
  }
}

type VendorSlugRow = {
  id: string;
  slug: string | null;
  store_name: string | null;
};

/**
 * Гарантирует наличие SEO-slug у одобренного продавца.
 * Если slug уже есть — не меняем (стабильный URL для индексации).
 * Если занят базовый — добавляем короткий ID-суффикс. На повторные коллизии
 * возвращаем самый «детерминированный» fallback `store-{id8}`.
 */
async function ensureVendorSlug(
  admin: ReturnType<typeof createAdminClient>,
  vendor: VendorSlugRow,
): Promise<string | null> {
  if (vendor.slug && vendor.slug.trim().length > 0) {
    return vendor.slug.trim();
  }

  const candidates = [
    buildVendorSlug({ storeName: vendor.store_name, vendorId: vendor.id }),
    buildVendorSlugWithIdSuffix({
      storeName: vendor.store_name,
      vendorId: vendor.id,
    }),
    `store-${vendor.id.replace(/-/g, "").slice(0, 8)}`,
  ];

  for (const candidate of candidates) {
    const { data: clash, error: clashErr } = await admin
      .from("vendors")
      .select("id")
      .eq("slug", candidate)
      .neq("id", vendor.id)
      .limit(1);

    if (clashErr) {
      console.error("[ensureVendorSlug] clash check", clashErr);
      return null;
    }

    if (clash && clash.length > 0) {
      continue;
    }

    const { error: writeErr } = await admin
      .from("vendors")
      .update({ slug: candidate })
      .eq("id", vendor.id)
      .is("slug", null);

    if (writeErr) {
      console.error("[ensureVendorSlug] write", writeErr);
      return null;
    }

    return candidate;
  }

  return null;
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
    .in("status", [...VENDOR_PENDING_QUEUE_STATUSES])
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
    .select(
      "id, phone_number, telegram_chat_id, store_name, language, slug, application_source, categories",
    )
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
    const isGooglePlaces = vendor.application_source === "google_places";

    if (!isGooglePlaces) {
      // SEO-slug фиксируем при первом approve: стабильный URL во всех локалях.
      const finalSlug = await ensureVendorSlug(admin, {
        id: String(vendor.id),
        slug: typeof vendor.slug === "string" ? vendor.slug : null,
        store_name:
          typeof vendor.store_name === "string" ? vendor.store_name : null,
      });

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

      const chatId = vendor.telegram_chat_id;
      if (typeof chatId === "number" && Number.isFinite(chatId)) {
        void notifyVendorApplicationApproved({
          telegramChatId: chatId,
          storeName:
            typeof vendor.store_name === "string" ? vendor.store_name : null,
          language:
            typeof vendor.language === "string" ? vendor.language : null,
          slug: finalSlug,
        }).catch((e) =>
          console.error("[updateVendorStatus] telegram notify", e),
        );
      }
    }
    // google_places: без slug/профиля/Telegram — только смена статуса (ручная публикация позже).
  }

  void notifyDordoiVendorModerationStatusChanged({
    vendorId: String(vendor.id),
    status,
    storeTitle: typeof vendor.store_name === "string" ? vendor.store_name : null,
    categories: vendor.categories,
  }).catch((e) =>
    console.error("[updateVendorStatus] dordoi admin moderation notify", e),
  );

  revalidateCabinetAfterModeration();
  return { ok: true };
}
