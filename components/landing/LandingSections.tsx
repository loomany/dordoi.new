import type { ReactNode } from "react";
import {
  Eye,
  Handshake,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";

const VALUE_CARD_ICON_WRAP =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";

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
    serviceProviders: (
      <ServiceProvidersBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />
    ),
    ctaBand: <CtaBandBlock titleClass={titleClass} leadClass={leadClass} blockGap={blockGap} />,
  };

  const stripeBg = (i: number) =>
    i % 2 === 0
      ? "bg-background"
      : "bg-[#FAFAF8] dark:bg-zinc-950/35";

  return (
    <div className="flex flex-col">
      {sections.map((id, i) => (
        <div
          key={id}
          id={id === "howItWorks" ? "how-it-works" : undefined}
          className={cn(sectionY, stripeBg(i))}
        >
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
  const icons = [MessageCircle, Eye, Truck] as const;

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle className={`${cardTitle} min-w-0 flex-1 font-semibold leading-snug`}>
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className={`${bodyClass} text-muted-foreground`}>
                {t(`items.${k}.body`)}
              </CardContent>
            </Card>
          );
        })}
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
  const cardTitle = typographyClass(spec, "cardTitle");
  const bodyClass = typographyClass(spec, "body");
  const cardPad = spacingClass(spec, "cardPadding");
  const icons = [Handshake, Send, Store] as const;

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle className={`${cardTitle} min-w-0 flex-1 font-semibold leading-snug`}>
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className={`${bodyClass} text-muted-foreground`}>
                {t(`items.${k}.body`)}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <Link
          href="/suppliers"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full max-w-lg rounded-full px-8 text-center text-base font-semibold shadow-sm md:w-auto md:min-w-[min(100%,20rem)]",
          )}
        >
          {t("cta")}
        </Link>
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
  const cardTitle = typographyClass(spec, "cardTitle");
  const bodyClass = typographyClass(spec, "body");
  const cardPad = spacingClass(spec, "cardPadding");
  const icons = [Store, Search, MessageCircle] as const;

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle className={`${cardTitle} min-w-0 flex-1 font-semibold leading-snug`}>
                    {t(`steps.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className={`${bodyClass} text-muted-foreground`}>
                {t(`steps.${k}.body`)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

async function ServiceProvidersBlock({
  titleClass,
  leadClass,
  blockGap,
}: {
  titleClass: string;
  leadClass: string;
  blockGap: string;
}) {
  const spec = getLandingSpec();
  const t = await getTranslations("Pages.home.sections.serviceProviders");
  const cardTitle = typographyClass(spec, "cardTitle");
  const bodyClass = typographyClass(spec, "body");
  const cardPad = spacingClass(spec, "cardPadding");
  const icons = [ShieldCheck, Truck] as const;

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
      <p className={leadClass}>{t("lead")}</p>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {(["0", "1"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle className={`${cardTitle} min-w-0 flex-1 font-semibold leading-snug`}>
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className={`${bodyClass} text-muted-foreground`}>
                {t(`items.${k}.body`)}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <Link
          href="/contact"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full max-w-lg rounded-full px-8 text-center text-base font-semibold shadow-sm md:w-auto md:min-w-[min(100%,20rem)]",
          )}
        >
          {t("cta")}
        </Link>
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
  const roles = [
    { href: "/catalog" as const, Icon: ShoppingBag, key: "0" as const },
    { href: "/suppliers" as const, Icon: Store, key: "1" as const },
    { href: "/buyer-service" as const, Icon: ShieldCheck, key: "2" as const },
    { href: "/cargo" as const, Icon: Truck, key: "3" as const },
  ];

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <div className="rounded-[var(--d-radius-2xl)] border border-border/60 bg-slate-50 p-[var(--d-space-xl)] shadow-[var(--d-shadow-soft)] dark:bg-slate-950/40">
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <div className="mt-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
          <p className={`${leadClass} whitespace-nowrap`}>{t("lead")}</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
          {roles.map(({ href, Icon, key }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background p-4 shadow-sm outline-none transition-all",
                "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            >
              <Icon className="size-7 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold leading-snug">{t(`roles.${key}.title`)}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`roles.${key}.subtitle`)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
