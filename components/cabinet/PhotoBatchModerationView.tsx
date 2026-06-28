"use client";

import { ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveVendorPhotoBatch,
  rejectVendorPhotoBatch,
} from "@/lib/actions/vendor-photo-batch-moderation";
import type { PhotoBatchModerationItem } from "@/lib/actions/vendor-photo-batch-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { providerDateLocale } from "@/lib/provider-dates";

type Props = {
  items: PhotoBatchModerationItem[];
  locale: string;
};

export function PhotoBatchModerationView({ items, locale }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectingFor, setRejectingFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (items.length === 0) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(providerDateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function approve(batchId: string) {
    startTransition(async () => {
      const r = await approveVendorPhotoBatch(batchId);
      if (r.ok) {
        router.refresh();
      } else {
        window.alert(r.message);
      }
    });
  }

  function startReject(batchId: string) {
    setRejectingFor(batchId);
    setReason("");
  }

  function confirmReject(batchId: string) {
    startTransition(async () => {
      const r = await rejectVendorPhotoBatch(batchId, reason);
      if (r.ok) {
        setRejectingFor(null);
        setReason("");
        router.refresh();
      } else {
        window.alert(r.message);
      }
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <ImageIcon className="size-5 text-emerald-600" aria-hidden />
          Новые фото от продавцов
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
            {items.length}
          </span>
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {items.map((batch) => (
          <article
            key={batch.batchId}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200/95 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {batch.vendorTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(batch.createdAt))} ·{" "}
                  {batch.photos.length} фото
                </p>
              </div>
              {batch.vendorSlug ? (
                <a
                  href={`/${locale}/catalog/${batch.vendorSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
                >
                  Открыть карточку
                </a>
              ) : null}
            </header>

            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {batch.photos.map((p) => (
                <li
                  key={`${batch.batchId}-${p.position}`}
                  className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Storage public URL */}
                  <img
                    src={p.url}
                    alt={`Фото ${p.position}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </li>
              ))}
            </ul>

            {rejectingFor === batch.batchId ? (
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
                <label
                  htmlFor={`reason-${batch.batchId}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Причина (увидит продавец, до 500 символов)
                </label>
                <textarea
                  id={`reason-${batch.batchId}`}
                  className="min-h-[64px] w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  placeholder="Например: фото повторяются с предыдущей партии"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => confirmReject(batch.batchId)}
                  >
                    Подтвердить отказ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setRejectingFor(null)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-nowrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "min-w-0 flex-1 bg-emerald-600 text-white hover:bg-emerald-700",
                    "dark:bg-emerald-600 dark:hover:bg-emerald-500",
                  )}
                  disabled={pending}
                  onClick={() => approve(batch.batchId)}
                >
                  Опубликовать
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="min-w-0 flex-1"
                  disabled={pending}
                  onClick={() => startReject(batch.batchId)}
                >
                  Отклонить
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
