/** Локально в браузере админа: какие заявки уже открывали на странице редактирования. */

export const ADMIN_VENDOR_EDIT_SEEN_KEY = "dordoi.admin.vendorEditSeen.v1";

export const ADMIN_VENDOR_EDIT_SEEN_EVENT = "dordoi:admin-vendor-edit-seen";

export function subscribeVendorEditSeen(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_VENDOR_EDIT_SEEN_KEY || e.key === null) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_VENDOR_EDIT_SEEN_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_VENDOR_EDIT_SEEN_EVENT, listener);
  };
}

export function getSeenVendorIdsSnapshot(): string {
  if (typeof window === "undefined") {
    return "[]";
  }
  return localStorage.getItem(ADMIN_VENDOR_EDIT_SEEN_KEY) ?? "[]";
}

export function markVendorEditSeen(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const cur = new Set<string>();
    const raw = localStorage.getItem(ADMIN_VENDOR_EDIT_SEEN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const x of parsed) {
          if (typeof x === "string") {
            cur.add(x);
          }
        }
      }
    }
    cur.add(id);
    localStorage.setItem(
      ADMIN_VENDOR_EDIT_SEEN_KEY,
      JSON.stringify([...cur].sort()),
    );
    window.dispatchEvent(new Event(ADMIN_VENDOR_EDIT_SEEN_EVENT));
  } catch {
    // ignore quota / JSON
  }
}
