import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type ServiceNamespace = "catalog" | "sell" | "buyers";

type Props = {
  namespace: ServiceNamespace;
  className?: string;
};

/** Hero (H1 + subtext) and an “under development” placeholder for service routes. */
export async function ServiceHeroPage({ namespace, className }: Props) {
  const t = await getTranslations(`Pages.${namespace}`);
  const tc = await getTranslations("Pages.common");

  return (
    <article className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16", className)}>
      <section
        className="rounded-[var(--d-radius-2xl)] border border-border/70 bg-[#FAFAF8] px-6 py-12 shadow-[var(--d-shadow-soft)] sm:px-10 sm:py-14 dark:bg-zinc-950/35"
        aria-labelledby={`${namespace}-hero-title`}
      >
        <h1
          id={`${namespace}-hero-title`}
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          {t("h1")}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {t("subtext")}
        </p>
      </section>

      <section
        className="mt-10 rounded-[var(--d-radius-xl)] border border-dashed border-border/80 bg-muted/15 px-6 py-14 text-center sm:py-16"
        aria-label={tc("underDevelopmentAria")}
      >
        <p className="text-sm font-medium text-muted-foreground sm:text-base">{tc("underDevelopment")}</p>
      </section>
    </article>
  );
}
