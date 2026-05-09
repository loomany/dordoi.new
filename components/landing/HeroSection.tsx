import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLandingSpec, spacingClass, typographyClass } from "@/lib/landing-spec";
import { HeroMockup } from "./HeroMockup";

const ctaHref = {
  buyer: "/buyers",
  supplier: "/suppliers",
  buyerAgent: "/buyer-service",
} as const;

export async function HeroSection() {
  const spec = getLandingSpec();
  const th = await getTranslations("Pages.home.hero");
  const titleClass = typographyClass(spec, "heroTitle");
  const subtitleClass = typographyClass(spec, "heroSubtitle");
  const sectionY = spacingClass(spec, "heroPaddingY");

  return (
    <section
      className={`${sectionY} border-b border-border/50 bg-gradient-to-b from-background to-muted/15`}
      aria-labelledby="home-hero-title"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div
          className={`flex flex-col gap-6 ${spec.hero.mockupPosition === "left" ? "lg:order-2" : ""}`}
        >
          <h1 id="home-hero-title" className={`${titleClass} font-semibold`}>
            {th("title")}
          </h1>
          <h2 className={subtitleClass}>{th("subtitle")}</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {spec.hero.ctaOrder.map((key) => (
              <Link
                key={key}
                href={ctaHref[key]}
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: key === "buyer" ? "default" : "outline",
                  }),
                  "rounded-full px-6 text-center",
                )}
              >
                {key === "buyer"
                  ? th("ctaBuyer")
                  : key === "supplier"
                    ? th("ctaSupplier")
                    : th("ctaBuyerAgent")}
              </Link>
            ))}
          </div>
        </div>
        <div className={spec.hero.mockupPosition === "left" ? "lg:order-1" : ""}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
