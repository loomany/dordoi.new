"use client";

import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { GoogleAdsPaymentConversion } from "@/components/analytics/GoogleAdsPaymentConversion";
import { Link } from "@/i18n/navigation";
import { parsePaymentConversionSearchParams } from "@/lib/analytics/google-ads-payment-conversion";

function PaymentSuccessContent() {
  const t = useTranslations("Pages.paymentSuccess");
  const searchParams = useSearchParams();
  const { context } = parsePaymentConversionSearchParams(searchParams);
  const continueHref = context === "buyers" ? "/buyers" : "/catalog";
  const continueLabel =
    context === "buyers" ? t("ctaBuyers") : t("ctaCatalog");

  return (
    <>
      <GoogleAdsPaymentConversion />
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
        <CheckCircle2
          className="size-14 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("body")}
        </p>
        <Link
          href={continueHref}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {continueLabel}
        </Link>
      </div>
    </>
  );
}

export function PaymentSuccessView() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
