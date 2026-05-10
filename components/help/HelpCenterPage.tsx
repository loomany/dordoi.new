import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Mail, MessageCircle, Send, ShoppingCart, Store } from "lucide-react";
import Link from "next/link";

import { FaqAccordion, type FaqItem } from "@/components/ui/faq-accordion";
import { vendorOnboardingTelegramHref } from "@/lib/vendor-onboarding-telegram";
import { cn } from "@/lib/utils";

function SectionShell({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof ShoppingCart;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--d-radius-2xl)] border border-[color-mix(in_oklch,var(--d-card-accent)_18%,transparent)] bg-card shadow-[var(--d-shadow-soft)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border/70 bg-[color-mix(in_oklch,var(--d-card-accent)_5%,transparent)] px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklch,var(--d-card-accent)_12%,transparent)] text-[var(--d-card-accent)]">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-card-foreground">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export async function HelpCenterPage() {
  const t = await getTranslations("Pages.help");
  const tl = await getTranslations("LegalDisclaimer");
  const botHref = vendorOnboardingTelegramHref();

  const buyersItems: FaqItem[] = [
    { question: t("buyersQ1"), answer: t("buyersA1") },
    { question: t("buyersQ2"), answer: t("buyersA2") },
    { question: t("buyersQ3"), answer: t("buyersA3") },
  ];

  const suppliersItems: FaqItem[] = [
    {
      question: t("suppliersQ1"),
      answerNode: (
        <p className="text-sm leading-relaxed text-gray-600">
          {t("suppliersA1Before")}
          <Link
            href={botHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--d-card-accent)] underline decoration-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] underline-offset-2 hover:opacity-90"
          >
            {t("suppliersA1Link")}
          </Link>
          {t("suppliersA1After")}
        </p>
      ),
    },
    { question: t("suppliersQ2"), answer: t("suppliersA2") },
    { question: t("suppliersQ3"), answer: t("suppliersA3") },
  ];

  const supportTelegram = t("supportTelegram").replace(/^@/, "");
  const supportTelegramHref = `https://t.me/${supportTelegram}`;

  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:space-y-12 sm:px-6 sm:py-16">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t("h1")}</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">{t("h2")}</p>
      </header>

      <div className="space-y-8">
        <SectionShell icon={ShoppingCart} title={t("buyersTitle")}>
          <FaqAccordion items={buyersItems} ariaLabel={t("buyersTitle")} />
        </SectionShell>

        <SectionShell icon={Store} title={t("suppliersTitle")}>
          <FaqAccordion items={suppliersItems} ariaLabel={t("suppliersTitle")} />
        </SectionShell>

        <SectionShell icon={MessageCircle} title={t("supportTitle")}>
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("supportIntro")}</p>
            <ul className="space-y-3 text-sm">
              <li className="flex flex-wrap items-center gap-2">
                <Send className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium text-card-foreground">{t("supportTelegramLabel")}</span>
                <Link
                  href={supportTelegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--d-card-accent)] underline decoration-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] underline-offset-2 hover:opacity-90"
                >
                  {t("supportTelegram")}
                </Link>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium text-card-foreground">{t("supportEmailLabel")}</span>
                <Link
                  href={`mailto:${t("supportEmail")}`}
                  className="font-semibold text-[var(--d-card-accent)] underline decoration-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] underline-offset-2 hover:opacity-90"
                >
                  {t("supportEmail")}
                </Link>
              </li>
            </ul>
          </div>
        </SectionShell>
      </div>

      <p className="rounded-[var(--d-radius-xl)] border border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
        {tl("short")}
      </p>
    </article>
  );
}
