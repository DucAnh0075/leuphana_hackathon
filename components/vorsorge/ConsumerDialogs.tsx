"use client";

import { useCallback, useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { CareDocument, CareSnapshot } from "@/lib/care/types";
import { consumerError, documentTitle } from "@/lib/consumer-language";
import { Badge, LoadingState, Symbol } from "./Presentation";
import styles from "./Vorsorge.module.css";

export function Modal({ title, description, children, onClose, wide = false }: { title: string; description: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className={styles.dialogOverlay}/><Dialog.Content lang="en" className={styles.dialogContent + (wide ? " " + styles.dialogWide : "")} onOpenAutoFocus={() => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); else document.querySelector<HTMLElement>("#main h1")?.focus(); }}>
      <div className={styles.dialogHeader}><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description className={styles.dialogDescription}>{description}</Dialog.Description></div><Dialog.Close className={styles.iconButton} aria-label="Close dialog"><Symbol name="close"/></Dialog.Close></div>
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
      if (!response.ok) { setError(consumerError(result, "Your documents could not be shared. Try again.")); return; }
      onUpdated(result as CareSnapshot); onClose();
    } catch { setError("Your documents could not be shared. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <Modal title="Share documents" description="Check the person, clinic and document versions before sending." onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.summaryBox}><p><span>For</span><strong>{snapshot.person.name}</strong></p><p><span>To</span><strong>{snapshot.clinic.name}</strong></p></div>
      <div className={styles.field}><span className={styles.fieldLabel}>Documents to share</span><div className={styles.selectionList}>
        {current.map(doc => <label key={doc.id} className={styles.checkboxRow}><input type="checkbox" checked={selected.includes(doc.id)} disabled={busy} onChange={event => {
          setSelected(value => event.target.checked ? [...value, doc.id] : value.filter(id => id !== doc.id)); requestId.current = null;
        }}/><span><strong>{documentTitle(doc)}</strong><small>Version {doc.version}{snapshot.recordDocumentIds.includes(doc.id) ? " · already in record" : " · not yet confirmed in record"}</small></span></label>)}
      </div></div>
      {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/>{error}</div>}
      <small>This shares only the selected versions. Receipt and confirmation in a record do not confirm that a clinician has read or assessed them.</small>
      <div className={styles.dialogFooter}><button className={styles.button + " " + styles.secondary} type="button" onClick={onClose} disabled={busy}>Cancel</button><button className={styles.button} type="submit" disabled={busy || selected.length === 0}>{busy ? "Sending…" : "Send to clinic"}</button></div>
    </form>
  </Modal>;
}

type AssistantResult = { answer: string; sources: { documentId: string; page: number; quote: string; label: string }[]; mode: "guided"; suggestedAction?: "handoff" };
export function AssistantDialog({ query, documents, initialQuestion, documentId, onClose, onOpenDocument, onHandoff }: { query: string; documents: CareDocument[]; initialQuestion?: string; documentId?: string; onClose: () => void; onOpenDocument: (id: string, page?: number) => void; onHandoff: () => void }) {
  const [answer, setAnswer] = useState<AssistantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(initialQuestion || "");
  const started = useRef(false);
  const questions = [
    { id: "evidence", title: "Who is named in my documents?" },
    { id: "missing", title: "What happens next?" },
    { id: "receipt", title: "Which versions were received?" },
  ];
  const ask = useCallback(async (value: string) => {
    if (busy || !value.trim()) return;
    setBusy(true); setError(""); setActiveQuestion(value); setAnswer(null);
    try {
      const response = await fetch("/api/assistant" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: value.trim(), ...(documentId ? { documentId } : {}) }), signal: AbortSignal.timeout(30_000) });
      const result = await response.json();
      if (!response.ok || typeof result.answer !== "string") { setError(consumerError(result, "Help is unavailable right now. You can still open your documents.")); return; }
      setAnswer(result as AssistantResult);
    } catch { setError("Help could not be loaded. Try again or open the original document."); }
    finally { setBusy(false); }
  }, [busy, documentId, query]);
  useEffect(() => {
    if (!initialQuestion || started.current) return;
    started.current = true; void Promise.resolve().then(() => ask(initialQuestion));
  }, [initialQuestion, ask]);
  return <Modal title="Document help" description="Choose a question to check your documents or sharing status." onClose={onClose}>
    <div className={styles.questionList}>{questions.map(item => <button key={item.id} disabled={busy} aria-pressed={activeQuestion === item.id} onClick={() => void ask(item.id)}>{item.title}<Symbol name="chevron" size={15}/></button>)}</div>
    {busy && <LoadingState label="Checking documents and sharing status…"/>}
    {error && <div className={styles.notice + " " + styles.error} role="alert" style={{marginTop:18}}>{error}</div>}
    {answer && !busy && <div aria-live="polite"><div className={styles.answer}>{answer.answer}</div><div className={styles.answerSources}>
      {answer.sources.filter(source => documents.some(doc => doc.id === source.documentId)).map((source,index) => <button key={source.documentId + "-" + index} onClick={() => { onOpenDocument(source.documentId, source.page); onClose(); }}><Symbol name="document" size={17}/><span>{source.label}</span><Symbol name="external" size={13}/></button>)}
    </div>{answer.suggestedAction === "handoff" && <button className={styles.textButton} onClick={onHandoff}>Review sharing</button>}
    <p className={styles.helperFootnote}>Guided help uses your available documents and handoff records. Original documents and quotes are in German. It does not assess legal validity.</p></div>}
  </Modal>;
}

