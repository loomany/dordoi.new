"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { cn } from "@/lib/utils";

export type CatalogAccessPaywallCopy = {
  title: string;
  body: string;
  ctaPayment: string;
  closeDialog: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: CatalogAccessPaywallCopy;
};

/** Заглушка оплаты полного доступа к каталогу. */
export function CatalogAccessPaywallModal({ open, onOpenChange, copy }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={copy.closeDialog}
        className="border-zinc-200/95 bg-[#FAFAF8] text-zinc-900 sm:p-7"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-left text-lg font-semibold tracking-tight text-zinc-950">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed text-zinc-600">
            {copy.body}
          </DialogDescription>
        </DialogHeader>
        <button
          type="button"
          className={cn(
            landingBlueCtaClassName,
            "mt-2 w-full rounded-full px-6 py-3.5 text-sm shadow-md",
          )}
          onClick={() => {
            /* payment stub — wire Lemon / checkout later */
          }}
        >
          {copy.ctaPayment}
        </button>
      </DialogContent>
    </Dialog>
  );
}
