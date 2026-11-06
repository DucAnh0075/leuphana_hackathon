"use client";
import { useEffect, useRef } from "react";
import { getKisSupabase } from "@/lib/kis-card";

export function useKisCardScan({ onCard, enabled }: { onCard: (id: string) => void | Promise<void>; enabled: boolean }) {
  const callback = useRef(onCard);
  useEffect(() => { callback.current = onCard; });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const receive = (id: string) => { if (active) void callback.current(id); };
    const listener = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail;
      if (typeof detail === "string") receive(detail);
    };
    window.addEventListener("kis-card-scan", listener);
    const supabase = getKisSupabase();
    const channel = supabase?.channel("kis-card-scans").on("postgres_changes", { event: "INSERT", schema: "public", table: "kis_card_scans" }, payload => receive(String(payload.new.card_id))).subscribe();
    return () => {
      active = false;
      window.removeEventListener("kis-card-scan", listener);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [enabled]);
}
