import { SellFeaturesSection } from "@/components/sell/SellFeaturesSection";
import { SellHeroSection } from "@/components/sell/SellHeroSection";
import { SellHowItWorksSection } from "@/components/sell/SellHowItWorksSection";
import { getLandingSpec, spacingClass } from "@/lib/landing-spec";
import { cn } from "@/lib/utils";

/** High-converting B2B vendor landing for `/sell` — stripe layout aligned with the home page. */
export async function SellVendorLanding() {
  const spec = getLandingSpec();
  const heroY = spacingClass(spec, "heroPaddingY");
  const sectionY = spacingClass(spec, "sectionY");

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          heroY,
          "border-b border-zinc-200/80 bg-[#FAFAF8]",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SellHeroSection />
        </div>
      </div>
      <div className={cn(sectionY, "bg-background")}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SellFeaturesSection />
        </div>
      </div>
      <div
        className={cn(
          sectionY,
          "bg-[#FAFAF8] dark:bg-zinc-950/35",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SellHowItWorksSection />
        </div>
      </div>
    </div>
  );
}
