import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

const proseRefundClassName = [
  "prose prose-neutral max-w-none dark:prose-invert",
  "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
  "prose-h1:mb-8 prose-h1:text-4xl prose-h1:leading-tight",
  "prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2 prose-h2:text-xl",
  "prose-p:mb-4 prose-p:last:mb-0 prose-p:leading-relaxed prose-p:text-muted-foreground",
  "prose-strong:text-foreground",
  "prose-a:font-medium prose-a:text-[var(--d-card-accent)] prose-a:no-underline hover:prose-a:underline",
].join(" ");

export async function RefundPolicyPage() {
  const t = await getTranslations("Pages.refund");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
      <div className={proseRefundClassName}>
        <h1>{t("h1")}</h1>

        <section>
          <h2>{t("s1Title")}</h2>
          <p>{t("s1Intro")}</p>
          <p>{t("s1p1")}</p>
          <p>{t("s1p2")}</p>
        </section>

        <section>
          <h2>{t("s2Title")}</h2>
          <div
            className={cn(
              "not-prose my-6 flex gap-4 rounded-[var(--d-radius-xl)] border-2 border-amber-400/70 bg-amber-50 p-4 shadow-sm sm:p-5",
              "dark:border-amber-500/45 dark:bg-amber-950/35",
            )}
            role="alert"
            aria-label={t("s2AlertAria")}
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/35 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"
              aria-hidden
            >
              <AlertTriangle className="size-6" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 space-y-2 pt-0.5">
              <p className="text-base font-bold uppercase tracking-wide text-amber-950 dark:text-amber-50">
                {t("s2AlertTitle")}
              </p>
              <p className="text-sm font-semibold leading-relaxed text-amber-950 dark:text-amber-50">
                {t("s2AlertBody")}
              </p>
            </div>
          </div>
          <p>{t("s2p1")}</p>
          <p>{t("s2p2")}</p>
          <p>{t("s2p3")}</p>
        </section>

        <section>
          <h2>{t("s3Title")}</h2>
          <p>{t("s3p1")}</p>
          <p>{t("s3p2")}</p>
        </section>

        <section>
          <h2>{t("s4Title")}</h2>
          <p>
            {t("s4before")}
            <Link href={`mailto:${t("supportEmail")}`}>{t("supportEmail")}</Link>
            {t("s4after")}
          </p>
        </section>
      </div>
    </article>
  );
}
