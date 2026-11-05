"use client";

import { useEffect, useRef, useState } from "react";

type ScanState = { status: "sending" | "success" } | { status: "error"; message: string };

async function sendScan(): Promise<ScanState> {
  const card = new URLSearchParams(window.location.search).get("card")?.trim() || "demo";
  try {
    const response = await fetch(`/api/scan?card=${encodeURIComponent(card)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      throw new Error(typeof result.error === "string" ? result.error : "Scan konnte nicht gesendet werden.");
    }
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Bitte die Internetverbindung prüfen." };
  }
}

export default function ScanPage() {
  const [state, setState] = useState<ScanState>({ status: "sending" });
  const started = useRef(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    inFlight.current = true;
    void sendScan().then((result) => {
      inFlight.current = false;
      setState(result);
    });
  }, []);

  async function retry() {
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ status: "sending" });
    const result = await sendScan();
    inFlight.current = false;
    setState(result);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-12 text-slate-950">
      <div className="w-full max-w-md text-center">
        <p className="mb-8 text-xl font-semibold">NFC-Karte</p>
        <div aria-live="polite" aria-atomic="true" className="mb-10">
          {state.status === "sending" && <h1 className="text-4xl font-bold">Sende ...</h1>}
          {state.status === "success" && (
            <div className="text-green-800">
              <span aria-hidden="true" className="block text-8xl font-bold">✓</span>
              <h1 className="mt-4 text-5xl font-bold leading-tight">An PC gesendet</h1>
            </div>
          )}
          {state.status === "error" && (
            <div className="text-red-800">
              <h1 className="text-4xl font-bold">Senden fehlgeschlagen</h1>
              <p className="mt-4 break-words text-xl">{state.message}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={state.status === "sending"}
          className="min-h-12 w-full rounded-xl bg-slate-950 px-6 py-4 text-xl font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700 disabled:opacity-60"
        >
          Nochmal senden
        </button>
      </div>
    </main>
  );
}
