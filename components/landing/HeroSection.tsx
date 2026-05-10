import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { landingBlueCtaClassName } from "@/lib/landing-cta";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";

export async function HeroSection() {
  const spec = getLandingSpec();
  const th = await getTranslations("Pages.home.hero");
  const titleClass = typographyClass(spec, "heroTitle");
  const subtitleClass = typographyClass(spec, "heroSubtitle");
  const sectionY = spacingClass(spec, "heroPaddingY");

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-zinc-200/80 bg-[#FAFAF8] dark:border-zinc-800 dark:bg-zinc-950",
        sectionY,
      )}
      aria-labelledby="home-hero-title"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
          style={{
            backgroundImage: `radial-gradient(oklch(0.35 0.02 250 / 0.09) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 75% 65% at 50% 38%, black 20%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 50% 38%, black 20%, transparent 72%)",
          }}
        />
        <div className="d-hero-blob-a absolute -left-[18%] top-[-32%] size-[min(78vw,42rem)] rounded-full bg-primary/[0.085] blur-[100px] dark:bg-primary/[0.14]" />
        <div className="d-hero-blob-b absolute -right-[12%] top-[5%] size-[min(62vw,36rem)] rounded-full bg-[oklch(0.55_0.12_250/0.11)] blur-[88px] dark:bg-[oklch(0.55_0.12_250/0.18)]" />
        <div className="absolute left-1/2 top-[8%] h-[min(42vw,22rem)] w-[min(92vw,40rem)] -translate-x-1/2 rounded-[100%] border border-primary/[0.07] dark:border-primary/[0.12]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col items-center text-center">
          <h1
            id="home-hero-title"
            className={cn(
              titleClass,
              "w-full max-w-4xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-zinc-50",
            )}
          >
            {th("title")}
          </h1>
          <p
            className={cn(
              subtitleClass,
              "mt-4 w-full max-w-2xl text-pretty text-zinc-600 dark:text-zinc-400",
            )}
          >
            {th("subtitle")}
          </p>
          <div className="mt-6 flex w-full justify-center">
            <Link
              href="/catalog"
              className={cn(
                landingBlueCtaClassName,
                "min-w-[13.5rem] rounded-full px-10 py-4 text-center shadow-md transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:min-w-[17rem] sm:px-14",
              )}
            >
              {th("ctaCatalog")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
