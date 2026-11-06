"use client";

/** Kartenerkennung: iPhone -> /api/scan -> scans -> Realtime -> onCard. */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export type CardReaderStatus = "connecting" | "connected" | "offline";

// Missing or malformed payloads must reach the UI as unrecognized cards.
const cardIdFrom = (value: unknown): string => typeof value === "string" ? value : "";

export function useCardReader({
  onCard,
}: {
  onCard: (cardId: string) => void;
}): { status: CardReaderStatus } {
  const onCardRef = useRef(onCard);
  const [status, setStatus] = useState<CardReaderStatus>("connecting");

  useEffect(() => {
    onCardRef.current = onCard;
  });

  useEffect(() => {
    const client = supabase;
    const onScan = (event: Event) => onCardRef.current(cardIdFrom((event as CustomEvent<unknown>).detail));
    window.addEventListener("demo-card-scan", onScan);
    if (!client) return () => window.removeEventListener("demo-card-scan", onScan);

    const channel = client
      .channel("scans-" + crypto.randomUUID())
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scans" },
        (p) => onCardRef.current(cardIdFrom(p.new.card_id)),
      )
      .subscribe((s) =>
        setStatus(s === "SUBSCRIBED" ? "connected" : "connecting"),
      );

    return () => {
      window.removeEventListener("demo-card-scan", onScan);
      void client.removeChannel(channel);
    };
  }, []);

  return { status: supabase ? status : "offline" };
}
