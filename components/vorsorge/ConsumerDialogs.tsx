"use client";

import { useCallback, useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { CareDocument, CareSnapshot } from "@/lib/care/types";
import { Badge, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

export function Modal({ title, description, children, onClose, wide = false }: { title: string; description: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className={styles.dialogOverlay}/><Dialog.Content className={styles.dialogContent + (wide ? " " + styles.dialogWide : "")} onOpenAutoFocus={() => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); else document.querySelector<HTMLElement>("#main h1")?.focus(); }}>
      <div className={styles.dialogHeader}><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description className={styles.dialogDescription}>{description}</Dialog.Description></div><Dialog.Close className={styles.iconButton} aria-label="Dialog schließen"><Symbol name="close"/></Dialog.Close></div>
      {children}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}

export function HandoffDialog({ snapshot, query, onClose, onUpdated }: { snapshot: CareSnapshot; query: string; onClose: () => void; onUpdated: (snapshot: CareSnapshot) => void }) {
  const current = snapshot.documents.filter(doc => doc.current);
  const pending = current.filter(doc => !snapshot.recordDocumentIds.includes(doc.id));
  const [selected, setSelected] = useState<string[]>((pending.length ? pending : current).map(doc => doc.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length || busy) return;
    setBusy(true); setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "handoff", documentIds: selected, recipientId: snapshot.clinic.id, requestId: requestId.current }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Die Übergabe konnte nicht gestartet werden.");
      onUpdated(result as CareSnapshot); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Die Übergabe konnte nicht gestartet werden."); }
    finally { setBusy(false); }
  }

  return <Modal title="Unterlagen an die Klinik übergeben" description="Prüfe die Person, den Empfänger und die ausgewählten Fassungen. Die Klinik bestätigt anschließend die Zuordnung zur Akte." onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.summaryBox}><p><span>Für</span><strong>{snapshot.person.name}</strong></p><p><span>Empfänger</span><strong>{snapshot.clinic.name}</strong></p></div>
      <div className={styles.field}><span className={styles.fieldLabel}>Welche Dokumente möchtest du bereitstellen?</span><div className={styles.selectionList}>
        {current.map(doc => <label key={doc.id} className={styles.checkboxRow}><input type="checkbox" checked={selected.includes(doc.id)} disabled={busy} onChange={event => {
          setSelected(value => event.target.checked ? [...value, doc.id] : value.filter(id => id !== doc.id));
          requestId.current = null;
        }}/><span><strong>{doc.title}</strong><small>Fassung {doc.version}{snapshot.recordDocumentIds.includes(doc.id) ? " · bereits in der Demoakte" : " · noch nicht in der Akte bestätigt"}</small></span></label>)}
      </div></div>
      {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/>{error}</div>}
      <small>Die Freigabe gilt für diese Dokumentauswahl. Eine technische Übernahme bestätigt nicht, dass das Behandlungsteam die Unterlagen bereits gelesen oder bewertet hat.</small>
      <div className={styles.dialogFooter}><button className={styles.button + " " + styles.secondary} type="button" onClick={onClose} disabled={busy}>Abbrechen</button><button className={styles.button} type="submit" disabled={busy || selected.length === 0}>{busy ? "Wird bereitgestellt …" : "An Klinik übergeben"}<Symbol name="transfer" size={17}/></button></div>
    </form>
  </Modal>;
}

