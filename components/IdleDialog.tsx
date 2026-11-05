"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./Icons";

export default function IdleDialog({ onFinish }: { onFinish: () => void }) {
  const lastActivity = useRef(0);
  const warningOpen = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const continueReading = () => {
    lastActivity.current = Date.now();
    warningOpen.current = false;
    setRemaining(null);
  };
  useEffect(() => {
    lastActivity.current = Date.now();
    const activity = () => { if (!warningOpen.current) lastActivity.current = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach(event => window.addEventListener(event, activity, { capture: true, passive: true }));
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= 120_000) { onFinish(); return; }
      if (elapsed >= 100_000) {
        warningOpen.current = true;
        setRemaining(Math.ceil((120_000 - elapsed) / 1000));
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      events.forEach(event => window.removeEventListener(event, activity, true));
    };
  }, [onFinish]);

  return <Dialog.Root open={remaining !== null} onOpenChange={open => { if (!open) continueReading(); }}>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="idle-dialog" onPointerDownOutside={event => event.preventDefault()} onEscapeKeyDown={event => { event.preventDefault(); continueReading(); }}>
      <span className="dialog-symbol"><Icon name="document" width="30" height="30" /></span>
      <Dialog.Title>Lesen Sie noch?</Dialog.Title>
      <Dialog.Description>Nach längerer Inaktivität schließen wir die Patientenakte. Sie können jederzeit weiterlesen.</Dialog.Description>
      <p className="countdown">Zur Stationsübersicht in <strong>{remaining} Sekunden</strong></p>
      <div className="dialog-actions"><button className="button primary" onClick={continueReading}>Weiterlesen <Icon name="arrow" /></button><button className="button secondary" onClick={onFinish}>Jetzt beenden</button></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
