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

type AuthDialogContextValue = {
  openAuthDialog: () => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

/** Единый `AuthDialog` для шапки, избранного в каталоге и др.; без провайдера `useOpenAuthDialog` — no-op. */
export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAuthDialog = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openAuthDialog }), [openAuthDialog]);

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog open={open} onOpenChange={setOpen} />
    </AuthDialogContext.Provider>
  );
}

export function useOpenAuthDialog(): () => void {
  const ctx = useContext(AuthDialogContext);
  return ctx?.openAuthDialog ?? (() => {});
}
