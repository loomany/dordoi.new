"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getSeenVendorIdsSnapshot,
  subscribeVendorEditSeen,
} from "@/lib/admin/vendor-edit-seen";

function parseSeen(raw: string): Set<string> {
  try {
    const a = JSON.parse(raw) as unknown;
    if (!Array.isArray(a)) {
      return new Set();
    }
    return new Set(a.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function useVendorEditSeenIds(): Set<string> {
  const snap = useSyncExternalStore(
    subscribeVendorEditSeen,
    getSeenVendorIdsSnapshot,
    () => "[]",
  );
  return useMemo(() => parseSeen(snap), [snap]);
}
