"use client";

import type { ReactNode } from "react";

import { CatalogBrowseRefreshProvider } from "@/components/catalog/CatalogBrowseRefreshContext";

/** Контекст обновления каталога после смены `?cat=`. */
export function CatalogBrowseRefreshShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CatalogBrowseRefreshProvider>{children}</CatalogBrowseRefreshProvider>
  );
}
