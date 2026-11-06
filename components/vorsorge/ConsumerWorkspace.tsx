"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { CareDocument, CareHandoff, CareSnapshot } from "@/lib/care/types";
import { consumerError, documentTitle, evidenceTitle, handoffStatus } from "@/lib/consumer-language";
import PdfViewer from "@/components/PdfViewer";
import { AssistantDialog, CardDialog, HandoffDialog, Modal } from "./ConsumerDialogs";
import { Badge, dateLabel, EmptyState, LoadingState, Symbol } from "./Presentation";
import ConsumerShell from "./ConsumerShell";
import styles from "./Vorsorge.module.css";

type View = "documents" | "handoffs";
type OpenDocument = { id: string; page: number; evidenceId?: string };
const statusTones: Record<CareHandoff["status"], "blue" | "amber" | "green" | "neutral"> = { received: "blue", clarification: "amber", accepted: "green", withdrawn: "neutral" };

function DocumentRow({ document, inRecord, onOpen }: { document: CareDocument; inRecord: boolean; onOpen: () => void }) {
  return <button className={styles.documentRow} onClick={onOpen}>
    <span className={styles.documentIcon}><Symbol name="document" size={22}/></span>
    <span className={styles.documentBody}><strong>{documentTitle(document)}</strong>{!document.current && <small>Version {document.version}</small>}</span>
    <span className={styles.documentEnd}><Badge tone={inRecord || !document.current ? "neutral" : "blue"}>{!document.current ? "Previous version" : inRecord ? "In record" : "Ready to share"}</Badge><Symbol name="chevron" size={17}/></span>
  </button>;
}

function HandoffReceipt({ handoff, documents, query, onUpdated, onOpenDocument, onWithdraw }: { handoff: CareHandoff; documents: CareDocument[]; query: string; onUpdated: (snapshot: CareSnapshot) => void; onOpenDocument: (id: string) => void; onWithdraw: () => void }) {
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim() || replyBusy) return;
    setReplyBusy(true); setReplyError("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "reply", handoffId: handoff.id, expectedRevision: handoff.revision, note: reply.trim() }) });
      const result = await response.json();
      if (!response.ok) { setReplyError(consumerError(result, "Your reply could not be sent. Try again.")); return; }
      onUpdated(result as CareSnapshot); setReply(""); setReplyOpen(false);
    } catch { setReplyError("Your reply could not be sent. Check your connection and try again."); }
    finally { setReplyBusy(false); }
  }
  const accepted = handoff.status === "accepted";
  return <article className={styles.handoffItem}>
    <header className={styles.handoffHeader}><span className={styles.hospitalIcon}><Symbol name="hospital" size={23}/></span><div><h2>{handoff.clinicName}</h2></div><Badge tone={statusTones[handoff.status]}>{handoffStatus[handoff.status]}</Badge></header>
    <div className={styles.handoffBody}>
      <p className={styles.receiptSummary}>{accepted ? "The clinic has confirmed these versions in your record. This does not confirm clinical review." : handoff.status === "clarification" ? "The clinic needs a reply before it can match these documents to your record." : handoff.status === "withdrawn" ? "This handoff was withdrawn. Documents already in a record remain there." : "Your documents have arrived. The clinic still needs to confirm them in your record."}</p>
      {handoff.note && <div className={styles.clinicNote}><small>{handoff.status === "clarification" ? "Clinic question · original language" : "Latest note · original language"}</small><p>{handoff.note}</p></div>}
      {handoff.status === "clarification" && !replyOpen && <button className={styles.button} onClick={() => setReplyOpen(true)}>Reply to clinic</button>}
      {handoff.status === "clarification" && replyOpen && <form className={styles.replyForm} onSubmit={sendReply}>
        <div className={styles.field}><label htmlFor={"reply-" + handoff.id}>Reply to clinic</label><textarea autoFocus id={"reply-" + handoff.id} className={styles.textarea} value={reply} onChange={event => setReply(event.target.value)} required maxLength={500} disabled={replyBusy} placeholder="Add the information the clinic asked for."/></div>
        {replyError && <div className={styles.notice + " " + styles.error} role="alert">{replyError}</div>}
        <button className={styles.button} disabled={replyBusy || !reply.trim()} type="submit">{replyBusy ? "Sending reply…" : "Send reply"}</button>
      </form>}
      <details className={styles.receiptEvents}><summary>Handoff details</summary>
        <dl className={styles.receiptDetails}><div><dt>Person</dt><dd>{handoff.personName}</dd></div><div><dt>{accepted ? "Confirmed in record" : "Last update"}</dt><dd>{dateLabel(accepted ? handoff.acceptedAt : handoff.updatedAt, true)}</dd></div><div><dt>Shared through</dt><dd>{handoff.source === "card" ? "Card link" : "Your workspace"}</dd></div></dl>
        <div className={styles.receiptDocuments}>{handoff.documentIds.map(id => {
          const doc = documents.find(item => item.id === id);
          return doc ? <button className={styles.textButton} key={id} onClick={() => onOpenDocument(id)}><Symbol name="document" size={15}/>{documentTitle(doc)} · Version {doc.version}</button> : <span key={id}>Document version unavailable</span>;
        })}</div>
        <details><summary>Original activity log</summary><ol lang="de">{handoff.events.map(event => <li key={event.id}><strong>{event.label}</strong><small>{dateLabel(event.at, true)} · {event.actor}</small></li>)}</ol><small>Handoff ID: {handoff.id}</small><small>Person ID: {handoff.personId}</small></details>
        {(handoff.status === "received" || handoff.status === "clarification") && <button className={styles.textButton} onClick={onWithdraw}>Withdraw handoff</button>}
      </details>
    </div>
  </article>;
}

