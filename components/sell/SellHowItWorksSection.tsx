import { getTranslations } from "next-intl/server";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { vendorOnboardingTelegramHref } from "@/lib/vendor-onboarding-telegram";
import { cn } from "@/lib/utils";

/** Matches hero primary CTA on `/sell`. */
const primaryCta = cn(
  landingBlueCtaClassName,
  "rounded-2xl px-8 py-4 text-center",
);

type Props = {
  className?: string;
};

export async function SellHowItWorksSection({ className }: Props) {
  const t = await getTranslations("Pages.sell.howItWorks");
  const tSell = await getTranslations("Pages.sell");

  const indices = [0, 1, 2] as const;

  return (
    <section
      id="sell-how-it-works"
      className={cn(className)}
      aria-labelledby="sell-how-title"
    >
      <h2
        id="sell-how-title"
        className="mb-10 text-center text-3xl font-bold tracking-tight text-gray-900"
      >
        {t("sectionTitle")}
      </h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        {indices.map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <span
                className="select-none text-5xl font-bold leading-none tabular-nums text-blue-600/25 dark:text-blue-400/30 sm:text-6xl"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`steps.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {t(`steps.${i}.body`)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex justify-center sm:mt-14">
        <a
          href={vendorOnboardingTelegramHref()}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryCta}
        >
          {tSell("hero.ctaPrimary")}
        </a>
      </div>
    </section>
  );
}