export function CardDialog({ snapshot, query, demoId, onClose, onUpdated }: { snapshot: CareSnapshot; query: string; demoId?: string; onClose: () => void; onUpdated: (snapshot: CareSnapshot) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const scanPath = "/scan?" + new URLSearchParams({ card: snapshot.card.id, ...(demoId ? { demo: demoId } : {}) }).toString();
  async function toggleCard() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "card-status", active: !snapshot.card.active }) });
      const result = await response.json();
      if (!response.ok) { setError(consumerError(result, "The card setting could not be changed. Try again.")); return; }
      onUpdated(result as CareSnapshot);
      setMessage(snapshot.card.active ? "Card link paused. New scans will not share documents." : "Card link activated.");
    } catch { setError("The card setting could not be changed. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.origin + scanPath); setMessage("Card link copied."); setError(""); }
    catch { setError("Your browser could not copy the link. Open the card link and copy its address."); }
  }
  return <Modal title="Card settings" description="Use your card link to share assigned documents. Account access is still checked." onClose={onClose}>
    <div className={styles.summaryBox}><p><span>Person</span><strong>{snapshot.person.name}</strong></p><p><span>Card link</span><Badge tone={snapshot.card.active ? "blue" : "amber"}>{snapshot.card.active ? "Active" : "Paused"}</Badge></p></div>
    {error && <div className={styles.notice + " " + styles.error} role="alert" style={{marginTop:18}}>{error}</div>}
    {message && <div className={styles.notice} role="status" style={{marginTop:18}}>{message}</div>}
    <p className={styles.helperFootnote}>A scan sends the assigned documents. The clinic must still match and confirm them in its record.</p>
    <div className={styles.buttonRow} style={{marginTop:18}}>{snapshot.card.active && <><a className={styles.button} href={scanPath}>Open card link</a><button className={styles.button + " " + styles.secondary} onClick={() => void copyLink()}>Copy link</button></>}</div>
    <p className={styles.helperFootnote}>If your card is lost, pause its link. Documents already in the clinic record will remain there.</p>
    <div className={styles.dialogFooter}><button className={styles.button + " " + (snapshot.card.active ? styles.danger : styles.secondary)} disabled={busy} onClick={() => void toggleCard()}>{busy ? "Updating…" : snapshot.card.active ? "Pause card link" : "Activate card link"}</button></div>
  </Modal>;
}