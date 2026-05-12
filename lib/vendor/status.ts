/** Дефолт после онбординга в боте и в миграции `vendors.status`. */
export const VENDOR_PENDING_STATUS = "pending_moderation" as const;

/** Заявки в очереди «Ожидают решения» (Telegram + Google Places). */
export const VENDOR_PENDING_QUEUE_STATUSES = [
  "pending_moderation",
  "pending_review",
] as const;

export type VendorPendingQueueStatus = (typeof VENDOR_PENDING_QUEUE_STATUSES)[number];

export function isVendorPendingQueueStatus(s: string): s is VendorPendingQueueStatus {
  return s === "pending_moderation" || s === "pending_review";
}

export type VendorModerationStatus =
  | "pending_moderation"
  | "pending_review"
  | "approved"
  | "rejected";

export function isVendorModerationStatus(s: string): s is VendorModerationStatus {
  return (
    s === "pending_moderation" ||
    s === "pending_review" ||
    s === "approved" ||
    s === "rejected"
  );
}
