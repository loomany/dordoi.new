import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Props = {
  className?: string;
};

export async function SellHeroSection({ className }: Props) {
  const t = await getTranslations("Pages.sell");

  return (
    <section className={cn(className)} aria-labelledby="sell-hero-title">
      <h1
        id="sell-hero-title"
        className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl"
      >
        {t("h1")}
      </h1>
      <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-gray-500">
        {t("subtext")}
      </p>
      <div className="mt-8">
        <a href="#sell-how-it-works" className={primaryBtn}>
          {t("hero.ctaPrimary")}
        </a>
      </div>
    </section>
  );
}
