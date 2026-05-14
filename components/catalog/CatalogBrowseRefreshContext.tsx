"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";

type CatalogBrowseRefreshContextValue = {
  isRefreshing: boolean;
  beginRefresh: () => void;
};

const CatalogBrowseRefreshContext =
  createContext<CatalogBrowseRefreshContextValue | null>(null);

function CatalogBrowseRefreshParamsWatcher({
  onSettled,
}: {
  onSettled: () => void;
}) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    onSettled();
  }, [searchKey, onSettled]);

  return null;
}

export function CatalogBrowseRefreshProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const beginRefresh = useCallback(() => {
    setIsRefreshing(true);
  }, []);

  const endRefresh = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (!isRefreshing) return;
    const timeout = window.setTimeout(() => {
      setIsRefreshing(false);
    }, 20_000);
    return () => window.clearTimeout(timeout);
  }, [isRefreshing]);

  return (
    <CatalogBrowseRefreshContext.Provider
      value={{ isRefreshing, beginRefresh }}
    >
      {children}
      <Suspense fallback={null}>
        <CatalogBrowseRefreshParamsWatcher onSettled={endRefresh} />
      </Suspense>
    </CatalogBrowseRefreshContext.Provider>
  );
}

export function useCatalogBrowseRefresh(): CatalogBrowseRefreshContextValue {
  const ctx = useContext(CatalogBrowseRefreshContext);
  if (!ctx) {
    throw new Error(
      "useCatalogBrowseRefresh must be used within CatalogBrowseRefreshProvider",
    );
  }
  return ctx;
}

export function useCatalogBrowseRefreshOptional():
  | CatalogBrowseRefreshContextValue
  | null {
  return useContext(CatalogBrowseRefreshContext);
}
