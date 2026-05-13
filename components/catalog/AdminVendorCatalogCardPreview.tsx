"use client";

import type { ReactNode } from "react";

import { CatalogCard, type CatalogCardProps } from "@/components/catalog/CatalogCard";

export type AdminVendorCatalogCardPreviewProps = Omit<CatalogCardProps, "variant">;

/**
 * Превью карточки в админке: те же пропсы, что у {@link CatalogCard}, плюс `variant="preview"`
 * (пунктирная обводка, `data-vendor-card="preview"`). Передайте `display` из ответа ИИ в памяти;
 * `href` не указывайте, пока черновик не готов к публикации.
 */
export function AdminVendorCatalogCardPreview(
  props: AdminVendorCatalogCardPreviewProps,
): ReactNode {
  return <CatalogCard {...props} variant="preview" />;
}
