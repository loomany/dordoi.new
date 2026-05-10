"use server";

import { revalidatePath } from "next/cache";
import { unauthorized } from "next/navigation";

import { requireAdmin } from "@/lib/auth/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import {
  notifyVendorPhotoBatchApproved,
  notifyVendorPhotoBatchRejected,
} from "@/lib/telegram/notify-photo-batch";
import type {
  PhotoBatchActionState,
  PhotoBatchModerationItem,
} from "@/lib/actions/vendor-photo-batch-types";

const PHOTO_BATCH_SELECT =
  "id, vendor_id, status, created_at, vendor_photo_batch_items(photo_url, position), vendors!inner(id, store_name, slug, language, telegram_chat_id)";

function revalidateAllAfterPhotoBatch(slug: string | null): void {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/cabinet/admin`, "page");
    revalidatePath(`/${locale}/catalog`, "page");
    if (slug) {
      revalidatePath(`/${locale}/catalog/${slug}`, "page");
    }
  }
}

function normalizeItem(row: unknown): PhotoBatchModerationItem | null {
  const r = row as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const vendorId = typeof r.vendor_id === "string" ? r.vendor_id : "";
  if (!id || !vendorId) return null;

  const status =
    r.status === "approved" || r.status === "rejected" ? r.status : "pending_moderation";

  const itemsRaw = Array.isArray(r.vendor_photo_batch_items)
    ? (r.vendor_photo_batch_items as unknown[])
    : [];
  const photos = itemsRaw
    .map((it) => {
      const item = it as Record<string, unknown>;
      const url = typeof item.photo_url === "string" ? item.photo_url : "";
      const pos =
        typeof item.position === "number" && Number.isFinite(item.position)
          ? item.position
          : 0;
      return url ? { url, position: pos } : null;
    })
    .filter((x): x is { url: string; position: number } => x !== null)
    .sort((a, b) => a.position - b.position);

  const vRaw =
    typeof r.vendors === "object" && r.vendors !== null
      ? (r.vendors as Record<string, unknown>)
      : {};
  const vendorTitle =
    (typeof vRaw.store_name === "string" && vRaw.store_name.trim()) ||
    "Магазин";
  const vendorSlug = typeof vRaw.slug === "string" ? vRaw.slug : null;
  const vendorLanguage =
    typeof vRaw.language === "string" ? vRaw.language : null;
  const vendorTelegramChatId =
    typeof vRaw.telegram_chat_id === "number" ? vRaw.telegram_chat_id : null;

  return {
    batchId: id,
    vendorId,
    vendorTitle,
    vendorSlug,
    vendorLanguage,
    vendorTelegramChatId,
    createdAt:
      typeof r.created_at === "string"
        ? r.created_at
        : new Date().toISOString(),
    status,
    photos,
  };
}

/** Все партии фото со статусом pending_moderation для админской ленты. */
export async function getPendingPhotoBatches(): Promise<
  PhotoBatchModerationItem[]
> {
  try {
    await requireAdmin();
  } catch {
    unauthorized();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vendor_photo_batches")
    .select(PHOTO_BATCH_SELECT)
    .eq("status", "pending_moderation")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getPendingPhotoBatches]", error);
    return [];
  }

  return (Array.isArray(data) ? data : [])
    .map(normalizeItem)
    .filter((x): x is PhotoBatchModerationItem => x !== null);
}

/**
 * Одобрить партию фото:
 *  - status = approved, approved_at = now()
 *  - синхронизировать `vendors.product_photos` (preview-cache карточки каталога)
 *    последними 15 фото свежей партии
 *  - продлить «таймер активности»: vendors.last_photo_reminder_at = null,
 *    чтобы шедулер 48ч пересчитал from latest activity
 *  - уведомить продавца в Telegram
 */
export async function approveVendorPhotoBatch(
  batchId: string,
): Promise<PhotoBatchActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Нет доступа" };
  }

  const admin = createAdminClient();

  const { data: batch, error: fetchErr } = await admin
    .from("vendor_photo_batches")
    .select(PHOTO_BATCH_SELECT)
    .eq("id", batchId)
    .maybeSingle();

  if (fetchErr || !batch) {
    return { ok: false, message: "Партия не найдена" };
  }

  const item = normalizeItem(batch);
  if (!item) {
    return { ok: false, message: "Не удалось разобрать партию" };
  }

  const { error: updErr } = await admin
    .from("vendor_photo_batches")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", batchId);

  if (updErr) {
    console.error("[approveVendorPhotoBatch] update", updErr);
    return { ok: false, message: "Не удалось одобрить" };
  }

  // preview-cache карточки каталога: vendors.product_photos = эта партия
  const photoUrls = item.photos.map((p) => p.url).slice(0, 15);
  if (photoUrls.length > 0) {
    const { error: cacheErr } = await admin
      .from("vendors")
      .update({
        product_photos: photoUrls,
        last_photo_reminder_at: null, // сбросим таймер напоминаний
      })
      .eq("id", item.vendorId);
    if (cacheErr) {
      console.error("[approveVendorPhotoBatch] preview cache", cacheErr);
    }
  }

  if (item.vendorTelegramChatId) {
    void notifyVendorPhotoBatchApproved({
      telegramChatId: item.vendorTelegramChatId,
      storeName: item.vendorTitle,
      language: item.vendorLanguage,
      slug: item.vendorSlug,
      photoCount: photoUrls.length,
    }).catch((e) =>
      console.error("[approveVendorPhotoBatch] notify", e),
    );
  }

  revalidateAllAfterPhotoBatch(item.vendorSlug);
  return { ok: true };
}

/** Отклонить партию фото с опциональной причиной (увидит продавец). */
export async function rejectVendorPhotoBatch(
  batchId: string,
  reason?: string,
): Promise<PhotoBatchActionState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, message: "Нет доступа" };
  }

  const admin = createAdminClient();

  const { data: batch, error: fetchErr } = await admin
    .from("vendor_photo_batches")
    .select(PHOTO_BATCH_SELECT)
    .eq("id", batchId)
    .maybeSingle();

  if (fetchErr || !batch) {
    return { ok: false, message: "Партия не найдена" };
  }

  const item = normalizeItem(batch);
  if (!item) {
    return { ok: false, message: "Не удалось разобрать партию" };
  }

  const trimmed = reason?.trim().slice(0, 500) || null;

  const { error: updErr } = await admin
    .from("vendor_photo_batches")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", batchId);

  if (updErr) {
    console.error("[rejectVendorPhotoBatch] update", updErr);
    return { ok: false, message: "Не удалось отклонить" };
  }

  if (item.vendorTelegramChatId) {
    void notifyVendorPhotoBatchRejected({
      telegramChatId: item.vendorTelegramChatId,
      storeName: item.vendorTitle,
      language: item.vendorLanguage,
      slug: item.vendorSlug,
      reason: trimmed,
    }).catch((e) =>
      console.error("[rejectVendorPhotoBatch] notify", e),
    );
  }

  revalidateAllAfterPhotoBatch(item.vendorSlug);
  return { ok: true };
}
