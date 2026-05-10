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

import { cabinetShell } from "@/components/cabinet/cabinet-tokens";
import { cn } from "@/lib/utils";

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
      <div className="border-b border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
          <header className="pb-6">
            <div
              className={cn(
                cabinetShell.surface,
                "flex flex-col gap-4 rounded-2xl px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-full sm:px-8 sm:py-3.5",
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {navTitle}
                </span>
                <span
                  className="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
                  aria-hidden
                />
                <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {roleHeadline}
                </span>
                {storeName ? (
                  <>
                    <span
                      className="hidden h-5 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-700"
                      aria-hidden
                    />
                    <span
                      className="min-w-0 max-w-[min(100%,14rem)] truncate text-xl font-semibold tracking-tight text-zinc-900 sm:max-w-[min(100%,24rem)] dark:text-zinc-50"
                      title={storeName}
                    >
                      {storeName}
                    </span>
                  </>
                ) : null}
              </div>
              {phoneLine ? (
                <p className="text-sm leading-snug text-zinc-600 dark:text-zinc-400 sm:max-w-[min(100%,20rem)] sm:text-right">
                  {phoneLine}
                </p>
              ) : null}
            </div>
          </header>
          <div>{children}</div>
        </div>
      </div>
    </VendorStoreNameContext.Provider>
  );
}
