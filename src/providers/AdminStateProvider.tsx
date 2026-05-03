"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";

type CountdownTimerController = ReturnType<typeof useCountdownTimer>;

type AdminStateContextValue = {
  timer: CountdownTimerController;
};

const AdminStateContext = createContext<AdminStateContextValue | null>(null);

type AdminStateProviderProps = {
  children: ReactNode;
};

export function AdminStateProvider({ children }: AdminStateProviderProps) {
  const timer = useCountdownTimer();

  return (
    <AdminStateContext.Provider value={{ timer }}>
      {children}
    </AdminStateContext.Provider>
  );
}

export function useAdminState() {
  const context = useContext(AdminStateContext);

  if (context === null) {
    throw new Error("useAdminState must be used within AdminStateProvider");
  }

  return context;
}
