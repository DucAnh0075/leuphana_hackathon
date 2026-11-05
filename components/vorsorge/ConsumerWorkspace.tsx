"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { CareDocument, CareEvidence, CareHandoff, CareSnapshot } from "@/lib/care/types";
import PdfViewer from "@/components/PdfViewer";
import { AssistantDialog, CardDialog, HandoffDialog, Modal } from "./ConsumerDialogs";
import { Badge, Brand, dateLabel, EmptyState, LoadingState, Symbol, type SymbolName } from "./Presentation";
import styles from "./Vorsorge.module.css";

type View = "overview" | "documents" | "handoffs";
type OpenDocument = { id: string; page: number; evidenceId?: string };
const navigation: { id: View; label: string; icon: SymbolName }[] = [
  { id: "overview", label: "Übersicht", icon: "home" },
  { id: "documents", label: "Dokumente", icon: "document" },
  { id: "handoffs", label: "Übergaben", icon: "transfer" },
];
const statusLabels: Record<CareHandoff["status"], string> = { received: "Eingegangen", clarification: "Klärung erforderlich", accepted: "In der Akte bestätigt", withdrawn: "Zurückgezogen" };
const statusTones: Record<CareHandoff["status"], "blue" | "amber" | "green" | "neutral"> = { received: "blue", clarification: "amber", accepted: "green", withdrawn: "neutral" };

function DocumentRow({ document, inRecord, onOpen }: { document: CareDocument; inRecord: boolean; onOpen: () => void }) {
  return <button className={styles.documentRow} onClick={onOpen}>
    <span className={styles.documentIcon} data-kind={document.kind}><Symbol name="document" size={23}/></span>
    <span className={styles.documentBody}><strong>{document.title}</strong><small>Fassung {document.version} · {dateLabel(document.date)} · {document.pageCount} {document.pageCount === 1 ? "Seite" : "Seiten"}</small></span>
    <span className={styles.documentEnd}><Badge tone={inRecord || !document.current ? "neutral" : "blue"}>{!document.current ? "Frühere Fassung" : inRecord ? "In der Akte" : "Zur Übergabe bereit"}</Badge><Symbol name="chevron" size={17}/></span>
  </button>;
}

function HandoffReceipt({ handoff, documents, query, onUpdated, onOpenDocument, onWithdraw }: { handoff: CareHandoff; documents: CareDocument[]; query: string; onUpdated: (snapshot: CareSnapshot) => void; onOpenDocument: (id: string) => void; onWithdraw: () => void }) {
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");
  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim() || replyBusy) return;
    setReplyBusy(true); setReplyError("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "reply", handoffId: handoff.id, expectedRevision: handoff.revision, note: reply.trim() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Deine Antwort konnte nicht gesendet werden.");
      onUpdated(result as CareSnapshot); setReply("");
    } catch (cause) { setReplyError(cause instanceof Error ? cause.message : "Deine Antwort konnte nicht gesendet werden."); }
    finally { setReplyBusy(false); }
  }

  const accepted = handoff.status === "accepted";
  const steps = ["Bereitgestellt", "Eingegangen", "Fallzuordnung", "In der Akte"];
  return <article className={styles.handoffItem}>
    <header className={styles.handoffHeader}><span className={styles.hospitalIcon}><Symbol name="hospital" size={24}/></span><div><h2>{handoff.clinicName}</h2><small>{dateLabel(handoff.createdAt, true)} · {handoff.source === "card" ? "Über Kartenkontakt" : "Über die Vorsorge-App"}</small></div><Badge tone={statusTones[handoff.status]}>{statusLabels[handoff.status]}</Badge></header>
    <div className={styles.handoffBody}>
      <ol className={styles.steps} aria-label="Stand der Übergabe">{steps.map((step,index) => <li key={step} data-complete={handoff.status !== "withdrawn" && (accepted || index < 2)} data-current={!accepted && handoff.status !== "withdrawn" && index === 2}><strong>{step}</strong></li>)}</ol>
      {handoff.note && <div className={styles.notice + (handoff.status === "clarification" ? " " + styles.warning : "")}><Symbol name="help" size={18}/><span>{handoff.note}</span></div>}

      {handoff.status === "clarification" && <form className={styles.replyForm} onSubmit={sendReply}>
        <div className={styles.field}><label htmlFor={"reply-" + handoff.id}>Antwort auf die Rückfrage</label><textarea id={"reply-" + handoff.id} className={styles.textarea} value={reply} onChange={event => setReply(event.target.value)} required maxLength={500} disabled={replyBusy} placeholder="Ergänze die Angaben, die für die Zuordnung fehlen."/></div>
        {replyError && <div className={styles.notice + " " + styles.error} role="alert">{replyError}</div>}
        <button className={styles.button + " " + styles.secondary} disabled={replyBusy || !reply.trim()} type="submit">{replyBusy ? "Antwort wird gesendet …" : "Antwort an Klinik senden"}<Symbol name="arrow" size={16}/></button>
      </form>}
      <dl className={styles.receiptDetails}><div><dt>Person und Fall</dt><dd>{handoff.personName} · {handoff.personId}</dd></div><div><dt>{accepted ? "Aktenübernahme bestätigt" : "Letzte Rückmeldung"}</dt><dd>{dateLabel(accepted ? handoff.acceptedAt : handoff.updatedAt, true)}</dd></div></dl>
      <div className={styles.receiptDocuments}>{handoff.documentIds.map(id => {
        const doc = documents.find(item => item.id === id);
        return doc ? <button className={styles.textButton} key={id} onClick={() => onOpenDocument(id)}><Symbol name="document" size={15}/>{doc.title} · Fassung {doc.version}</button> : <span key={id}>Dokumentfassung nicht verfügbar</span>;
      })}</div>
      <details className={styles.receiptEvents}><summary>Übergabeverlauf ansehen</summary><ol>{handoff.events.map(event => <li key={event.id}><strong>{event.label}</strong><small>{dateLabel(event.at, true)} · {event.actor}</small></li>)}</ol><small>Vorgang {handoff.id}</small></details>
      {accepted && <p className={styles.helperFootnote}>Diese Rückmeldung bestätigt die Ablage in der Akte. Sie bestätigt keine ärztliche Sichtung oder Bewertung.</p>}
      {(handoff.status === "received" || handoff.status === "clarification") && <button className={styles.textButton} onClick={onWithdraw}>Übergabe zurückziehen</button>}
    </div>
  </article>;
}

