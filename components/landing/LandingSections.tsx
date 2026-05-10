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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { vendorOnboardingTelegramHref } from "@/lib/vendor-onboarding-telegram";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";

const VALUE_CARD_ICON_WRAP =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";

/** Mobile: icon + title stacked, centered; md+: horizontal row like desktop. */
const VALUE_CARD_HEADER_ROW =
  "flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:gap-3 md:text-left";

/** Centered section title + lead (home landing stripes). */
const sectionIntro =
  "space-y-2 text-center [&_h2]:text-balance [&_p]:mx-auto [&_p]:max-w-3xl [&_p]:text-pretty";

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
      <div className="space-y-2 text-center [&_h2]:text-balance">
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <div className="text-center md:overflow-x-auto md:[-webkit-overflow-scrolling:touch]">
          <p
            className={cn(
              leadClass,
              "mx-auto max-w-3xl px-1 text-pretty whitespace-normal md:inline-block md:max-w-none md:whitespace-nowrap",
            )}
          >
            {t("lead")}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className={VALUE_CARD_HEADER_ROW}>
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle
                    className={`${cardTitle} min-w-0 font-semibold leading-snug md:flex-1`}
                  >
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent
                className={`${bodyClass} text-center text-muted-foreground md:text-left`}
              >
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
      <div className="space-y-2 text-center [&_h2]:text-balance">
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <div className="text-center md:overflow-x-auto md:[-webkit-overflow-scrolling:touch]">
          <p
            className={cn(
              leadClass,
              "mx-auto max-w-3xl px-1 text-pretty whitespace-normal md:inline-block md:max-w-none md:whitespace-nowrap",
            )}
          >
            {t("lead")}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className={VALUE_CARD_HEADER_ROW}>
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle
                    className={`${cardTitle} min-w-0 font-semibold leading-snug md:flex-1`}
                  >
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent
                className={`${bodyClass} text-center text-muted-foreground md:text-left`}
              >
                {t(`items.${k}.body`)}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <a
          href={vendorOnboardingTelegramHref()}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            landingBlueCtaClassName,
            "w-full max-w-lg rounded-full px-8 py-4 text-center md:w-auto md:min-w-[min(100%,20rem)]",
          )}
        >
          {t("cta")}
        </a>
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
      <div className={sectionIntro}>
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <p className={leadClass}>{t("lead")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {(["0", "1", "2"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className={VALUE_CARD_HEADER_ROW}>
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle
                    className={`${cardTitle} min-w-0 font-semibold leading-snug md:flex-1`}
                  >
                    {t(`steps.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent
                className={`${bodyClass} text-center text-muted-foreground md:text-left`}
              >
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
      <div className={sectionIntro}>
        <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
        <p className={leadClass}>{t("lead")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {(["0", "1"] as const).map((k, i) => {
          const Icon = icons[i]!;
          return (
            <Card
              key={k}
              className={`rounded-[var(--d-radius-2xl)] border-border/70 shadow-[var(--d-shadow-soft)] ${cardPad}`}
            >
              <CardHeader className="pb-2">
                <div className={VALUE_CARD_HEADER_ROW}>
                  <div className={VALUE_CARD_ICON_WRAP} aria-hidden>
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <CardTitle
                    className={`${cardTitle} min-w-0 font-semibold leading-snug md:flex-1`}
                  >
                    {t(`items.${k}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent
                className={`${bodyClass} text-center text-muted-foreground md:text-left`}
              >
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
            landingBlueCtaClassName,
            "w-full max-w-lg rounded-full px-8 py-4 text-center md:w-auto md:min-w-[min(100%,20rem)]",
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
  const tg = vendorOnboardingTelegramHref();
  const roles = [
    { href: "/catalog" as const, Icon: ShoppingBag, key: "0" as const, external: false },
    { href: tg, Icon: Store, key: "1" as const, external: true },
    { href: "/buyers" as const, Icon: ShieldCheck, key: "2" as const, external: false },
  ];

  const roleCardClass = cn(
    "group flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background p-4 shadow-sm outline-none transition-all",
    "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  );

  return (
    <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${blockGap}`}>
      <div className="rounded-[var(--d-radius-2xl)] border border-border/60 bg-slate-50 p-[var(--d-space-xl)] shadow-[var(--d-shadow-soft)] dark:bg-slate-950/40">
        <div className={sectionIntro}>
          <h2 className={`${titleClass} font-semibold`}>{t("title")}</h2>
          <p className={leadClass}>{t("lead")}</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {roles.map(({ href, Icon, key, external }) => {
            const body = (
              <>
                <Icon className="size-7 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold leading-snug">{t(`roles.${key}.title`)}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`roles.${key}.subtitle`)}
                  </p>
                </div>
              </>
            );
            return external ? (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={roleCardClass}>
                {body}
              </a>
            ) : (
              <Link key={key} href={href} className={roleCardClass}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
