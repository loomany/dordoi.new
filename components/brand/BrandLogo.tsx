import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Full brand string from i18n, e.g. `Dordoi.help` */
  name?: string;
  className?: string;
  /** Compact header vs footer / drawer */
  size?: "sm" | "md";
};

export function BrandLogo({
  name = "Dordoi.help",
  className,
  size = "md",
}: BrandLogoProps) {
  const dot = name.indexOf(".");
  const word = dot >= 0 ? name.slice(0, dot) : name;
  const suffix = dot >= 0 ? name.slice(dot) : "";

  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-tight",
        textSize,
        className,
      )}
    >
      <span className="bg-gradient-to-r from-primary via-sky-600 to-emerald-600 bg-clip-text text-transparent dark:from-primary dark:via-sky-400 dark:to-emerald-400">
        {word}
      </span>
      {suffix ? (
        <span className="font-semibold text-emerald-700/95 dark:text-emerald-400/95">{suffix}</span>
      ) : null}
    </span>
  );
}
