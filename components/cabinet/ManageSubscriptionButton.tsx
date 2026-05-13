"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { getSubscriptionCustomerPortalUrl } from "@/app/actions/subscription";
import { cn } from "@/lib/utils";

export function ManageSubscriptionButton() {
  const t = useTranslations("Cabinet.buyer.subscription");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onManage() {
    setError(null);
    startTransition(async () => {
      const result = await getSubscriptionCustomerPortalUrl();
      if (!result.ok) {
        setError(t("portalError"));
        return;
      }
      window.location.assign(result.url);
    });
  }

  return (
    <section className="mb-8 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {t("body")}
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onManage}
        disabled={isPending}
        className={cn(
          "mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors",
          "hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
        )}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ExternalLink className="size-4" aria-hidden />
        )}
        {t("manageCta")}
      </button>
    </section>
  );
}
