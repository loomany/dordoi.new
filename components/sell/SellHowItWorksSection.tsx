import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export async function SellHowItWorksSection({ className }: Props) {
  const t = await getTranslations("Pages.sell.howItWorks");

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
                className="select-none text-5xl font-bold leading-none tabular-nums text-primary/25 sm:text-6xl"
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
    </section>
  );
}