export default function ConsumerWorkspace({ demoId }: { demoId?: string }) {
  const [snapshot, setSnapshot] = useState<CareSnapshot | null>(null);
  const [view, setView] = useState<View>("overview");
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
  const careHref = "/vorsorge" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");
  const clinicHref = "/klinik" + (demoId ? "?demo=" + encodeURIComponent(demoId) : "");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/care" + query, { cache: "no-store", signal });
      const result = await response.json();
      if (response.status === 410 && demoId) {
        setSessionExpired(true); setSnapshot(null);
        setError(result.error || "Diese Demositzung ist abgelaufen. Starte eine neue Demo.");
        return;
      }
      if (response.status === 401 && !demoId) {
        window.location.replace("/anmelden?next=" + encodeURIComponent("/vorsorge"));
        return;
      }
      if (!response.ok) throw new Error(result.error || "Deine Unterlagen konnten nicht geladen werden.");
      const data = result as CareSnapshot;
      if (data.mode === "supabase" && data.actor.role === "clinic") {
        window.location.replace(new URL("/klinik", window.location.origin).href);
        return;
      }
      if (Date.parse(data.updatedAt) < snapshotTime.current) return;
      for (const handoff of data.handoffs) {
        if (previousStates.current[handoff.id] && previousStates.current[handoff.id] !== handoff.status) {
          if (handoff.status === "accepted") setNotice(handoff.clinicName + " hat die Übernahme in die Akte bestätigt.");
          if (handoff.status === "clarification") setNotice(handoff.clinicName + " hat eine Rückfrage zur Übergabe.");
        }
      }
      previousStates.current = Object.fromEntries(data.handoffs.map(item => [item.id,item.status]));
      applySnapshot(data); setError("");
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Die Verbindung wurde unterbrochen. Bitte versuche es erneut.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [query, demoId, applySnapshot]);

  useEffect(() => {
    if (sessionExpired) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => refresh(controller.signal));
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 3000);
    const onFocus = () => void refresh(controller.signal);
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [refresh, sessionExpired]);

  function goTo(next: View) { setView(next); setOpened(null); setNotice(""); }
  function openDocument(id: string, page = 1, evidenceId?: string) {
    setView("documents"); setOpened({ id, page, evidenceId });
    window.setTimeout(() => heading.current?.focus(), 0);
  }
  function onHandoffCreated(next: CareSnapshot) {
    applySnapshot(next); setView("handoffs"); setOpened(null);
    setNotice("Die ausgewählten Unterlagen sind eingegangen. Die Zuordnung zur Klinikakte steht noch aus.");
  }
  async function logout() {
    if (demoId) { window.location.replace(new URL("/anmelden", window.location.origin).href); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Die Abmeldung hat nicht geklappt.");
      setSnapshot(null);
      window.location.replace(new URL("/anmelden", window.location.origin).href);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Die Abmeldung hat nicht geklappt."); setBusy(false); }
  }
  async function withdrawHandoff() {
    const handoff = snapshot?.handoffs.find(item => item.id === withdrawId);
    if (!handoff) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/care/actions" + query, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "withdraw", handoffId: handoff.id, expectedRevision: handoff.revision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Die Übergabe konnte nicht zurückgezogen werden.");
      applySnapshot(result as CareSnapshot); setWithdrawId(null); setNotice("Die Übergabe wurde zurückgezogen.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Die Übergabe konnte nicht zurückgezogen werden."); setWithdrawId(null); }
    finally { setBusy(false); }
  }

  const currentDocs = snapshot?.documents.filter(doc => doc.current) ?? [];
  const oldDocs = snapshot?.documents.filter(doc => !doc.current) ?? [];
  const handoffs = [...(snapshot?.handoffs ?? [])].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const latestHandoff = handoffs[0];
  const pendingDocuments = currentDocs.filter(doc => !snapshot?.recordDocumentIds.includes(doc.id));
  const selectedDocument = opened ? snapshot?.documents.find(doc => doc.id === opened.id) : undefined;
  const selectedEvidence = selectedDocument?.evidence.find(item => item.id === opened?.evidenceId);
  const openHandoffCount = handoffs.filter(item => item.status === "received" || item.status === "clarification").length;
  const initials = snapshot?.person.name.split(" ").map(word => word[0]).slice(0,2).join("") || "V";
  const nextTitle = latestHandoff?.status === "clarification" ? "Die Klinik hat eine Rückfrage." :
    latestHandoff?.status === "received" ? "Deine Unterlagen sind eingegangen." :
      latestHandoff?.status === "accepted" && pendingDocuments.length === 0 ? "Die Übernahme ist bestätigt." :
        pendingDocuments.length === 1 ? "Eine neue Fassung ist bereit." : "Deine Unterlagen sind vorbereitet.";
  const nextDescription = latestHandoff?.status === "clarification" ? latestHandoff.note || "Schau nach, welche Angaben für die Zuordnung noch fehlen." :
    latestHandoff?.status === "received" ? "Die Klinik ordnet die Dokumente deinem Fall zu. Sobald die Übernahme bestätigt ist, siehst du es hier." :
      latestHandoff?.status === "accepted" && pendingDocuments.length === 0 ? "Die ausgewählten Fassungen sind der richtigen Akte zugeordnet. Du kannst den Beleg und die Unterlagen jederzeit öffnen." :
        pendingDocuments.length === 1 ? pendingDocuments[0].title + " · Fassung " + pendingDocuments[0].version + " ist noch nicht in der Klinikakte bestätigt." :
          "Wähle die Unterlagen aus, die du der Klinik bereitstellen möchtest.";
  const viewTitle = view === "documents" ? "Deine Vorsorgedokumente" : view === "handoffs" ? "Deine Übergaben" : "Deine Vorsorge im Blick";

  return <div className={styles.shell}>
    <header className={styles.header}><div className={styles.headerInner}>
      <Brand href={careHref}/>
      <div className={styles.headerActions}>
        <a href={clinicHref} target="_blank" rel="noopener noreferrer" className={styles.textButton}>Klinikansicht<Symbol name="external" size={14}/></a>
        {snapshot && <div className={styles.profile}><span className={styles.avatar}>{initials}</span><span>{snapshot.person.name}<small>{demoId ? "Demoansicht" : "Persönlicher Bereich"}</small></span></div>}
        <button className={styles.iconButton} aria-label={demoId ? "Demo verlassen" : "Abmelden"} disabled={busy} onClick={() => void logout()}><Symbol name="logout" size={18}/></button>
      </div>
      <nav className={styles.nav} aria-label="Persönliche Vorsorge">{navigation.map(item => <button key={item.id} aria-current={view === item.id ? "page" : undefined} onClick={() => goTo(item.id)}><Symbol name={item.icon}/>{item.label}{item.id === "handoffs" && openHandoffCount > 0 && <span className={styles.navCount}>{openHandoffCount}</span>}</button>)}</nav>
    </div></header>
    {demoId && <div className={styles.demoBar}><Symbol name="shield" size={15}/><span><strong>Synthetische Demo.</strong> Alle Personen und Dokumente sind erfunden. Beide Ansichten teilen denselben Übergabestand.</span></div>}
    <main id="main" className={styles.main}>
      {loading && !snapshot ? <LoadingState/> : <>
        {error && <div className={styles.notice + " " + styles.error} role="alert"><Symbol name="alert" size={18}/><span>{error}{snapshot && " Angezeigt wird der zuletzt geladene Stand."} {sessionExpired ? <a className={styles.textButton} href="/anmelden">Neue Demo starten</a> : <button className={styles.textButton} onClick={() => void refresh()}>Erneut laden</button>}</span></div>}
        {notice && <div className={styles.notice} role="status"><Symbol name="check" size={18}/><span>{notice}</span><button className={styles.iconButton} aria-label="Hinweis schließen" onClick={() => setNotice("")} style={{marginLeft:"auto",width:25,height:25}}><Symbol name="close" size={15}/></button></div>}
        {!snapshot ? <EmptyState title={sessionExpired ? "Diese Demositzung ist abgelaufen." : "Deine Unterlagen sind noch nicht erreichbar"}>{sessionExpired ? "Die vorübergehend gespeicherten Beispieldaten sind nicht mehr verfügbar. Über die Anmeldung kannst du eine neue synthetische Demo öffnen." : "Melde dich an oder öffne eine neue synthetische Demo."} <a href="/anmelden" className={styles.textButton}>{sessionExpired ? "Zur Anmeldung und neuen Demo" : "Zur Anmeldung"}</a></EmptyState> : <>
          {!selectedDocument && <div className={styles.pageHeading}><div>{view === "overview" && <p className={styles.greeting}>Guten Tag, {snapshot.person.name.split(" ")[0]}.</p>}<h1 ref={heading} tabIndex={-1}>{viewTitle}</h1><p>{view === "overview" ? "Was vorbereitet ist. Was noch fehlt. Was angekommen ist." : view === "documents" ? "Die aktuelle Fassung und die Stellen, auf die es ankommt." : "Verfolge, welche Fassungen die Klinik erhalten und zugeordnet hat."}</p></div>{view !== "overview" && <button className={styles.button} onClick={() => setHandoffOpen(true)}><Symbol name="transfer" size={17}/>Übergabe vorbereiten</button>}</div>}
          {view === "overview" && <div className={styles.overviewGrid}><div className={styles.mainColumn}>
            <section className={styles.nextStep}><span className={styles.stepIcon}><Symbol name={latestHandoff?.status === "accepted" && !pendingDocuments.length ? "check" : latestHandoff?.status === "clarification" ? "help" : "transfer"} size={23}/></span><div>{latestHandoff && <Badge tone={statusTones[latestHandoff.status]}>{statusLabels[latestHandoff.status]}</Badge>}<h2>{nextTitle}</h2><p>{nextDescription}</p>{latestHandoff && latestHandoff.status !== "withdrawn" ? <button className={styles.button} onClick={() => goTo("handoffs")}>Übergabe ansehen<Symbol name="arrow" size={17}/></button> : <button className={styles.button} onClick={() => setHandoffOpen(true)}>Übergabe vorbereiten<Symbol name="arrow" size={17}/></button>}</div></section>
            <div className={styles.sectionHeader}><div><h2>Deine Unterlagen</h2><p>{currentDocs.length} aktuelle Dokumentfassungen</p></div><button className={styles.textButton} onClick={() => goTo("documents")}>Alle ansehen<Symbol name="chevron" size={14}/></button></div>
            <div className={styles.documentList}>{currentDocs.map(doc => <DocumentRow key={doc.id} document={doc} inRecord={snapshot.recordDocumentIds.includes(doc.id)} onOpen={() => openDocument(doc.id)}/>)}</div>
            <div className={styles.sectionHeader}><h2>Zuletzt bei der Klinik</h2></div>
            {latestHandoff ? <div className={styles.recentHandoff}><Symbol name="hospital" size={23}/><div><strong>{latestHandoff.clinicName}</strong><p>{latestHandoff.documentIds.length} Dokumentfassung{latestHandoff.documentIds.length !== 1 ? "en" : ""} · {dateLabel(latestHandoff.updatedAt, true)}</p><Badge tone={statusTones[latestHandoff.status]}>{statusLabels[latestHandoff.status]}</Badge></div><button className={styles.textButton} style={{marginLeft:"auto",alignSelf:"flex-start"}} onClick={() => goTo("handoffs")}>Details<Symbol name="chevron" size={14}/></button></div> :
              <div className={styles.recentHandoff}><Symbol name="clock" size={23}/><div><strong>Noch keine neue Übergabe</strong><p>Die Klinikakte enthält die bisherigen Demofassungen. Neue Fassungen werden erst nach einer Übergabe bestätigt.</p></div></div>}
          </div><aside className={styles.sideColumn} aria-label="Karte und Unterstützung">
            <div><div className={styles.vorsorgeCard}><div className={styles.cardTop}><span>Vorsorgekarte<small>{snapshot.card.active ? "Aktiver Kartenverweis" : "Kartenverweis gesperrt"}</small></span><Symbol name="shield" size={22}/></div><div className={styles.chipGraphic}/><p className={styles.cardName}>{snapshot.person.name}</p><div className={styles.cardBottom}><small>{snapshot.card.label}</small><Symbol name="card" size={22}/></div></div><button className={styles.textButton} onClick={() => setCardOpen(true)}>Karte und Kartenlink<Symbol name="chevron" size={15}/></button></div>
            <div className={styles.sideHint}><h3><Symbol name="person" size={17}/>In deinen Unterlagen benannt</h3><p>{snapshot.person.contactName}</p><p>Der jeweilige Umfang steht in der Vollmacht. Die Benennung ist kein App-Zugang.</p></div>
            <div className={styles.helperCard}><h3><Symbol name="help" size={19}/>Brauchst du Unterstützung?</h3><p>Finde die passende Belegstelle oder deinen nächsten Schritt.</p><button onClick={() => setAssistant("evidence")}>Wo steht, wer benannt ist?<Symbol name="chevron" size={14}/></button><button onClick={() => setAssistant("missing")}>Was fehlt noch?<Symbol name="chevron" size={14}/></button><button onClick={() => setAssistant("receipt")}>Welche Fassung ist angekommen?<Symbol name="chevron" size={14}/></button></div>
          </aside></div>}
          {view === "documents" && !selectedDocument && <>
            <div className={styles.documentList}>{currentDocs.map(doc => <DocumentRow key={doc.id} document={doc} inRecord={snapshot.recordDocumentIds.includes(doc.id)} onOpen={() => openDocument(doc.id)}/>)}</div>
            <p className={styles.helperFootnote}>Die Übersicht beschreibt hinterlegte Inhalte. Sie bestätigt weder Unterschrift noch rechtliche Wirksamkeit.</p>
            {oldDocs.length > 0 && <><div className={styles.sectionHeader}><div><h2>Frühere Fassungen</h2><p>Bereits übergebene Fassungen bleiben nachvollziehbar.</p></div></div><div className={styles.documentList}>{oldDocs.map(doc => <DocumentRow key={doc.id} document={doc} inRecord={snapshot.recordDocumentIds.includes(doc.id)} onOpen={() => openDocument(doc.id)}/>)}</div></>}
          </>}
          {view === "documents" && selectedDocument && <>
            <button className={styles.textButton} style={{marginBottom:15}} onClick={() => setOpened(null)}><span style={{transform:"rotate(180deg)",display:"flex"}}><Symbol name="arrow" size={17}/></span>Alle Dokumente</button>
            <div className={styles.documentDetailTop}><span className={styles.documentIcon} data-kind={selectedDocument.kind}><Symbol name="document" size={25}/></span><div><h1 ref={heading} tabIndex={-1} style={{fontSize:25}}>{selectedDocument.title}</h1><p className={styles.meta}>Fassung {selectedDocument.version} · {dateLabel(selectedDocument.date)} · {selectedDocument.pageCount} {selectedDocument.pageCount === 1 ? "Seite" : "Seiten"}</p></div><Badge tone={selectedDocument.current ? "blue" : "neutral"}>{selectedDocument.current ? "Aktuelle Fassung" : "Frühere Fassung"}</Badge><div className={styles.buttonRow}><button className={styles.button + " " + styles.secondary} onClick={() => setAssistant("evidence")}><Symbol name="help" size={17}/>Frage zum Dokument</button></div></div>
            <div className={styles.documentSplit}><div className={styles.viewer}><PdfViewer key={selectedDocument.id + ":" + opened?.page + ":" + opened?.evidenceId} doc={{ title: selectedDocument.title, url: selectedDocument.fileUrl }} initialPage={opened?.page || 1} evidenceId={selectedEvidence?.id} sourceSection={selectedEvidence?.section} sourceQuote={selectedEvidence?.quote} sourceCondition={selectedEvidence?.condition} sourceExclusions={selectedEvidence?.exclusions} sourcePerson={selectedEvidence?.person} provenance={selectedDocument.provenance}/></div>
              <aside className={styles.evidenceList} aria-label="Belegte Angaben zum Dokument">
                {selectedDocument.evidence.length ? selectedDocument.evidence.map((item: CareEvidence) => <section key={item.id} className={styles.evidence} data-selected={selectedEvidence?.id === item.id}><h3>{item.label}</h3><strong style={{fontSize:14}}>{item.value}</strong><details className={styles.evidenceDetails} open={selectedEvidence?.id === item.id}><summary>Geltungsbereich und Beleg</summary><p><b>Voraussetzung:</b> {item.condition}</p>{item.exclusions.length > 0 && <p><b>Nicht umfasst:</b> {item.exclusions.join(" ")}</p>}<blockquote>{item.quote}</blockquote><button className={styles.textButton} onClick={() => openDocument(selectedDocument.id,item.page,item.id)}>Beleg auf Seite {item.page} öffnen<Symbol name="external" size={13}/></button></details></section>) : <div className={styles.evidence}><h3>Original prüfen</h3><p>Für diese Fassung sind noch keine einzelnen Belegstellen hinterlegt.</p></div>}
              </aside></div>
          </>}
          {view === "handoffs" && <div className={styles.handoffList}>{handoffs.length ? handoffs.map(handoff => <HandoffReceipt key={handoff.id} handoff={handoff} documents={snapshot.documents} query={query} onUpdated={next => { applySnapshot(next); setNotice("Deine Antwort ist bei der Klinik eingegangen. Die Zuordnung wird erneut geprüft."); }} onOpenDocument={id => openDocument(id)} onWithdraw={() => setWithdrawId(handoff.id)}/>) : <EmptyState title="Noch keine neue Übergabe" icon="transfer">Wähle die aktuelle Dokumentfassung aus und stelle sie der Klinik bereit. Hier siehst du anschließend Eingang, Zuordnung und Bestätigung.</EmptyState>}</div>}
        </>}
      </>}
    </main>
    <footer className={styles.footer}><span>{demoId ? "Synthetischer Demonstrator. Keine echten Patientendaten." : "Vorsorgeunterlagen und Übergaben im persönlichen Bereich."}</span><span>{snapshot ? "Letzter Datenstand: " + dateLabel(snapshot.updatedAt, true) : "Vorsorge"} · <a href={clinicHref} target="_blank" rel="noopener noreferrer">Klinikansicht öffnen</a></span></footer>
    {snapshot && handoffOpen && <HandoffDialog snapshot={snapshot} query={query} onClose={() => setHandoffOpen(false)} onUpdated={onHandoffCreated}/>}
    {snapshot && cardOpen && <CardDialog snapshot={snapshot} query={query} demoId={demoId} onClose={() => setCardOpen(false)} onUpdated={applySnapshot}/>}
    {snapshot && assistant !== null && <AssistantDialog query={query} documents={snapshot.documents} documentId={selectedDocument?.id} initialQuestion={assistant} onClose={() => setAssistant(null)} onOpenDocument={openDocument} onHandoff={() => { setAssistant(null); setHandoffOpen(true); }}/>}
    {withdrawId && <Modal title="Übergabe zurückziehen?" description="Die noch nicht bestätigte Übergabe wird beendet. Bereits übernommene Dokumente werden dadurch nicht aus einer Klinikakte gelöscht." onClose={() => setWithdrawId(null)}><div className={styles.dialogFooter}><button className={styles.button + " " + styles.secondary} disabled={busy} onClick={() => setWithdrawId(null)}>Beibehalten</button><button className={styles.button + " " + styles.danger} disabled={busy} onClick={() => void withdrawHandoff()}>{busy ? "Wird zurückgezogen …" : "Übergabe zurückziehen"}</button></div></Modal>}
  </div>;
}
