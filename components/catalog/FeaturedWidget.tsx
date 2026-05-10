import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Highlight card — sits beside catalog header on large screens. */
export async function FeaturedWidget({ className }: Props) {
  const t = await getTranslations("Pages.catalogBrowse.featured");

  return (
    <aside
      className={cn(
        "flex min-h-[min(100%,18rem)] flex-col rounded-[var(--d-radius-2xl)] border border-primary/25 bg-card p-6 shadow-[var(--d-shadow-soft)]",
        "bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_oklch,var(--primary)_18%,transparent)_0%,_transparent_55%),_linear-gradient(to_bottom,_var(--card),_color-mix(in_oklch,var(--secondary)_28%,var(--card)))]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {t("badge")}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {t("mark")}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-bold leading-snug text-card-foreground">{t("title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("description")}</p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("footerLabel")}
        </span>
        <button
          type="button"
          className="text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          {t("footerCta")}
        </button>
      </div>
    </aside>
  );
}
