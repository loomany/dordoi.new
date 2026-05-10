import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type CatalogCardProps = {
  title: string;
  description: string;
  viewProfileLabel: string;
  /** When set, the whole card links to the provider profile (no nested button). */
  href?: string;
  /** Pre-formatted “added / updated” lines from registry + i18n. */
  addedLine?: string;
  updatedLine?: string;
  className?: string;
};

const ctaClassName =
  "block w-full rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-orange-500 transition-colors hover:bg-orange-50";

/** Standard catalog listing card — wholesale supplier style. */
export function CatalogCard({
  title,
  description,
  viewProfileLabel,
  href,
  addedLine,
  updatedLine,
  className,
}: CatalogCardProps) {
  const showMeta = Boolean(addedLine || updatedLine);

  const inner = (
    <>
      <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
      <p className="line-clamp-3 min-h-0 flex-1 text-sm text-gray-500">
        {description}
      </p>

      {showMeta ? (
        <div className="mt-4 space-y-0.5 border-t border-gray-100 pt-4 text-xs text-gray-400">
          {addedLine ? <p>{addedLine}</p> : null}
          {updatedLine ? <p>{updatedLine}</p> : null}
        </div>
      ) : null}

      <div className={showMeta ? "mt-4" : "mt-auto pt-6"}>
        <span className={ctaClassName}>{viewProfileLabel}</span>
      </div>
    </>
  );

  const articleClass = cn(
    "flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md",
    href && "hover:border-orange-200/80",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(articleClass, "group outline-none focus-visible:ring-2 focus-visible:ring-orange-300")}>
        {inner}
      </Link>
    );
  }

  return <article className={articleClass}>{inner}</article>;
}
