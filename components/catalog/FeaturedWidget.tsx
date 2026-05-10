import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Highlight card with orange border — sits beside catalog header on large screens. */
export async function FeaturedWidget({ className }: Props) {
  const t = await getTranslations("Pages.catalogBrowse.featured");

  return (
    <aside
      className={cn(
        "flex min-h-[min(100%,18rem)] flex-col rounded-2xl border-2 border-orange-200 bg-white p-6 shadow-sm",
        "bg-[radial-gradient(ellipse_at_top_right,_rgba(255,237,213,0.55)_0%,_transparent_55%),_linear-gradient(to_bottom,_#ffffff,_#fffdfb)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-400" aria-hidden />
          {t("badge")}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
          {t("mark")}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-bold leading-snug text-gray-900">{t("title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{t("description")}</p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {t("footerLabel")}
        </span>
        <button
          type="button"
          className="text-sm font-bold text-gray-900 underline-offset-4 hover:underline"
        >
          {t("footerCta")}
        </button>
      </div>
    </aside>
  );
}
