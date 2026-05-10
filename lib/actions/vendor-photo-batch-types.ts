/**
 * Типы для модерации партий фото отделены от файла с `"use server"`,
 * чтобы Turbopack не путал серверный action-модуль с обычным импортом
 * типа в client-компонентах. См. PhotoBatchModerationView.
 */

export type PhotoBatchModerationItem = {
  batchId: string;
  vendorId: string;
  vendorTitle: string;
  vendorSlug: string | null;
  vendorLanguage: string | null;
  vendorTelegramChatId: number | null;
  createdAt: string;
  status: "pending_moderation" | "approved" | "rejected";
  photos: { url: string; position: number }[];
};

export type PhotoBatchActionState =
  | { ok: true }
  | { ok: false; message: string };
