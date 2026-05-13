"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthDialog } from "@/components/auth/AuthDialog";

export type OpenAuthDialogOptions = {
  returnTo?: string;
};

type AuthDialogContextValue = {
  openAuthDialog: (options?: OpenAuthDialogOptions) => void;
  returnTo: string | null;
  displayName: string | null;
  reportAuthSuccess: (payload: { name?: string | null }) => void;
  clearAuthDisplayName: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

function captureCurrentPathWithSearch(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.pathname}${window.location.search}`;
}

/** Единый `AuthDialog` для шапки, избранного в каталоге и др.; без провайдера `useOpenAuthDialog` — no-op. */
export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const openAuthDialog = useCallback((options?: OpenAuthDialogOptions) => {
    const nextReturnTo =
      options?.returnTo?.trim() || captureCurrentPathWithSearch();
    setReturnTo(nextReturnTo || null);
    setOpen(true);
  }, []);

  const reportAuthSuccess = useCallback((payload: { name?: string | null }) => {
    const name = payload.name?.trim();
    if (name) {
      setDisplayName(name);
    }
  }, []);

  const clearAuthDisplayName = useCallback(() => {
    setDisplayName(null);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setReturnTo(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      openAuthDialog,
      returnTo,
      displayName,
      reportAuthSuccess,
      clearAuthDisplayName,
    }),
    [openAuthDialog, returnTo, displayName, reportAuthSuccess, clearAuthDisplayName],
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog
        open={open}
        onOpenChange={handleOpenChange}
        returnTo={returnTo}
        reportAuthSuccess={reportAuthSuccess}
      />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog(): AuthDialogContextValue {
  const ctx = useContext(AuthDialogContext);
  return (
    ctx ?? {
      openAuthDialog: () => {},
      returnTo: null,
      displayName: null,
      reportAuthSuccess: () => {},
      clearAuthDisplayName: () => {},
    }
  );
}

export function useOpenAuthDialog(): (options?: OpenAuthDialogOptions) => void {
  const ctx = useContext(AuthDialogContext);
  return ctx?.openAuthDialog ?? (() => {});
}
