import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";

export async function LandingSections() {
  const spec = getLandingSpec();
  const sectionY = spacingClass(spec, "sectionY");
  const titleClass = typographyClass(spec, "sectionTitle");
  const leadClass = typographyClass(spec, "sectionLead");
  const blockGap = spacingClass(spec, "blockGap");

  const sections = spec.sections.map((s) => s.id);

  const nodes: Record<string, ReactNode> = {
    valueProps: (
      <ValuePropsBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />
    ),
    audiences: (
      <AudiencesBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />
    ),
    howItWorks: (
      <HowItWorksBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />
    ),
    ecosystem: <EcosystemBlock titleClass={titleClass} blockGap={blockGap} />,
    ctaBand: <CtaBandBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />,
  };

  return (
    <div className="flex flex-col">
      {sections.map((id) => (
        <div key={id} className={sectionY}>
          {nodes[id] ?? null}
        </div>
      ))}
    </div>
  );
}

async function ValuePropsBlock({
  titleClass,
  leadClass,
  blockGap,
}: {
  titleClass: string;
  leadClass: string;
  blockGap: string;
}) {
  const spec = getLandingSpec();
  const t = await getTranslations("Pages.home.sections.valueProps");
  const cardTitle = typographyClass(spec, "cardTitle");
  const bodyClass = typographyClass(spec, "body");
  const cardPad = spacingClass(spec, "cardPadding");
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {(["0", "1", "2"] as const).map((k) => (
          <Card
            key={k}
            className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
          >
            <CardHeader>
              <CardTitle className={`${cardTitle} font-semibold`}>{t(`items.${k}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className={`${bodyClass} text-muted-foreground`}>
              {t(`items.${k}.body`)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function AudiencesBlock({
  titleClass,
  leadClass,
  blockGap,
}: {
  titleClass: string;
  leadClass: string;
  blockGap: string;
}) {
  const spec = getLandingSpec();
  const t = await getTranslations("Pages.home.sections.audiences");
  const bodyClass = typographyClass(spec, "body");
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "buyersTitle" as const, body: "buyersBody" as const },
          { title: "suppliersTitle" as const, body: "suppliersBody" as const },
          { title: "agentsTitle" as const, body: "agentsBody" as const },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[var(--d-radius-2xl)] border border-border/70 bg-card p-[var(--d-space-lg)] shadow-[var(--d-shadow-soft)]"
          >
            <h3 className={`${typographyClass(spec, "cardTitle")} font-semibold`}>
              {t(item.title)}
            </h3>
            <p className={`mt-2 ${bodyClass} text-muted-foreground`}>{t(item.body)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

async function HowItWorksBlock({
  titleClass,
  leadClass,
  blockGap,
}: {
  titleClass: string;
  leadClass: string;
  blockGap: string;
}) {
  const spec = getLandingSpec();
  const t = await getTranslations("Pages.home.sections.howItWorks");
  const bodyClass = typographyClass(spec, "body");
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <ol className="grid gap-4 md:grid-cols-3">
        {(["0", "1", "2"] as const).map((k, i) => (
          <li
            key={k}
            className="flex gap-4 rounded-[var(--d-radius-2xl)] border border-border/60 bg-muted/20 p-[var(--d-space-lg)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold">{t(`steps.${k}.title`)}</h3>
              <p className={`mt-1 ${bodyClass} text-muted-foreground`}>{t(`steps.${k}.body`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

async function EcosystemBlock({
  titleClass,
  blockGap,
}: {
  titleClass: string;
  blockGap: string;
}) {
  const spec = getLandingSpec();
  const t = await getTranslations("Pages.home.sections.ecosystem");
  const bodyClass = typographyClass(spec, "body");
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <div className="rounded-[var(--d-radius-2xl)] border border-primary/25 bg-gradient-to-br from-primary/5 via-background to-muted/30 p-[var(--d-space-xl)] shadow-[var(--d-shadow-soft)]">
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <p className={`mt-4 max-w-3xl ${bodyClass} text-muted-foreground`}>{t("body")}</p>
      </div>
    </div>
  );
}

async function CtaBandBlock({
  titleClass,
  leadClass,
  blockGap,
}: {
  titleClass: string;
  leadClass: string;
  blockGap: string;
}) {
  const t = await getTranslations("Pages.home.sections.ctaBand");
  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--d-radius-2xl)] border border-border/80 bg-card p-[var(--d-space-xl)] shadow-[var(--d-shadow-soft)] md:flex-row md:items-center">
        <div>
          <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
          <p className={`mt-2 max-w-xl ${leadClass}`}>{t("lead")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full text-center")}
          >
            {t("primary")}
          </Link>
          <Link
            href="/catalog"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "rounded-full text-center",
            )}
          >
            {t("secondary")}
          </Link>
        </div>
      </div>
    </div>
  );
}
