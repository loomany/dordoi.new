import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BUYERS } from "@/data/buyers-directory";
import { cn } from "@/lib/utils";

const SPOTLIGHT_BUYER_ID = "arailym";

type Props = {
  className?: string;
};

/** Карточка байера в шапке каталога — выделена мягким SaaS-glow в стиле hero. */
export async function CatalogBuyerSpotlight({ className }: Props) {
  const buyer = BUYERS.find((b) => b.id === SPOTLIGHT_BUYER_ID);
  if (!buyer || buyer.openSlot) return null;

  const tBuyers = await getTranslations("Pages.buyers");
  const tCatalog = await getTranslations("Pages.catalogBrowse");
  const base = `cards.${buyer.id}`;

  return (
    <div className={cn("group relative", className)}>
      <div
        className="pointer-events-none absolute -inset-3 overflow-hidden rounded-[calc(var(--d-radius-2xl)+0.75rem)]"
        aria-hidden
      >
        <div className="d-spotlight-halo absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_90%_80%_at_50%_40%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_68%)]" />
        <div className="d-hero-blob-a absolute -left-[20%] top-[-35%] size-[min(16rem,130%)] rounded-full bg-primary/[0.14] blur-3xl" />
        <div className="d-hero-blob-b absolute -right-[15%] bottom-[-25%] size-[min(14rem,115%)] rounded-full bg-[oklch(0.55_0.12_250/0.12)] blur-3xl" />
      </div>

      <div
        className={cn(
          "relative rounded-[var(--d-radius-2xl)] p-px",
          "bg-gradient-to-br from-primary/45 via-primary/18 to-[color-mix(in_oklch,var(--d-card-accent)_38%,transparent)]",
          "shadow-[0_0_0_1px_oklch(0.508_0.118_165.612/0.08),0_4px_24px_oklch(0.508_0.118_165.612/0.12),0_18px_48px_oklch(0.2_0.02_250/0.08)]",
          "transition-[transform,box-shadow] duration-500 ease-out",
          "group-hover:-translate-y-0.5 group-hover:shadow-[0_0_0_1px_oklch(0.508_0.118_165.612/0.14),0_8px_32px_oklch(0.508_0.118_165.612/0.16),0_24px_56px_oklch(0.2_0.02_250/0.1)]",
        )}
      >
        <aside
          className={cn(
            "relative flex w-full flex-col overflow-hidden rounded-[calc(var(--d-radius-2xl)-1px)] bg-card",
            "px-4 pt-4 pb-2.5 sm:px-5 sm:pt-5 sm:pb-3",
            "bg-[radial-gradient(ellipse_at_top_right,_color-mix(in_oklch,var(--primary)_16%,transparent)_0%,_transparent_58%),_linear-gradient(to_bottom,_color-mix(in_oklch,var(--secondary)_42%,var(--card)),_var(--card))]",
          )}
          aria-label={tCatalog("featuredBuyerAria")}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(oklch(0.35 0.02 250 / 0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              maskImage:
                "radial-gradient(ellipse 85% 70% at 50% 0%, black 15%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 85% 70% at 50% 0%, black 15%, transparent 75%)",
            }}
            aria-hidden
          />

          <div className="relative flex gap-3">
            <div className="relative size-12 shrink-0 sm:size-[3.25rem]">
              {buyer.photoSrc ? (
                <Image
                  src={buyer.photoSrc}
                  alt={tBuyers(`${base}.name`)}
                  width={52}
                  height={52}
                  className="size-full rounded-full border border-border/80 object-cover shadow-[0_2px_12px_oklch(0.508_0.118_165.612/0.12)] ring-2 ring-primary/10"
                  sizes="(max-width: 640px) 48px, 52px"
                />
              ) : null}
              <span
                className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-card"
                aria-label={tBuyers("verifiedBadgeAria")}
                role="img"
              >
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold uppercase leading-[1.2] tracking-tight text-card-foreground sm:text-base">
                {tBuyers(`${base}.name`)}
              </h2>
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground/85 sm:text-[13px]">
                {tBuyers(`${base}.specialization`)}
              </p>
            </div>
          </div>

          <p className="relative mt-2.5 line-clamp-4 text-[13px] leading-[1.5] text-muted-foreground/90 sm:text-sm sm:leading-snug">
            {tBuyers(`${base}.description`)}
          </p>

          <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-primary/10 pt-2.5 sm:pt-3">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
              <span
                className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_6px_oklch(0.508_0.118_165.612/0.55)]"
                aria-hidden
              />
              {tCatalog("featuredBuyerBadge")}
            </span>
            <Link
              href="/buyers"
              className={cn(
                "inline-flex max-w-full shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold leading-tight shadow-sm transition-colors",
                "border-primary/20 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] text-primary",
                "hover:border-primary/35 hover:from-primary/[0.11] hover:to-primary/[0.04]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              )}
            >
              <span className="min-w-0 truncate">{tCatalog("featuredBuyerLink")}</span>
              <ArrowRight className="size-3 shrink-0 opacity-75" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