type AssistantResult = { answer: string; sources: { documentId: string; page: number; quote: string; label: string }[]; mode: "guided" | "model"; suggestedAction?: "handoff" };
export function AssistantDialog({ query, documents, initialQuestion, documentId, onClose, onOpenDocument, onHandoff }: { query: string; documents: CareDocument[]; initialQuestion?: string; documentId?: string; onClose: () => void; onOpenDocument: (id: string, page?: number) => void; onHandoff: () => void }) {
  const [answer, setAnswer] = useState<AssistantResult | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(initialQuestion || "");
  const started = useRef(false);
  const questions = [
    { id: "evidence", title: "Wo steht, wer benannt ist?" },
    { id: "missing", title: "Was fehlt als nächstes?" },
    { id: "receipt", title: "Welche Fassung ist angekommen?" },
  ];

  const ask = useCallback(async (value: string) => {
    if (busy || !value.trim()) return;
    setBusy(true); setError(""); setActiveQuestion(value);
    try {
      const response = await fetch("/api/assistant" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: value.trim(), ...(documentId ? { documentId } : {}) }), signal: AbortSignal.timeout(30_000) });
      const result = await response.json();
      if (!response.ok || typeof result.answer !== "string") throw new Error(result.error || "Die Hilfe ist gerade nicht erreichbar. Deine Dokumente bleiben direkt zugänglich.");
      setAnswer(result as AssistantResult);
    } catch (cause) { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "Die Antwort dauert zu lange. Öffne die Unterlagen direkt oder versuche es erneut."); }
    finally { setBusy(false); }
  }, [busy, documentId, query]);

  useEffect(() => {
    if (!initialQuestion || started.current) return;
    started.current = true;
    void Promise.resolve().then(() => ask(initialQuestion));
  }, [initialQuestion, ask]);

  return <Modal title="Unterstützung bei deiner Vorsorge" description="Stelle eine Frage zu deinen hinterlegten Unterlagen oder zum Stand einer Übergabe." onClose={onClose}>
    <div className={styles.questionList}>{questions.map(item => <button key={item.id} disabled={busy} aria-pressed={activeQuestion === item.id} onClick={() => void ask(item.id)}>{item.title}<Symbol name="chevron" size={15}/></button>)}</div>
    <form className={styles.form} style={{marginTop:18}} onSubmit={event => { event.preventDefault(); void ask(question); }}>
      <div className={styles.field}><label htmlFor="care-question">Deine Frage</label><textarea id="care-question" className={styles.textarea} maxLength={800} placeholder="Zum Beispiel: Welche Einschränkungen stehen in meiner Vollmacht?" value={question} onChange={event => setQuestion(event.target.value)} disabled={busy}/></div>
      <button className={styles.button + " " + styles.secondary} type="submit" disabled={busy || !question.trim()}>{busy ? "Wird abgeglichen …" : "Frage stellen"}<Symbol name="help" size={17}/></button>
    </form>
    {busy && <LoadingState label="Unterlagen und Übergabestand werden abgeglichen …"/>}
    {error && <div className={styles.notice + " " + styles.error} role="alert" style={{marginTop:18}}>{error}</div>}
    {answer && !busy && <div aria-live="polite"><div className={styles.answer}>{answer.answer}</div><div className={styles.answerSources}>
      {answer.sources.filter(source => documents.some(doc => doc.id === source.documentId)).map((source,index) => <button key={source.documentId + "-" + index} onClick={() => { onOpenDocument(source.documentId, source.page); onClose(); }}><Symbol name="document" size={17}/><span>{source.label}</span><Symbol name="external" size={13}/></button>)}
    </div>{answer.suggestedAction === "handoff" && <button className={styles.textButton} onClick={onHandoff}>Übergabe prüfen<Symbol name="arrow" size={16}/></button>}
    <p className={styles.helperFootnote}>{answer.mode === "model" ? "KI-gestützte Unterstützung mit Dokumentbelegen." : "Geführte Hilfe auf Basis deiner Dokumente und Vorgangsdaten."} Maßgeblich bleibt das Original; die Hilfe bestätigt keine rechtliche Wirksamkeit.</p></div>}
  </Modal>;
}

export function CardDialog({ snapshot, query, demoId, onClose, onUpdated }: { snapshot: CareSnapshot; query: string; demoId?: string; onClose: () => void; onUpdated: (snapshot: CareSnapshot) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const scanParams = new URLSearchParams({ card: snapshot.card.id, ...(demoId ? { demo: demoId } : {}) });
  const scanPath = "/scan?" + scanParams.toString();
  async function toggleCard() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "card-status", active: !snapshot.card.active }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Der Kartenstatus konnte nicht geändert werden.");
      onUpdated(result as CareSnapshot);
      setMessage(snapshot.card.active ? "Der Kartenverweis ist gesperrt. Neue Scans lösen keine Übergabe aus." : "Der Kartenverweis ist wieder aktiv.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Der Kartenstatus konnte nicht geändert werden."); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.origin + scanPath); setMessage("Kartenlink kopiert."); setError(""); }
    catch { setError("Der Browser erlaubt das Kopieren nicht. Öffne den Kartenlink und kopiere die Adresse."); }
  }
  return <Modal title="Deine Vorsorgekarte" description="Die Karte löst den Abruf zugeordneter Unterlagen aus. Deine Anmeldung und die Zugriffsrechte werden weiterhin geprüft." onClose={onClose}>
    <div className={styles.summaryBox}><p><span>Person</span><strong>{snapshot.person.name}</strong></p><p><span>Karte</span><Badge tone={snapshot.card.active ? "blue" : "amber"}>{snapshot.card.active ? "Aktiver Verweis" : "Gesperrt"}</Badge></p></div>
    {error && <div className={styles.notice + " " + styles.error} role="alert" style={{marginTop:18}}>{error}</div>}
    {message && <div className={styles.notice} role="status" style={{marginTop:18}}>{message}</div>}
    <p className={styles.helperFootnote}>Ein Scan meldet der Klinik einen Dokumenteneingang. Erst die Zuordnung und Bestätigung im Kliniksystem schließen die Übergabe ab.</p>
    <div className={styles.buttonRow} style={{marginTop:18}}>
      {snapshot.card.active && <><a className={styles.button} href={scanPath}>Kartenlink öffnen<Symbol name="phone" size={17}/></a><button className={styles.button + " " + styles.secondary} onClick={() => void copyLink()}><Symbol name="copy" size={17}/>Link kopieren</button></>}
    </div>
    <p className={styles.helperFootnote}>Bei Kartenverlust kannst du den Verweis sperren. Bereits übernommene Dokumente bleiben in der Klinikakte erhalten.</p>
    <div className={styles.dialogFooter}><button className={styles.button + " " + (snapshot.card.active ? styles.danger : styles.secondary)} disabled={busy} onClick={() => void toggleCard()}>{busy ? "Wird geändert …" : snapshot.card.active ? "Kartenverweis sperren" : "Kartenverweis aktivieren"}</button></div>
  </Modal>;
}
