"use client";

import type { User } from "@supabase/supabase-js";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useOpenAuthDialog } from "@/components/auth/auth-dialog-context";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type Props = {
  listingKey: string;
  initialFavorite?: boolean;
  variant: "card" | "sidebar";
  /** Card variant: если true — на узком экране показывается подпись рядом с сердцем. В сетке каталога обычно false (только иконка). */
  showCardLabel?: boolean;
  className?: string;
};

export function CatalogFavoriteButton({
  listingKey,
  initialFavorite = false,
  variant,
  showCardLabel = true,
  className,
}: Props) {
  const tBrowse = useTranslations("Pages.catalogBrowse");
  const tProfile = useTranslations("Pages.providerProfile");
  const router = useRouter();
  const openAuthDialog = useOpenAuthDialog();
  const [fav, setFav] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setFav(initialFavorite);
  }, [initialFavorite]);

  const loggedOut = sessionReady && !user;

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionReady) {
      return;
    }
    if (!user) {
      openAuthDialog();
      return;
    }
    if (pending) {
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      if (fav) {
        const { error } = await supabase
          .from("buyer_catalog_favorites")
          .delete()
          .eq("listing_key", listingKey);
        if (!error) {
          setFav(false);
        }
      } else {
        const { error } = await supabase.from("buyer_catalog_favorites").insert({
          user_id: user.id,
          listing_key: listingKey,
        });
        if (!error) {
          setFav(true);
        }
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || (sessionReady && !user);
  const cardNativeDisabled = pending;

  const ariaLabel = fav
    ? tBrowse("favoriteRemoveAria")
    : tBrowse("favoriteAddAria");

  const cardLabel = fav
    ? tBrowse("favoriteSavedLabel")
    : tBrowse("favoriteAddLabel");

  const titleHint = loggedOut ? tBrowse("favoriteLoginHint") : undefined;

  if (variant === "sidebar") {
    const label = fav ? tProfile("ctaSaved") : tProfile("ctaSave");
    return (
      <button
        type="button"
        disabled={disabled}
        title={titleHint}
        aria-label={ariaLabel}
        aria-pressed={fav}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors",
          fav
            ? "border-[color-mix(in_oklch,var(--d-card-accent)_30%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_12%,transparent)] text-[color-mix(in_oklch,var(--d-card-accent)_70%,black)] hover:bg-[color-mix(in_oklch,var(--d-card-accent)_18%,transparent)]"
            : "border-gray-200 text-gray-800 hover:bg-gray-50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Heart
          className={cn(
            "size-4",
            fav
              ? "fill-[var(--d-card-accent)] text-[var(--d-card-accent)]"
              : "text-gray-500",
          )}
          aria-hidden
        />
        {label}
      </button>
    );
  }

  const cardBase =
    "group relative isolate inline-flex items-center justify-center overflow-hidden rounded-full border text-sm font-medium shadow-sm outline-none " +
    "transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out " +
    "focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--d-card-accent)_35%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 " +
    "dark:bg-card/90 dark:ring-white/[0.06]";

  const cardIdle =
    "border-border/80 bg-white/95 text-muted-foreground ring-1 ring-black/[0.04] " +
    "hover:-translate-y-px hover:border-[color-mix(in_oklch,var(--d-card-accent)_42%,transparent)] hover:bg-[color-mix(in_oklch,var(--d-card-accent)_7%,white)] hover:text-[var(--d-card-accent)] " +
    "hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--d-card-accent)_20%,transparent),0_10px_28px_-8px_color-mix(in_oklch,var(--d-card-accent)_30%,transparent)] " +
    "dark:hover:bg-[color-mix(in_oklch,var(--d-card-accent)_14%,oklch(0.22_0.02_250))]";

  const cardSaved =
    "border-[color-mix(in_oklch,var(--d-card-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--d-card-accent)_14%,white)] text-[var(--d-card-accent)] ring-1 ring-[color-mix(in_oklch,var(--d-card-accent)_18%,transparent)] " +
    "shadow-[0_0_0_1px_color-mix(in_oklch,var(--d-card-accent)_12%,transparent),0_6px_22px_-10px_color-mix(in_oklch,var(--d-card-accent)_35%,transparent)] " +
    "hover:-translate-y-px hover:bg-[color-mix(in_oklch,var(--d-card-accent)_18%,white)] " +
    "hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--d-card-accent)_22%,transparent),0_12px_32px_-8px_color-mix(in_oklch,var(--d-card-accent)_42%,transparent)] " +
    "dark:bg-[color-mix(in_oklch,var(--d-card-accent)_18%,oklch(0.2_0.02_250))] dark:hover:bg-[color-mix(in_oklch,var(--d-card-accent)_24%,oklch(0.22_0.02_250))]";

  return (
    <button
      type="button"
      disabled={cardNativeDisabled}
      aria-disabled={disabled}
      title={titleHint}
      aria-label={ariaLabel}
      aria-pressed={fav}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onToggle}
      className={cn(
        cardBase,
        showCardLabel
          ? "gap-2 px-4 py-2 sm:gap-0 sm:p-2.5"
          : "gap-0 p-2.5",
        fav ? cardSaved : cardIdle,
        pending && "cursor-wait opacity-70",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 shrink-0 transition-[fill,transform,color,stroke] duration-200 ease-out motion-reduce:transition-none",
          fav
            ? "scale-[1.03] fill-[var(--d-card-accent)] stroke-[var(--d-card-accent)]"
            : "fill-transparent stroke-current group-hover:scale-105 group-hover:stroke-[var(--d-card-accent)]",
        )}
        strokeWidth={2}
        aria-hidden
      />
      {showCardLabel ? <span className="sm:hidden">{cardLabel}</span> : null}
    </button>
  );
}
