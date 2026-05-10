import { getTranslations } from "next-intl/server";
import { AlertTriangle, Clock, Mail, Send } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export async function ContactPage() {
  const t = await getTranslations("Pages.contact");
  const telegram = t("contactTelegram").replace(/^@/, "");
  const telegramHref = `https://t.me/${telegram}`;

  const topics = [t("topic1"), t("topic2"), t("topic3")] as const;

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:space-y-12 sm:px-6 sm:py-16">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t("h1")}</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{t("h2")}</p>
      </header>

      <div
        className={cn(
          "flex gap-4 rounded-[var(--d-radius-xl)] border-2 border-amber-400/70 bg-amber-50 p-4 shadow-sm sm:p-5",
          "dark:border-amber-500/45 dark:bg-amber-950/35",
        )}
        role="note"
        aria-label={t("attentionAria")}
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/35 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"
          aria-hidden
        >
          <AlertTriangle className="size-6" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 space-y-2 pt-0.5">
          <p className="text-base font-bold tracking-tight text-amber-950 dark:text-amber-50">
            {t("attentionTitle")}
          </p>
          <p className="text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
            {t("attentionBody")}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-card-foreground">{t("topicsHeading")}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-[var(--d-card-accent)]">
          {topics.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      <section
        className={cn(
          "overflow-hidden rounded-[var(--d-radius-2xl)] border border-[color-mix(in_oklch,var(--d-card-accent)_18%,transparent)] bg-card shadow-[var(--d-shadow-soft)]",
        )}
      >
        <div className="border-b border-border/70 bg-[color-mix(in_oklch,var(--d-card-accent)_5%,transparent)] px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
            {t("contactsHeading")}
          </h2>
        </div>
        <ul className="divide-y divide-border/70 p-4 sm:p-6">
          <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Send className="mt-0.5 size-5 shrink-0 text-[var(--d-card-accent)]" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-card-foreground">{t("contactTelegramLead")}</p>
              <Link
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm font-semibold text-[var(--d-card-accent)] underline decoration-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] underline-offset-2 hover:opacity-90"
              >
                {t("contactTelegram")}
              </Link>
            </div>
          </li>
          <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Mail className="mt-0.5 size-5 shrink-0 text-[var(--d-card-accent)]" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-card-foreground">{t("contactEmailLabel")}</p>
              <Link
                href={`mailto:${t("contactEmail")}`}
                className="inline-flex text-sm font-semibold text-[var(--d-card-accent)] underline decoration-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] underline-offset-2 hover:opacity-90"
              >
                {t("contactEmail")}
              </Link>
            </div>
          </li>
          <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Clock className="mt-0.5 size-5 shrink-0 text-[var(--d-card-accent)]" aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-card-foreground">{t("contactHoursLabel")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("contactHours")}</p>
            </div>
          </li>
        </ul>
      </section>
    </article>
  );
}
