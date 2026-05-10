"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Длинное описание: превью + «Показать всё» и модалка в стиле кабинета. */
const LONG_DESCRIPTION_CHARS = 280;

type Props = {
  description: string;
};

export function VendorAboutExpandable({ description }: Props) {
  const t = useTranslations("Cabinet.vendor");
  const text = description.trim();
  const isLong = text.length > LONG_DESCRIPTION_CHARS;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={cn(isLong && "line-clamp-5")}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {text}
        </p>
      </div>
      {isLong ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            {t("pendingAboutShowAll")}
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              closeLabel={t("pendingAboutClose")}
              className="w-[min(100%,36rem)] max-w-[calc(100vw-1.5rem)] border-zinc-200/95 bg-white sm:p-7 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <DialogHeader className="pr-10">
                <DialogTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t("pendingSectionAbout")}
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {text}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </>
  );
}
