"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { moderateVendorTextAction } from "@/app/actions/vendor-ai";
import { AdminVendorCatalogCardPreview } from "@/components/catalog/AdminVendorCatalogCardPreview";
import { Link } from "@/i18n/navigation";
import type { ParsedVendorCardData } from "@/lib/catalog/vendor-card-display";
import {
  dedupeCatalogSubtitle,
  resolveCatalogStoreTitleForCard,
} from "@/lib/catalog/catalog-card-title";
import { cn } from "@/lib/utils";

const DEMO_CATEGORIES = ["Женская одежда"] as const;

export function VendorAIPlayground() {
  const t = useTranslations("Cabinet.admin");
  const tBrowse = useTranslations("Pages.catalogBrowse");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedVendorCardData | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("vendorAiPlaygroundTitle")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("vendorAiPlaygroundLead")}
          </p>
        </div>
        <Link
          href="/cabinet/admin"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("vendorAiPlaygroundBack")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("vendorAiPlaygroundInputSection")}
          </h2>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const form = e.currentTarget;
              const fd = new FormData(form);
              const storeTitle = String(fd.get("storeTitle") ?? "");
              const rawDescription = String(fd.get("rawDescription") ?? "");
              const instagramProfileUrl = String(
                fd.get("instagramProfileUrl") ?? "",
              ).trim();

              startTransition(async () => {
                const result = await moderateVendorTextAction({
                  storeTitle,
                  rawDescription,
                  instagramProfileUrl:
                    instagramProfileUrl.length > 0
                      ? instagramProfileUrl
                      : undefined,
                });
                if (!result.ok) {
                  setPreview(null);
                  setError(result.error);
                  return;
                }
                const d = result.data;
                const { storeTitle: headline, catalogBrandName } =
                  resolveCatalogStoreTitleForCard({
                    dbStoreName: storeTitle.trim(),
                    fallbackTitle: "Магазин",
                    catalogBrandNameFromAi: d.catalogBrandName,
                  });
                setPreview({
                  storeTitle: headline,
                  catalogBrandName,
                  subtitle: dedupeCatalogSubtitle(headline, d.subtitle),
                  description: d.description,
                  tradeType: d.tradeType,
                  commerce: d.commerce,
                  logoUrl: null,
                  categories: [...DEMO_CATEGORIES],
                  instagramUrl: null,
                });
              });
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t("vendorAiPlaygroundStoreTitle")}
              </span>
              <input
                name="storeTitle"
                type="text"
                required
                autoComplete="off"
                disabled={pending}
                placeholder={t("vendorAiPlaygroundStoreTitlePlaceholder")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t("vendorAiPlaygroundInstagramUrl")}
              </span>
              <input
                name="instagramProfileUrl"
                type="url"
                autoComplete="off"
                disabled={pending}
                placeholder={t("vendorAiPlaygroundInstagramUrlPlaceholder")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t("vendorAiPlaygroundRawDescription")}
              </span>
              <textarea
                name="rawDescription"
                required
                rows={12}
                disabled={pending}
                placeholder={t("vendorAiPlaygroundRawDescriptionPlaceholder")}
                className="min-h-[12rem] resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity",
                "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t("vendorAiPlaygroundSubmitting")}
                </>
              ) : (
                t("vendorAiPlaygroundSubmit")
              )}
            </button>
          </form>
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("vendorAiPlaygroundPreviewSection")}
          </h2>
          {!preview ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/35 bg-muted/20 px-4 py-16 text-center text-sm text-muted-foreground">
              {t("vendorAiPlaygroundPreviewPlaceholder")}
            </div>
          ) : (
            <div className="min-w-0">
              <AdminVendorCatalogCardPreview
                display={preview}
                viewProfileLabel={tBrowse("viewProfile")}
                aboutStoreLabel={tBrowse("cardAboutStore")}
                className="max-w-xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