export default function ConsumerWorkspace({ demoId, initialView = "documents" }: { demoId?: string; initialView?: View }) {
  const [snapshot, setSnapshot] = useState<CareSnapshot | null>(null);
  const [view, setView] = useState<View>(initialView);
  const [opened, setOpened] = useState<OpenDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [assistant, setAssistant] = useState<string | null>(null);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStates = useRef<Record<string,string>>({});
  const snapshotTime = useRef(0);
  const applySnapshot = useCallback((next: CareSnapshot) => {
    const incomingTime = Date.parse(next.updatedAt);
    if (Number.isFinite(incomingTime) && incomingTime < snapshotTime.current) return;
    if (Number.isFinite(incomingTime)) snapshotTime.current = incomingTime;
    setSnapshot(next);
  }, []);
  const query = demoId ? "?" + new URLSearchParams({ demo: demoId, role: "owner" }).toString() : "";
  const clinicHref = "/klinik" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const loginHref = "/anmelden?next=" + encodeURIComponent("/vorsorge?view=" + view);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/care" + query, { cache: "no-store", signal });
      const result = await response.json();
      if (response.status === 410 && demoId) {
        setSessionExpired(true); setSnapshot(null);
        setError("This sample workspace has expired. Open a new sample workspace."); return;
      }
      if (response.status === 401 && !demoId) {
        window.location.replace("/anmelden?next=" + encodeURIComponent("/vorsorge?view=" + initialView)); return;
      }
      if (!response.ok) { setError(consumerError(result, "Your documents could not be loaded. Try again.")); return; }
      const data = result as CareSnapshot;
      if (data.mode === "supabase" && data.actor.role === "clinic") { window.location.replace(new URL("/klinik", window.location.origin).href); return; }
      if (Date.parse(data.updatedAt) < snapshotTime.current) return;
      for (const handoff of data.handoffs) {
        if (previousStates.current[handoff.id] && previousStates.current[handoff.id] !== handoff.status) {
          if (handoff.status === "accepted") setNotice(handoff.clinicName + " confirmed your documents in the record.");
          if (handoff.status === "clarification") setNotice(handoff.clinicName + " needs a reply about your handoff.");
        }
      }
      previousStates.current = Object.fromEntries(data.handoffs.map(item => [item.id,item.status]));
      applySnapshot(data); setError("");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError("Connection lost. Check your connection and reload.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [query, demoId, initialView, applySnapshot]);
  useEffect(() => {
    if (sessionExpired) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => refresh(controller.signal));
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 3000);
    const onFocus = () => void refresh(controller.signal);
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refresh, sessionExpired]);

  function openDocument(id: string, page = 1, evidenceId?: string) {
    setView("documents"); setOpened({ id, page, evidenceId });
    window.setTimeout(() => heading.current?.focus(), 0);
  }
  function onHandoffCreated(next: CareSnapshot) {
    applySnapshot(next); setView("handoffs"); setOpened(null);
    setNotice("Your documents have been received. Confirmation in the clinic record is still pending.");
  }
  async function logout() {
    if (demoId) { window.location.replace(new URL("/vorsorge", window.location.origin).href); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      const result = await response.json();
      if (!response.ok) { setError(consumerError(result, "You could not be logged out. Try again.")); setBusy(false); return; }
      setSnapshot(null); window.location.replace(new URL("/anmelden", window.location.origin).href);
    } catch { setError("You could not be logged out. Check your connection and try again."); setBusy(false); }
  }
  async function withdrawHandoff() {
    const handoff = snapshot?.handoffs.find(item => item.id === withdrawId);
    if (!handoff) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "withdraw", handoffId: handoff.id, expectedRevision: handoff.revision }) });
      const result = await response.json();
      if (!response.ok) { setError(consumerError(result, "The handoff could not be withdrawn. Reload and try again.")); return; }
      applySnapshot(result as CareSnapshot); setNotice("The handoff was withdrawn.");
    } catch { setError("The handoff could not be withdrawn. Check your connection and try again."); }
    finally { setWithdrawId(null); setBusy(false); }
  }
  const currentDocs = snapshot?.documents.filter(doc => doc.current) ?? [];
  const oldDocs = snapshot?.documents.filter(doc => !doc.current) ?? [];
  const handoffs = [...(snapshot?.handoffs ?? [])].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const selectedDocument = opened ? snapshot?.documents.find(doc => doc.id === opened.id) : undefined;
  const selectedEvidence = selectedDocument?.evidence.find(item => item.id === opened?.evidenceId);

  return <ConsumerShell active={view} demoId={demoId} title="Your document space" headerAction={<button className={styles.textButton} disabled={busy} onClick={() => void logout()}>{demoId ? "Leave sample" : "Log out"}</button>} helpTitle={view === "documents" ? "Help with your documents" : "Help with sharing"} helpContent={<div className={styles.questionList}>{[{id:"evidence",title:"Who is named in my documents?"},{id:"missing",title:"What happens next?"},{id:"receipt",title:"Which versions were received?"}].map(item => <button key={item.id} disabled={!snapshot} onClick={() => setAssistant(item.id)}>{item.title}</button>)}</div>}>
    <main id="main" className={styles.shell + " " + styles.workspace}>
      {loading && !snapshot ? <LoadingState/> : <>
        {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}{snapshot && " Showing the last loaded information."} {sessionExpired ? <a className={styles.textButton} href={loginHref}>Open a new sample workspace</a> : <button className={styles.textButton} onClick={() => void refresh()}>Reload</button>}</span></div>}
        {notice && <div className={styles.notice} role="status"><Symbol name="check" size={18}/><span>{notice}</span><button className={styles.iconButton} aria-label="Dismiss message" onClick={() => setNotice("")}><Symbol name="close" size={15}/></button></div>}
        {!snapshot ? <EmptyState title={sessionExpired ? "This sample workspace has expired" : "Your documents are not available yet"}>{sessionExpired ? "Start a fresh sample workspace to continue." : "Log in or open a sample workspace to see documents."} <a href={loginHref} className={styles.textButton}>Log in or open sample</a></EmptyState> : <>
          {!selectedDocument && <div className={styles.pageHeading}><div><h1 ref={heading} tabIndex={-1}>{view === "documents" ? "Documents" : "Sharing"}</h1><p>{view === "documents" ? "Your current documents, ready when you need them." : "See what the clinic has received and what needs your attention."}</p></div><button className={styles.button} onClick={() => setHandoffOpen(true)}>Share documents</button></div>}
          {view === "documents" && !selectedDocument && <>
            {currentDocs.length ? <div className={styles.documentList}>{currentDocs.map(doc => <DocumentRow key={doc.id} document={doc} inRecord={snapshot.recordDocumentIds.includes(doc.id)} onOpen={() => openDocument(doc.id)}/>)}</div> : <EmptyState title="No current documents">Your existing documents will appear here when available. You can return to Your plan to prepare a planning draft.</EmptyState>}
            <p className={styles.helperFootnote}>Original documents are in German.</p>
            {oldDocs.length > 0 && <details className={styles.previousVersions}><summary>Previous versions</summary><div className={styles.documentList}>{oldDocs.map(doc => <DocumentRow key={doc.id} document={doc} inRecord={snapshot.recordDocumentIds.includes(doc.id)} onOpen={() => openDocument(doc.id)}/>)}</div></details>}
          </>}
          {view === "documents" && selectedDocument && <>
            <button className={styles.textButton} style={{marginBottom:15}} onClick={() => setOpened(null)}>Back to documents</button>
            <div className={styles.documentDetailTop}><div><h1 ref={heading} tabIndex={-1}>{documentTitle(selectedDocument)}</h1><p className={styles.meta}>Version {selectedDocument.version} · {dateLabel(selectedDocument.date)} · {selectedDocument.pageCount} {selectedDocument.pageCount === 1 ? "page" : "pages"}</p></div><Badge tone={selectedDocument.current ? "blue" : "neutral"}>{selectedDocument.current ? "Current version" : "Previous version"}</Badge></div>
            <p className={styles.originalNote}>Original documents are in German.</p>
            <div className={styles.documentSplit}><div className={styles.viewer}><PdfViewer locale="en" key={selectedDocument.id + ":" + opened?.page + ":" + opened?.evidenceId} doc={{ title: documentTitle(selectedDocument), url: selectedDocument.fileUrl }} initialPage={opened?.page || 1} evidenceId={selectedEvidence?.id} sourceSection={selectedEvidence?.section} sourceQuote={selectedEvidence?.quote} sourceCondition={selectedEvidence?.condition} sourceExclusions={selectedEvidence?.exclusions} sourcePerson={selectedEvidence?.person} provenance={selectedDocument.provenance}/></div>
              <aside className={styles.evidenceList} aria-label="Original document evidence">{selectedDocument.evidence.length ? selectedDocument.evidence.map(item => <details key={item.id} className={styles.evidence} open={selectedEvidence?.id === item.id || undefined}><summary>{evidenceTitle(item)}</summary><div lang="de"><h3>{item.label}</h3><p>{item.value}</p></div><details className={styles.evidenceDetails}><summary>Scope and source</summary><p><b>Condition:</b> <span lang="de">{item.condition}</span></p>{item.exclusions.length > 0 && <p><b>Exclusions:</b> <span lang="de">{item.exclusions.join(" ")}</span></p>}<blockquote lang="de">{item.quote}</blockquote><button className={styles.textButton} onClick={() => openDocument(selectedDocument.id,item.page,item.id)}>Open source on page {item.page}</button></details></details>) : <p className={styles.helperFootnote}>No individual source passages are available for this version. Read the original document.</p>}</aside>
            </div>
          </>}
          {view === "handoffs" && <><div className={styles.handoffList}>{handoffs.length ? handoffs.map(handoff => <HandoffReceipt key={handoff.id} handoff={handoff} documents={snapshot.documents} query={query} onUpdated={next => { applySnapshot(next); setNotice("Your reply was received. The clinic will check the handoff again."); }} onOpenDocument={id => openDocument(id)} onWithdraw={() => setWithdrawId(handoff.id)}/>) : <EmptyState title="No documents shared yet" icon="transfer">Choose Share documents to send selected versions to your clinic.</EmptyState>}</div><div className={styles.sharingTools}><button className={styles.textButton} onClick={() => setCardOpen(true)}>Card settings</button>{demoId && <a className={styles.textButton} href={clinicHref} target="_blank" rel="noopener noreferrer">Open clinic demo<Symbol name="external" size={14}/></a>}</div></>}
        </>}
      </>}

    </main>
    {snapshot && handoffOpen && <HandoffDialog snapshot={snapshot} query={query} onClose={() => setHandoffOpen(false)} onUpdated={onHandoffCreated}/>}
    {snapshot && cardOpen && <CardDialog snapshot={snapshot} query={query} demoId={demoId} onClose={() => setCardOpen(false)} onUpdated={applySnapshot}/>}
    {snapshot && assistant !== null && <AssistantDialog query={query} documents={snapshot.documents} documentId={selectedDocument?.id} initialQuestion={assistant} onClose={() => setAssistant(null)} onOpenDocument={openDocument} onHandoff={() => { setAssistant(null); setHandoffOpen(true); }}/>}
    {withdrawId && <Modal title="Withdraw this handoff?" description="This ends the pending handoff. Documents already in a clinic record will remain there." onClose={() => setWithdrawId(null)}><div className={styles.dialogFooter}><button className={styles.button + " " + styles.secondary} disabled={busy} onClick={() => setWithdrawId(null)}>Keep handoff</button><button className={styles.button + " " + styles.danger} disabled={busy} onClick={() => void withdrawHandoff()}>{busy ? "Withdrawing…" : "Withdraw handoff"}</button></div></Modal>}
  </ConsumerShell>;
}