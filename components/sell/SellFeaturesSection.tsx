import { getTranslations } from "next-intl/server";
import { Megaphone, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = [ShieldCheck, TrendingUp, Megaphone] as const;

const cardShell =
  "flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md";

type Props = {
  className?: string;
};

export async function SellFeaturesSection({ className }: Props) {
  const t = await getTranslations("Pages.sell.features");

  return (
    <section
      id="sell-features"
      className={cn("scroll-mt-20", className)}
      aria-labelledby="sell-features-title"
    >
      <h2
        id="sell-features-title"
        className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
      >
        {t("sectionTitle")}
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
        {icons.map((Icon, i) => (
          <div key={i} className={cardShell}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-gray-900">
                {t(`items.${i}.title`)}
              </h3>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-500">
              {t(`items.${i}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
