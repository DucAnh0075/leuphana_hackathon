"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { VoraAppointment, PreventionTask } from "@/lib/vora-profile";
export type VoraAccountActions = {
  localScope: string;
  activeCaseId?: string; appointments: VoraAppointment[]; tasks: PreventionTask[];
  recordAppointment: (input: VoraAppointment) => Promise<boolean>;
  cancelAppointment: (id: string) => Promise<boolean>;
  addPreventionTask: (offerId: string) => Promise<boolean>;
};
const Context = createContext<VoraAccountActions | null>(null);
export function VoraAccountActionsProvider({ value, children }: { value: VoraAccountActions; children: ReactNode }) { return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useVoraAccountActions() { return useContext(Context); }
