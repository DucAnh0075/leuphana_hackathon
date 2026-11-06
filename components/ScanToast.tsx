"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icons";

type Scan = { patient: { id: string; first: string; name: string; birth: string; documents: unknown[] }; at: number; source: "supabase" | "lokal" };

export default function ScanToast({ scan, unknownCard, onShowDocuments, onClose }: { scan: Scan | null; unknownCard?: string | null; onShowDocuments: () => void; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  const at = scan?.at;
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (at === undefined && !unknownCard) return;
    const timer = window.setTimeout(() => onCloseRef.current(), 8000);
    return () => window.clearTimeout(timer);
  }, [at, unknownCard]);
  if (unknownCard) return <div className="scan-toast" role="status" aria-live="polite"><p>Unbekannte Karte „{unknownCard}“</p><button className="icon-button" aria-label="Benachrichtigung schließen" onClick={onClose}><Icon name="close" /></button></div>;
  if (!scan) return null;
  const { patient } = scan;
  return <div className="scan-toast" role="status" aria-live="polite" key={scan.at}>
    <Icon name="document" />
    <div className="scan-toast-content"><p className="scan-toast-title">NFC-Notfallkarte erkannt</p><strong>{patient.first} {patient.name}</strong><small>geb. {patient.birth} · Fall {patient.id}</small><p>{patient.documents.length} {patient.documents.length === 1 ? "Vorsorgedokument" : "Vorsorgedokumente"} · {scan.source === "supabase" ? "aus Supabase" : "lokale Demodaten"}</p></div>
    <button className="icon-button" aria-label="Benachrichtigung schließen" onClick={onClose}><Icon name="close" /></button>
    <div className="scan-toast-actions"><button className="text-button" onClick={onShowDocuments}>Dokumente anzeigen</button></div>
  </div>;
}
