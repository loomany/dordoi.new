"use client";

import { useEffect } from "react";

import { markVendorEditSeen } from "@/lib/admin/vendor-edit-seen";

/** При открытии страницы редактирования заявки помечает её как «просмотренную» (localStorage). */
export function AdminVendorEditSeenRecorder({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    markVendorEditSeen(vendorId);
  }, [vendorId]);
  return null;
}
