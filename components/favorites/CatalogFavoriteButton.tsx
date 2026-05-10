"use client";

import type { User } from "@supabase/supabase-js";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const loggedOut = sessionReady && !user;

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || pending) {
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

  return (
    <button
      type="button"
      disabled={disabled}
      title={titleHint}
      aria-label={ariaLabel}
      aria-pressed={fav}
      onClick={onToggle}
      className={cn(
        showCardLabel
          ? "inline-flex items-center gap-2 rounded-full border bg-white/95 px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-black/[0.03] transition-colors hover:bg-white sm:gap-0 sm:p-2.5"
          : "inline-flex items-center gap-0 rounded-full border bg-white/95 p-2.5 text-sm font-medium shadow-sm ring-1 ring-black/[0.03] transition-colors hover:bg-white",
        fav
          ? "border-[color-mix(in_oklch,var(--d-card-accent)_30%,transparent)] text-[var(--d-card-accent)]"
          : "border-gray-200 text-gray-600 hover:border-gray-300",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <Heart className={cn("size-4 shrink-0", fav && "fill-current")} aria-hidden />
      {showCardLabel ? <span className="sm:hidden">{cardLabel}</span> : null}
    </button>
  );
}
