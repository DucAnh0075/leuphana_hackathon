"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "./Icons";

export default function IdleDialog({ onFinish }: { onFinish: () => void }) {
  const lastActivity = useRef(0);
  const warningOpen = useRef(false);
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);
  const focusBeforeWarning = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    restoreFocus.current = false;
    onFinishRef.current();
  };
  const continueReading = () => {
    if (finished.current) return;
    lastActivity.current = Date.now();
    warningOpen.current = false;
    restoreFocus.current = true;
    setRemaining(null);
  };
  useEffect(() => {
    lastActivity.current = Date.now();
    const activity = () => { if (!warningOpen.current) lastActivity.current = Date.now(); };
    // Programmatic scrolling (PDF layout or focus restoration) is not user activity.
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach(event => window.addEventListener(event, activity, { capture: true, passive: true }));
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= 120_000) {
        clearInterval(interval);
        if (!finished.current) {
          finished.current = true;
          restoreFocus.current = false;
          onFinishRef.current();
        }
        return;
      }
      if (elapsed >= 100_000) {
        if (!warningOpen.current) {
          focusBeforeWarning.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }
        warningOpen.current = true;
        setRemaining(Math.ceil((120_000 - elapsed) / 1000));
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      events.forEach(event => window.removeEventListener(event, activity, true));
    };
  }, []);

  return <Dialog.Root open={remaining !== null} onOpenChange={open => { if (!open) continueReading(); }}>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="idle-dialog" onPointerDownOutside={event => event.preventDefault()} onEscapeKeyDown={event => { event.preventDefault(); continueReading(); }} onCloseAutoFocus={event => {
      // This timed dialog has no trigger; restore focus only when reading continues.
      event.preventDefault();
      const target = focusBeforeWarning.current;
      focusBeforeWarning.current = null;
      if (restoreFocus.current && target?.isConnected) target.focus({ preventScroll: true });
      restoreFocus.current = false;
    }}>
      <span className="dialog-symbol"><Icon name="document" width="30" height="30" /></span>
      <Dialog.Title>Lesen Sie noch?</Dialog.Title>
      <Dialog.Description>Nach längerer Inaktivität schließen wir die Patientenakte. Sie können jederzeit weiterlesen.</Dialog.Description>
      <p className="countdown">Zur Stationsübersicht in <strong>{remaining} Sekunden</strong></p>
      <div className="dialog-actions"><button className="button primary" onClick={continueReading}>Weiterlesen <Icon name="arrow" /></button><button className="button secondary" onClick={finish}>Jetzt beenden</button></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
