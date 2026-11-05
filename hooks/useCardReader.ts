"use client";

// Adapted from upstream 8d891788 / issue #32: iPhone -> scan -> Supabase -> UI.
// Events only request a fresh authorized snapshot; card IDs never select a fallback patient.
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/browser";

export type CardReaderStatus = "connecting" | "connected" | "offline";
export function useCardReader({ onCard, enabled = true }: { onCard: (cardId: string) => void; enabled?: boolean }) {
  const callback = useRef(onCard);
  const [status, setStatus] = useState<CardReaderStatus>("connecting");
  useEffect(() => { callback.current = onCard; }, [onCard]);
  useEffect(() => {
    if (!enabled) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const onScan = (event: Event) => {
      const id = (event as CustomEvent<unknown>).detail;
      if (typeof id === "string") callback.current(id);
    };
    window.addEventListener("demo-card-scan", onScan);
    const channel = client.channel("care-scans-" + crypto.randomUUID())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scans" },
        payload => callback.current(String(payload.new.card_id ?? "")))
      .subscribe(value => setStatus(value === "SUBSCRIBED" ? "connected" : value === "CHANNEL_ERROR" || value === "TIMED_OUT" || value === "CLOSED" ? "offline" : "connecting"));
    return () => {
      window.removeEventListener("demo-card-scan", onScan);
      void client.removeChannel(channel);
    };
  }, [enabled]);
  return { status: enabled ? status : "offline" as CardReaderStatus };
}
