"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KisWorkspace from "@/components/KisWorkspace";
import type { CareHandoff, CareSnapshot } from "@/lib/care/types";
import { useCardReader } from "@/hooks/useCardReader";
import styles from "./ClinicalCareWorkspace.module.css";

type Props = { demoId?: string; initialPatientId?: string; initialDocumentId?: string; initialEvidenceId?: string; initialPage?: number };
const labels = { received: "Eingegangen", clarification: "Klärung erforderlich", accepted: "In der Akte bestätigt", withdrawn: "Zurückgezogen" };

export default function ClinicalCareWorkspace(props: Props) {
  const { demoId } = props;
  const router = useRouter();
  const requestEpoch = useRef(0);
  const query = demoId ? "?demo=" + encodeURIComponent(demoId) + "&role=clinic" : "";
  const basePath = "/klinik" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const [snapshot, setSnapshot] = useState<CareSnapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState("");
  const seen = useRef(new Set<string>());
  const pollRunning = useRef(false);

  const refresh = useCallback(async () => {
    if (pollRunning.current) return;
    pollRunning.current = true;
    const epoch = requestEpoch.current;
    try {
      const response = await fetch("/api/care" + query, { cache: "no-store" });
      const data = await response.json();
      if (epoch !== requestEpoch.current) return;
      if (response.status === 401) {
        router.replace("/anmelden?next=" + encodeURIComponent(basePath));
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Der Dokumenteneingang ist nicht erreichbar.");
      if (data.actor.role !== "clinic") throw new Error("Dieses Konto hat keinen klinischen Zugang. Bitte die persönliche Vorsorgeansicht verwenden.");
      const next = data as CareSnapshot;
      const fresh = next.handoffs.find(item => !seen.current.has(item.id) && item.status === "received");
      next.handoffs.forEach(item => seen.current.add(item.id));
      if (fresh) setNotification(fresh.id);
      setSnapshot(next);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Verbindung unterbrochen."); }
    finally { pollRunning.current = false; }
  }, [query, basePath, router]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 3000);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [refresh]);
  const { status } = useCardReader({ onCard: () => { void refresh(); }, enabled: !demoId });

  async function decide(item: CareHandoff, type: "accept" | "clarify") {
    if (type === "accept" && !matched[item.id]) return;
    requestEpoch.current += 1;
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/care/actions" + query, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, handoffId: item.id, expectedRevision: item.revision, note: notes[item.id] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Die Rückmeldung konnte nicht gespeichert werden.");
      requestEpoch.current += 1;
      setSnapshot(data);
      if (notification === item.id) setNotification("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Rückmeldung fehlgeschlagen."); }
    finally { setBusy(""); }
  }
  async function simulateScan() {
    if (!snapshot) return;
    setBusy("scan"); setError("");
    try {
      const response = await fetch("/api/scan" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ card: snapshot.card.id, requestId: crypto.randomUUID() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Das Kartenereignis wurde nicht angenommen.");
      await refresh();
      setExpanded(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kartenereignis fehlgeschlagen."); }
    finally { setBusy(""); }
  }
  async function logout() {
    setBusy("logout"); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Die Abmeldung konnte nicht abgeschlossen werden.");
      setSnapshot(null);
      window.location.replace(new URL("/anmelden", window.location.origin).href);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Abmeldung fehlgeschlagen."); setBusy(""); }
  }
  if (!snapshot) return <main id="main" className={styles.loading}><h1>Vorsorgeeingang</h1><p role={error ? "alert" : "status"}>{error || "Verbindung zum Dokumenteneingang wird hergestellt …"}</p><Link href="/anmelden">Anmelden oder synthetische Demo öffnen</Link><Link href="/">Öffentliche KIS-Ansicht</Link></main>;

  const pending = snapshot.handoffs.filter(item => item.status === "received" || item.status === "clarification");
  const newest = snapshot.handoffs.find(item => item.id === notification && item.status === "received");
  const latestReceipt = snapshot.handoffs.find(item => item.status === "accepted");
  const viewUrl = "/vorsorge" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const panel = <section aria-label="Vorsorgeeingang" className={styles.integration}>
    <div className={styles.bar}>
      <strong>Externe Vorsorgedokumentation</strong>
      <span className={styles.mode}>{snapshot.mode === "demo" ? "Synthetische Sitzungsdemo" : "Angemeldeter Klinikzugang"}</span>
      <span>{snapshot.actor.name}</span><span className={styles.spacer} />
      {demoId ? <a href={viewUrl} target="_blank" rel="noopener noreferrer">Persönliche Ansicht öffnen</a> : <button className={styles.button} disabled={busy !== ""} onClick={() => void logout()}>Abmelden</button>}
      <button className={styles.button} onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? "Eingang einklappen" : "Eingang anzeigen"} ({pending.length})</button>
    </div>
    {newest && <div role="status" className={styles.notification}><strong>Neue Vorsorgedokumente</strong><p>{newest.personName}: {newest.documentIds.length} Dokumente eingegangen. Fallzuordnung und Aktenübernahme stehen aus.</p><button className={styles.button} onClick={() => { setExpanded(true); setNotification(""); }}>Eingang prüfen</button></div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {expanded && <div className={styles.body}>
      {snapshot.handoffs.length === 0 ? <p className={styles.empty}>Noch kein neuer Eingang. Nach einer Freigabe oder einem berechtigten Kartenereignis erscheinen hier die Dokumente.</p> :
        <div className={styles.scroll}><table className={styles.table}><thead><tr><th>Patient / Zielakte</th><th>Eingang</th><th>Dokumentfassungen</th><th>Zuordnung und Rückmeldung</th></tr></thead><tbody>{snapshot.handoffs.map(item => <tr key={item.id}>
          <td><strong>{item.personName}</strong><small>Fall {item.personId}</small><small>{item.clinicName}</small></td>
          <td>{new Date(item.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}<small>{item.source === "card" ? "Kartenereignis" : "Persönliche Freigabe"}</small></td>
          <td>{item.documentIds.map(id => { const doc = snapshot.documents.find(value => value.id === id); return doc ? <div key={id}><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">{doc.title} · Fassung {doc.version}</a><small>{doc.pageCount} Seiten · PDF prüfen</small></div> : <p key={id}>Dokument derzeit nicht abrufbar</p>; })}</td>
          <td><span className={styles.status + " " + (item.status === "accepted" ? styles.accepted : item.status === "clarification" ? styles.clarification : "")}>{labels[item.status]}</span>{item.note && <p className={styles.hint}>{item.note}</p>}
          {(item.status === "received" || item.status === "clarification") && <>
            <label><input type="checkbox" checked={matched[item.id] ?? false} onChange={event => setMatched(current => ({ ...current, [item.id]: event.target.checked }))} />Fallzuordnung für {item.personName} bestätigen</label>
            <input className={styles.note} aria-label={"Rückfrage für " + item.personName} placeholder="Rückfrage zur Zuordnung …" value={notes[item.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} />
            <div className={styles.actions}><button className={styles.button + " " + styles.primary} disabled={!matched[item.id] || busy !== ""} onClick={() => void decide(item, "accept")}>Übernahme bestätigen</button><button className={styles.button} disabled={!(notes[item.id] ?? "").trim() || busy !== ""} onClick={() => void decide(item, "clarify")}>Klärung anfordern</button></div>
          </>}{item.acceptedAt && <small>Bestätigt am {new Date(item.acceptedAt).toLocaleString("de-DE")}</small>}</td>
        </tr>)}</tbody></table></div>}
      <p className={styles.hint}>Aktenübernahme bestätigt die Ablage dieser Fassung. Sie bestätigt weder ärztliches Lesen noch die Anwendbarkeit auf eine Behandlung.</p>
    </div>}
    {latestReceipt && <div className={styles.receipt}><strong>Aktenstand aktualisiert</strong><span>{latestReceipt.personName}: Die bestätigten Fassungen und ihre Belegstellen sind in der Patientenakte verfügbar.</span></div>}
    {demoId ? <details className={styles.controls}><summary>Demo-Steuerung und Handy-Verbindung</summary><div><button className={styles.button} disabled={busy !== "" || !snapshot.card.active} onClick={() => void simulateScan()}>{busy === "scan" ? "Ereignis wird gesendet …" : "Kartenereignis simulieren"}</button><a href={"/scan?demo=" + encodeURIComponent(demoId) + "&card=" + encodeURIComponent(snapshot.card.id)} target="_blank" rel="noopener noreferrer">Scan-Seite öffnen</a><span>Öffentliche synthetische Daten. Sitzung endet beim Serverneustart.</span></div></details> : <p className={styles.hint}>Scan-Verbindung: {status === "connected" ? "Realtime verbunden" : "Regelmäßiger Abgleich aktiv"}</p>}
  </section>;
  return <KisWorkspace {...props} initialPatientId={props.initialPatientId ?? snapshot.person.id} careState={snapshot} integrationPanel={panel} basePath={basePath} />;
}
