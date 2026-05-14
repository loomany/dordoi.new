"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useTransition } from "react";

import { VendorModerationCard } from "@/components/cabinet/VendorModerationCard";
import { updateVendorStatus } from "@/lib/actions/vendor-moderation";
import { Link } from "@/i18n/navigation";
import type { VendorApplicationRecord } from "@/lib/vendor/vendor-application";
import { isVendorPendingQueueStatus } from "@/lib/vendor/status";
import { useVendorEditSeenIds } from "@/hooks/use-vendor-edit-seen";
import { cn } from "@/lib/utils";

type Props = {
  vendors: VendorApplicationRecord[];
  filter: "pending" | "all";
};

export function VendorModerationView({ vendors, filter }: Props) {
  const t = useTranslations("Cabinet.admin");
  const locale = useLocale();
  const router = useRouter();
  const [actionPending, startTransition] = useTransition();
  const vendorEditSeenIds = useVendorEditSeenIds();

  function moderate(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const r = await updateVendorStatus(id, status);
      if (r.ok) {
        router.refresh();
      } else {
        window.alert(r.message);
      }
    });
  }

  const emptyPending = filter === "pending" && vendors.length === 0;
  const emptyAll = filter === "all" && vendors.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("moderationTitle")}
          {!emptyPending && !emptyAll ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {vendors.length}
            </span>
          ) : null}
        </h2>
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900/55">
          <Link
            href="/cabinet/admin"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === "pending"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            {t("filterPending")}
          </Link>
          <Link
            href="/cabinet/admin?filter=all"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            {t("filterAll")}
          </Link>
        </div>
      </div>

      {emptyPending ? (
        <EmptyPendingIllustration />
      ) : emptyAll ? (
        <p className="text-sm text-muted-foreground">{t("moderationEmpty")}</p>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {vendors.map((v) => (
            <VendorModerationCard
              key={v.id}
              vendor={v}
              locale={locale}
              vendorEditSeen={vendorEditSeenIds.has(v.id)}
              showActions={isVendorPendingQueueStatus(v.status)}
              actionPending={actionPending}
              onApprove={() => moderate(v.id, "approved")}
              onReject={() => moderate(v.id, "rejected")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyPendingIllustration() {
  const t = useTranslations("Cabinet.admin");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-sky-50/90 px-6 py-12 text-center shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-sky-950/20">
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
          <CheckCircle2 className="size-8" strokeWidth={1.75} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("emptyPendingTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("emptyPendingHint")}
        </p>
      </div>
    </div>
  );
}
