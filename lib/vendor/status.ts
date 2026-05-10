/** Дефолт после онбординга в боте и в миграции `vendors.status`. */
export const VENDOR_PENDING_STATUS = "pending_moderation" as const;

export type VendorModerationStatus =
  | "pending_moderation"
  | "approved"
  | "rejected";

export function isVendorModerationStatus(s: string): s is VendorModerationStatus {
  return (
    s === "pending_moderation" ||
    s === "approved" ||
    s === "rejected"
  );
}
