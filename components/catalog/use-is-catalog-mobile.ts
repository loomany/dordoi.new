"use client";

import { useSyncExternalStore } from "react";

/** Mobile относительно карточки каталога = Tailwind `lg:` (desktop ≥ 1024px). */
const CARD_MOBILE_QUERY = "(max-width: 1023.98px)";

function subscribeCardMobile(notify: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const mql = window.matchMedia(CARD_MOBILE_QUERY);
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", notify);
    return () => mql.removeEventListener("change", notify);
  }
  mql.addListener(notify);
  return () => mql.removeListener(notify);
}

function getCardMobileSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(CARD_MOBILE_QUERY).matches;
}

function getCardMobileServerSnapshot(): boolean {
  return false;
}

export function useIsCatalogMobile(): boolean {
  return useSyncExternalStore(
    subscribeCardMobile,
    getCardMobileSnapshot,
    getCardMobileServerSnapshot,
  );
}
