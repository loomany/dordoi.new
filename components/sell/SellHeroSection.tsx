import { getTranslations } from "next-intl/server";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { vendorOnboardingTelegramHref } from "@/lib/vendor-onboarding-telegram";
import { cn } from "@/lib/utils";

const primaryBtn = cn(
  landingBlueCtaClassName,
  "rounded-2xl px-8 py-4 text-center",
);

type Props = {
  className?: string;
};

export async function SellHeroSection({ className }: Props) {
  const t = await getTranslations("Pages.sell");

  return (
    <section
      className={cn("text-center", className)}
      aria-labelledby="sell-hero-title"
    >
      <h1
        id="sell-hero-title"
        className="text-balance text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl"
      >
        {t("h1")}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 sm:text-xl">
        {t("subtext")}
      </p>
      <div className="mt-8 flex justify-center">
        <a
          href={vendorOnboardingTelegramHref()}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryBtn}
        >
          {t("hero.ctaPrimary")}
        </a>
      </div>
    </section>
  );
}
