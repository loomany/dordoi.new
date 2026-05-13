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

/** Карточка байера в шапке каталога — shell как у CatalogCard. */
export async function CatalogBuyerSpotlight({ className }: Props) {
  const buyer = BUYERS.find((b) => b.id === SPOTLIGHT_BUYER_ID);
  if (!buyer || buyer.openSlot) return null;

  const tBuyers = await getTranslations("Pages.buyers");
  const tCatalog = await getTranslations("Pages.catalogBrowse");
  const base = `cards.${buyer.id}`;

  return (
    <aside
      className={cn(
        "relative flex w-full flex-col rounded-[var(--d-radius-2xl)] border border-solid border-[var(--d-catalog-card-border)] bg-card",
        "px-4 pt-4 pb-2.5 shadow-[var(--d-catalog-card-shadow-mobile)] sm:px-5 sm:pt-5 sm:pb-3 lg:shadow-[var(--d-shadow-soft)]",
        className,
      )}
      aria-label={tCatalog("featuredBuyerAria")}
    >
      <div className="flex gap-3">
        <div className="relative size-12 shrink-0 sm:size-[3.25rem]">
          {buyer.photoSrc ? (
            <Image
              src={buyer.photoSrc}
              alt={tBuyers(`${base}.name`)}
              width={52}
              height={52}
              className="size-full rounded-full border border-border/80 object-cover"
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

      <p className="mt-2.5 line-clamp-4 text-[13px] leading-[1.5] text-muted-foreground/90 sm:text-sm sm:leading-snug">
        {tBuyers(`${base}.description`)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 sm:pt-3">
        <span className="inline-flex shrink-0 items-center rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
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
  );
}
