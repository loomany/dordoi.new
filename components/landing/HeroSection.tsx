import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";
import { HeroMockup } from "./HeroMockup";

export async function HeroSection() {
  const spec = getLandingSpec();
  const th = await getTranslations("Pages.home.hero");
  const titleClass = typographyClass(spec, "heroTitle");
  const subtitleClass = typographyClass(spec, "heroSubtitle");
  const sectionY = spacingClass(spec, "heroPaddingY");

  const textOrder = spec.hero.mockupPosition === "left" ? "lg:order-2" : "";
  const mockOrder = spec.hero.mockupPosition === "left" ? "lg:order-1" : "";

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-zinc-200/80 bg-[#FAFAF8]",
        sectionY,
      )}
      aria-labelledby="home-hero-title"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,0.92fr)] lg:items-center lg:gap-10 lg:px-8">
        <div className={cn("flex min-w-0 flex-col", textOrder)}>
          <div className="mb-4 inline-flex w-fit max-w-full rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm">
            {th("badge")}
          </div>
          <h1
            id="home-hero-title"
            className={cn(titleClass, "font-semibold tracking-tight text-zinc-950")}
          >
            {th("title")}
          </h1>
          <p className={cn(subtitleClass, "mt-4 max-w-2xl text-pretty text-zinc-600")}>
            {th("subtitle")}
          </p>
          <div className="mt-6 flex w-full max-w-2xl justify-center">
            <Link
              href="/catalog"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-w-[13.5rem] rounded-full px-10 text-center shadow-sm sm:min-w-[17rem] sm:px-14",
              )}
            >
              {th("ctaCatalog")}
            </Link>
          </div>
        </div>
        <div className={cn("min-w-0", mockOrder)}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
