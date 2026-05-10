"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { cabinetShell } from "@/components/cabinet/cabinet-tokens";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type StoreNameApi = {
  setStoreName: (name: string | null) => void;
};

const VendorStoreNameContext = createContext<StoreNameApi | null>(null);

export function VendorStoreNameBridge({ name }: { name: string }) {
  const ctx = useContext(VendorStoreNameContext);

  useEffect(() => {
    if (!ctx) {
      return;
    }
    ctx.setStoreName(name);
    return () => ctx.setStoreName(null);
  }, [ctx, name]);

  return null;
}

function CabinetSignOutButton({ className }: { className?: string }) {
  const t = useTranslations("Cabinet");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(`/${locale}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={busy}
      className={cn(
        "shrink-0 text-sm font-semibold transition-[color,background-color,box-shadow] disabled:pointer-events-none disabled:opacity-50",
        "rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm hover:bg-zinc-50 active:bg-zinc-100",
        "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
        "sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:font-medium sm:text-primary sm:shadow-none sm:hover:bg-transparent sm:hover:underline sm:underline-offset-4 sm:active:bg-transparent",
        "dark:sm:bg-transparent dark:sm:text-primary dark:sm:hover:bg-transparent dark:sm:active:bg-transparent",
        className,
      )}
    >
      {t("signOut")}
    </button>
  );
}

type CabinetChromeProps = {
  navTitle: string;
  roleHeadline: string;
  phoneLine: string | null;
  children: ReactNode;
};

export function CabinetChrome({
  navTitle,
  roleHeadline,
  phoneLine,
  children,
}: CabinetChromeProps) {
  const [storeName, setStoreNameState] = useState<string | null>(null);

  const setStoreName = useCallback((name: string | null) => {
    setStoreNameState(name);
  }, []);

  const api = useMemo(() => ({ setStoreName }), [setStoreName]);

  return (
    <VendorStoreNameContext.Provider value={api}>
      <div className="bg-white dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 sm:gap-8 sm:py-8">
          <header>
            <div
              className={cn(
                cabinetShell.surface,
                "flex flex-col gap-4 rounded-2xl px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-full sm:px-8 sm:py-3.5",
              )}
            >
              <div className="flex min-w-0 gap-3 sm:items-center sm:gap-4">
                <div
                  className={cn(
                    cabinetShell.iconTile,
                    "size-11 shrink-0 sm:size-12",
                  )}
                  aria-hidden
                >
                  <UserRound className="size-5 sm:size-6" strokeWidth={1.65} />
                </div>
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {navTitle}
                  </span>
                  <span
                    className="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
                    aria-hidden
                  />
                  <span className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-50">
                    {roleHeadline}
                  </span>
                  {storeName ? (
                    <>
                      <span
                        className="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
                        aria-hidden
                      />
                      <span
                        className="min-w-0 max-w-[min(100%,14rem)] truncate text-lg font-semibold tracking-tight text-zinc-900 sm:max-w-[min(100%,24rem)] sm:text-xl dark:text-zinc-50"
                        title={storeName}
                      >
                        {storeName}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2",
                  "border-t border-zinc-100 pt-3 dark:border-zinc-800",
                  phoneLine ? "justify-between" : "justify-end",
                  "sm:border-t-0 sm:pt-0 sm:justify-end sm:gap-x-4 sm:max-w-[min(100%,28rem)]",
                )}
              >
                {phoneLine ? (
                  <p className="min-w-0 flex-1 text-xs leading-snug text-zinc-600 sm:flex-none sm:text-sm sm:text-right dark:text-zinc-400">
                    {phoneLine}
                  </p>
                ) : null}
                <CabinetSignOutButton />
              </div>
            </div>
          </header>
          <div>{children}</div>
        </div>
      </div>
    </VendorStoreNameContext.Provider>
  );
}
