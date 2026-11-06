"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icons";

type Scan = { patient: { id: string; first: string; name: string; birth: string; documents: unknown[] }; at: number };

export default function ScanToast({ scan, onShowDocuments, onClose }: { scan: Scan | null; onShowDocuments: () => void; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  const at = scan?.at;
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (at === undefined) return;
    const timer = window.setTimeout(() => onCloseRef.current(), 8000);
    return () => window.clearTimeout(timer);
  }, [at]);
  if (!scan) return null;
  const { patient } = scan;
  return <div className="scan-toast" role="status" aria-live="polite" key={scan.at}>
    <Icon name="document" />
    <div className="scan-toast-content"><p className="scan-toast-title">NFC-Notfallkarte erkannt</p><strong>{patient.first} {patient.name}</strong><small>geb. {patient.birth} · Fall {patient.id}</small><p>{patient.documents.length} Vorsorgedokumente · Akte geöffnet</p></div>
    <button className="icon-button" aria-label="Benachrichtigung schließen" onClick={onClose}><Icon name="close" /></button>
    <div className="scan-toast-actions"><button className="text-button" onClick={onShowDocuments}>Dokumente anzeigen</button></div>
    <span className="scan-toast-progress" aria-hidden="true" />
  </div>;
}
