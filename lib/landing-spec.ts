import { z } from "zod";
import rawSpec from "../docs/landing-spec.json";

const ctaKeySchema = z.enum(["buyer", "supplier", "buyerAgent"]);

const landingSpecSchema = z.object({
  version: z.number(),
  hero: z.object({
    layout: z.literal("split"),
    mockupPosition: z.enum(["left", "right"]),
    ctaOrder: z.array(ctaKeySchema).length(3),
    messageKeys: z.object({
      title: z.string(),
      subtitle: z.string(),
      ctas: z.object({
        buyer: z.string(),
        supplier: z.string(),
        buyerAgent: z.string(),
      }),
    }),
  }),
  sections: z.array(
    z.object({
      id: z.string(),
      variant: z.string().optional(),
    }),
  ),
  mobileSectionOrder: z.array(z.string()),
  typography: z.record(z.string(), z.string()),
  spacing: z.record(z.string(), z.string()),
});

export type LandingSpec = z.infer<typeof landingSpecSchema>;

export function getLandingSpec(): LandingSpec {
  return landingSpecSchema.parse(rawSpec);
}

/** Map spec token names to Tailwind arbitrary / utility classes used in UI */
export function typographyClass(
  spec: LandingSpec,
  key: keyof LandingSpec["typography"],
): string {
  const token = spec.typography[key];
  const map: Record<string, string> = {
    "d-text-5xl": "text-[length:var(--d-text-5xl)] leading-[var(--d-leading-tight)] tracking-[var(--d-tracking-tight)]",
    "d-text-4xl": "text-[length:var(--d-text-4xl)] leading-[var(--d-leading-tight)] tracking-[var(--d-tracking-tight)]",
    "d-text-3xl": "text-[length:var(--d-text-3xl)] leading-[var(--d-leading-snug)]",
    "d-text-xl": "text-[length:var(--d-text-xl)] leading-[var(--d-leading-snug)] text-muted-foreground",
    "d-text-lg": "text-[length:var(--d-text-lg)] leading-relaxed text-muted-foreground",
    "d-text-base": "text-[length:var(--d-text-base)] leading-relaxed",
  };
  return map[token] ?? "text-base";
}

export function spacingClass(spec: LandingSpec, key: keyof LandingSpec["spacing"]): string {
  const token = spec.spacing[key];
  const map: Record<string, string> = {
    "d-space-section-y": "py-[var(--d-space-section-y)]",
    "d-space-section-y-lg": "py-[var(--d-space-section-y-lg)]",
    "d-space-xl": "gap-[var(--d-space-xl)]",
    "d-space-lg": "p-[var(--d-space-lg)]",
    "d-block-gap": "space-y-[var(--d-space-xl)]",
  };
  return map[token] ?? "py-16";
}
