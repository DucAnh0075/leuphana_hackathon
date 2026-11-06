"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icons";
import { DOCUMENTS, answerKey, progress, preparationText, type WorkspaceState, type DocumentId, type CareDocument } from "@/lib/vora";
import { getLocalizedDocuments, displayDocumentChoice } from "@/lib/vora-document-language";
import { documentTemplate } from "@/lib/vora-document-templates";
import { useVoraLanguage } from "./VoraLanguage";
import NotaryPlanning from "./NotaryPlanning";
import s from "./Vora.module.css";

type Props = { state: WorkspaceState; update: (next: WorkspaceState) => boolean; ask: (question: string, documentTitle?: string, moduleTitle?: string) => void; initialDocument?: DocumentId; initialPhase?: number; initialBlock?: string; caseManaged?: boolean; onEditCase?: () => void };
const phaseNames = ["select", "blocks", "review", "finish"];
export default function DocumentWorkshop({ state, update, ask, initialDocument, initialPhase, initialBlock, caseManaged = false, onEditCase }: Props) {
  const { locale, t } = useVoraLanguage();
  const documents = getLocalizedDocuments(locale);
  const steps = [t("Dokumente wählen", "Choose documents"), t("Bausteine bearbeiten", "Work through blocks"), t("Notizen prüfen", "Review your notes"), t("Original vorbereiten", "Prepare & keep")];
  const checklist = [t("Offene Fragen fachlich besprochen", "Discuss open questions with a professional"), t("Entscheidungen ins amtliche Original übertragen", "Transfer decisions into the official document"), t("Form geprüft und Original unterschrieben", "Check formalities and sign the original"), t("Vertrauensperson über Aufbewahrung informiert", "Tell your trusted person where the original is kept")];
  const startDocument = documents.find(doc => doc.id === (initialDocument || state.selected[0] || "power"))!;
  const [phase, setPhase] = useState(!state.selected.includes(startDocument.id) ? 0 : initialPhase !== undefined && Number.isInteger(initialPhase) && initialPhase >= 0 && initialPhase <= 3 ? initialPhase : 1);
  const [active, setActive] = useState<DocumentId>(startDocument.id);
  const nextOpen = (doc: CareDocument) => Math.max(0, doc.modules.findIndex(item => !state.answers[answerKey(doc.id, item.id)]?.reviewed));
  const [block, setBlock] = useState(() => { const requested = startDocument.modules.findIndex(item => item.id === initialBlock); return requested >= 0 ? requested : nextOpen(startDocument); });
  const positionHeading = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState("");
  const [pendingPerson, setPendingPerson] = useState<"self" | "someone" | null>(null);
  const document = documents.find(doc => doc.id === active)!;
  const template = documentTemplate(document.id, locale);
  const currentBlock = document.modules[block] || document.modules[0];
  const key = answerKey(document.id, currentBlock.id);
  const answer = state.answers[key] || { value: "", note: "", reviewed: false };
  const selected = documents.filter(doc => state.selected.includes(doc.id));

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("area", "documents");
    url.searchParams.set("doc", active);
    url.searchParams.set("phase", phaseNames[phase]);
    if (phase === 1) url.searchParams.set("block", currentBlock.id);
    else url.searchParams.delete("block");
    window.history.replaceState(window.history.state, "", url);
    if (phase > 0) positionHeading.current?.focus();
  }, [phase, active, currentBlock.id]);

  function changeAnswer(value: Partial<typeof answer>) {
    const accepted = update({ ...state, answers: { ...state.answers, [key]: { ...answer, ...value, reviewed: false } }, completion: { ...state.completion, [document.id]: [] } });
    setNotice("");
    return accepted;
  }
  function toggleDocument(id: DocumentId) {
    update({ ...state, selected: state.selected.includes(id) ? state.selected.filter(item => item !== id) : [...state.selected, id] });
  }
  function chooseDocument(id: DocumentId) { setActive(id); setBlock(nextOpen(DOCUMENTS.find(doc => doc.id === id)!)); setNotice(""); }
  function download(doc: CareDocument) {
    const text = locale === "en" ? preparationText(doc, state) : [
      `VORAcard · ${doc.original}`, "Vorbereitungsnotizen — kein unterschriftsreifes Rechtsdokument", "Persönliche Notizen und gespeicherte Entscheidungen werden nicht automatisch übersetzt.", "",
      ...doc.modules.map(item => { const a = state.answers[answerKey(doc.id, item.id)]; return [item.title, item.prompt, displayDocumentChoice(a?.value || "", locale) || "Offen — keine Entscheidung", a?.note || "Keine Notizen", a?.reviewed ? "Von Ihnen geprüft" : "Noch nicht geprüft", ""].join("\n"); }),
      "Amtliche Quelle: " + doc.source, "", ...checklist,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `VORA-${doc.original}-preparation.txt`; anchor.click(); URL.revokeObjectURL(url);
    setNotice(t("Vorbereitungsnotizen heruntergeladen. Das unterschriebene Original ist ein eigenes Dokument.", "Preparation notes downloaded. Your signed original is a separate document."));
  }
  function print() { window.print(); }

  return <>
    <div className={s.noPrint}>
      <div className={phase === 0 ? s.sectionHeading : s.workshopHeading}><div><h1>{phase === 0 ? t("Dokumente für Ihren Fall wählen.", "Choose your documents.") : document.title}</h1>{phase === 0 ? <p>{t("Wählen Sie passende Dokumente. Bearbeiten Sie die Bausteine und halten Sie offene Fragen fest.", "Choose what you need. Understand each block. Keep questions open until you are ready.")}</p> : <p>{document.original} · {state.planningFor === "someone" ? t("Wünsche einer anderen Person vorbereiten", "Supporting another person’s wishes") : t("Eigene Wünsche vorbereiten", "Preparing my own wishes")}</p>}</div>{phase === 0 ? <span className={s.subtleTag}>{t("Deutsches Recht", "German legal documents")}</span> : <button className={s.textButton} onClick={() => setPhase(0)}>{t("Dokumentauswahl ändern", "Change person or documents")}</button>}</div>
      {phase === 0 && !caseManaged && <div className={s.personContext}><label htmlFor="planning-person">{t("Ich bereite Dokumente vor für", "I am preparing documents for")}<select id="planning-person" value={state.planningFor || "self"} onChange={event => { const next = event.target.value as "self" | "someone"; if (Object.keys(state.answers).length) setPendingPerson(next); else update({ ...state, planningFor: next, answers: {}, completion: {} }); }}><option value="self">{t("Mich selbst", "Myself")}</option><option value="someone">{t("Eine Person, die ich unterstütze", "Someone I am supporting")}</option></select></label><p>{state.planningFor === "someone" ? t("Halten Sie die eigenen Wünsche dieser Person mit ihrer Beteiligung fest. Unterstützung allein erlaubt nicht, für sie zu entscheiden oder zu unterschreiben. Ihre Gesundheits- und Reisebereiche bleiben persönlich.", "Record that person’s own wishes with their involvement. Supporting them does not authorise you to decide or sign for them. Your prevention, vaccination and travel sections remain personal.") : t("Beginnen Sie mit Ihren eigenen Wünschen. Eine Vertrauensperson kann Ihnen beim Nachdenken helfen.", "Start with your own wishes. You can ask a trusted person to help you think through them.")}</p></div>}
      {caseManaged && <p className={s.listIntro}>{t("Person und Anlass gehören zum Fallprofil. Ihre Angaben bleiben diesem Fall zugeordnet.", "The person and purpose belong to your case profile. Your notes stay with this case.")} {onEditCase && <button className={s.textButton} onClick={onEditCase}>{t("Fallprofil bearbeiten", "Edit case profile")}</button>}</p>}
      <ol className={s.steps} aria-label="Document preparation phases">{steps.map((step, index) => <li key={step}><button aria-current={phase === index ? "step" : undefined} disabled={index > 0 && !selected.length} onClick={() => { if (selected.length && !state.selected.includes(active)) chooseDocument(selected[0].id); setPhase(index); }}><span>{index + 1}</span>{step}</button></li>)}</ol>
      {phase === 0 && <section className={s.selection} aria-label="Choose your documents">
        <div className={s.sectionBar}><h2>{t("Was möchten Sie vorbereiten?", "What would you like to prepare?")}</h2><span>{t("Ein oder mehrere Dokumente", "Choose one or more")}</span></div>
        {documents.map(doc => <label key={doc.id} className={`${s.documentChoice} ${state.selected.includes(doc.id) ? s.chosen : ""}`}>
          <input type="checkbox" autoFocus={doc.id === initialDocument} checked={state.selected.includes(doc.id)} onChange={() => toggleDocument(doc.id)} aria-label={t(`${doc.title} auswählen`, `Select ${doc.title}`)} />
          <Icon name="document" width={28} height={28}/><span><strong>{doc.title}</strong><span className={s.originalName}>{doc.original}</span><p>{doc.description}</p></span><span className={s.choiceMeta}>{doc.modules.length} {t("Bausteine", "blocks")}<Icon name="chevron"/></span>
        </label>)}
        <div className={s.actionRow}><p>{t("Sie können später Dokumente ergänzen. Bestehende Notizen bleiben erhalten.", "You can add a document later. Your existing notes stay in this browser.")}</p><button className={s.primary} disabled={!selected.length} onClick={() => { chooseDocument(initialDocument && state.selected.includes(initialDocument) ? initialDocument : selected[0].id); setPhase(1); }}>{t("Ausgewählte Dokumente starten", "Start selected documents")} <Icon name="arrow" width={18}/></button></div>
        <div className={s.explainer}><Icon name="shield"/><div><strong>{t("Drei Dokumente. Drei eigene Aufgaben.", "Three documents. Three different jobs.")}</strong><p>{t("Eine Vollmacht erteilt Vertretungsbefugnisse. Eine Patientenverfügung hält Behandlungswünsche fest. Eine Betreuungsverfügung nennt dem Gericht Wünsche zur rechtlichen Betreuung. Die Dokumente ergänzen sich.", "A power of attorney appoints a representative. A patient directive records treatment wishes. A care directive gives a court your wishes about legal guardianship. One does not automatically replace the others.")}</p></div></div>
      </section>}

      {phase > 0 && selected.length > 0 && <>
        <div className={s.documentTabs} aria-label="Selected documents">{selected.map(doc => <button key={doc.id} aria-pressed={active === doc.id} onClick={() => chooseDocument(doc.id)}>{doc.title}<span>{progress(doc, state)}/{doc.modules.length}</span></button>)}</div>
        {phase === 1 && <div className={s.workshop}>
          <nav className={s.blockNav} aria-label="Document blocks"><div className={s.sectionBar}><h2>{t("Bausteine im Überblick", "Document outline")}</h2><span>{progress(document, state)}/{document.modules.length} {t("geprüft", "reviewed")}</span></div>{document.modules.map((item, index) => <button key={item.id} aria-current={index === block ? "step" : undefined} onClick={() => { setBlock(index); setNotice(""); }}><span className={`${s.blockNumber} ${state.answers[answerKey(active, item.id)]?.reviewed ? s.done : ""}`}>{state.answers[answerKey(active, item.id)]?.reviewed ? <Icon name="check" width={14} height={14}/> : String(index + 1).padStart(2, "0")}</span><span>{item.title}</span></button>)}</nav>
          <section className={s.blockEditor} aria-labelledby="block-title">
            <div className={s.blockTop}><span>{t("Baustein", "Block")} {block + 1} {t("von", "of")} {document.modules.length}</span><span className={answer.reviewed ? s.greenText : s.muted}>{answer.reviewed ? t("Von Ihnen geprüft", "Reviewed by you") : t("Noch zu prüfen", "Open for review")}</span></div>
            <h2 id="block-title" ref={positionHeading} tabIndex={-1}>{currentBlock.title}</h2><p className={s.purpose}>{currentBlock.purpose}</p>
            {currentBlock.caution && <div className={s.caution}><Icon name="alert" width={18}/><p>{currentBlock.caution}</p></div>}
            <fieldset className={s.question}><legend>{currentBlock.prompt}</legend>{currentBlock.options ? currentBlock.options.map(option => <label className={s.radioRow} key={option}><input type="radio" name={key} value={option} checked={answer.value === option} onChange={() => changeAnswer({ value: option })}/><span>{displayDocumentChoice(option, locale)}</span></label>) : <p className={s.muted}>{t("Bereiten Sie das Gespräch in wenigen Worten vor. Vollständige Identitätsdaten gehören ins Original.", "Use a few words to prepare your discussion. Full identifying details belong in the official document.")}</p>}</fieldset>
            <label className={s.fieldLabel} htmlFor="block-notes">{t("Ihre Vorbereitungsnotizen ", "Your preparation notes ")}<span>{t("Optional · im aktuellen Fall", "Optional · in the current case")}</span></label>
            <textarea id="block-notes" value={answer.note} onChange={event => changeAnswer({ note: event.target.value })} placeholder={t("Was ist Ihnen wichtig? Was möchten Sie noch klären?", "What matters to you? What do you still need to clarify?")} rows={5} maxLength={5000}/>
            <button className={s.askInline} onClick={() => ask(`Explain the purpose of “${currentBlock.title}” in a ${document.original}. What should someone clarify before completing this block?`, document.original, DOCUMENTS.find(doc => doc.id === document.id)!.modules.find(module => module.id === currentBlock.id)!.title)}><Icon name="signal" width={17}/> Ask VORAcard about this block <span>{t("Antworten und Notizen werden nicht geteilt", "No answers or notes are shared")}</span></button>
            <div className={s.editorActions}><button className={s.secondary} onClick={() => { if (!changeAnswer({ value: "", reviewed: false })) return; if (block < document.modules.length - 1) setBlock(block + 1); else setPhase(2); setNotice(t("Baustein bleibt offen. Ihre Notizen bleiben erhalten.", "Block left open. Your notes have been kept.")); }}>{t("Offen lassen", "Leave open")}</button><button className={s.primary} disabled={!answer.value.trim() && !answer.note.trim()} onClick={() => { if (!update({ ...state, answers: { ...state.answers, [key]: { ...answer, reviewed: true } } })) return; setNotice(t(`${currentBlock.title} geprüft. Änderungen bleiben möglich.`, `${currentBlock.title} reviewed. You can change it at any time.`)); if (block < document.modules.length - 1) setBlock(block + 1); else setPhase(2); }}>{t("Prüfen und weiter ", "Confirm & next ")}<Icon name="arrow" width={17}/></button></div>
            <p className={s.smallPrint}>{t("Sie bestätigen damit Ihre Prüfung dieser Notizen. Es entsteht weder eine Unterschrift noch eine rechtliche Wirksamkeitsbestätigung.", "Confirming means you have reviewed these preparation notes. It does not sign or validate a legal document.")}</p>
          </section>
        </div>}

        {phase === 2 && <section className={s.review}>
          <div className={s.sectionBar}><div><h2 ref={positionHeading} tabIndex={-1}>{t("Ihre Entscheidungen im Zusammenhang", "Read your decisions together")}</h2><p>{progress(document, state)} / {document.modules.length} {t("Bausteine geprüft. Offene Fragen bleiben in Ihrer Vorbereitung sichtbar.", "blocks reviewed. Open questions remain visible in your preparation.")}</p></div><button className={s.secondary} onClick={print}><Icon name="pages" width={18}/> Print / save PDF</button></div>
          {document.modules.map((item, index) => { const itemAnswer = state.answers[answerKey(active, item.id)]; return <article className={s.reviewRow} key={item.id}><span className={s.blockNumber}>{index + 1}</span><div><h3>{item.title}</h3><p>{displayDocumentChoice(itemAnswer?.value || "", locale) || (itemAnswer?.note ? t("Siehe Ihre Notizen", "See your notes below") : t("Keine Entscheidung festgehalten", "No decision recorded"))}</p>{itemAnswer?.note && <p className={s.noteText}>{itemAnswer.note}</p>}<span className={itemAnswer?.reviewed ? s.greenText : s.openText}>{itemAnswer?.reviewed ? t("Von Ihnen geprüft", "Reviewed by you") : t("Offene Frage", "Open question")}</span></div><button className={s.textButton} onClick={() => { setBlock(index); setPhase(1); }}>{t("Bearbeiten", "Edit")}<span className={s.srOnly}> {item.title}</span></button></article>; })}
          <div className={s.actionRow}><p>{t("Eine Änderung öffnet den Baustein erneut und setzt die Abschlussliste zurück.", "Changing a block removes its review status and resets the completion checklist.")}</p><button className={s.primary} onClick={() => setPhase(3)}>{t("Amtliches Original vorbereiten ", "Prepare official document ")}<Icon name="arrow" width={18}/></button></div>
        </section>}

        {phase === 3 && <section className={s.finish}>
          <div className={s.finishLead}><div className={s.paperIcon}><Icon name="document" width={36} height={36}/></div><div><h2 ref={positionHeading} tabIndex={-1}>{t("Von Ihren Notizen zum verwendbaren Original.", "From preparation to a usable document.")}</h2><p>{t("Nehmen Sie Ihre Notizen mit. Als Nächstes folgen das amtliche Original, die Formprüfung und Ihre Unterschrift.", "Your notes are ready to take with you. The official document, its formalities and your signature are the next steps.")}</p></div></div>
          {progress(document, state) < document.modules.length && <div className={s.caution}><Icon name="alert" width={18}/><p>{document.modules.length - progress(document, state)} {t("Bausteine sind noch offen. Drucken Sie die Notizen für ein Gespräch oder prüfen Sie sie vor dem Ausfüllen des Originals.", "blocks are still open. Print notes for a discussion or return to review before completing the original.")}</p></div>}
          <div className={s.downloadRow}><div><h3>{t("Ihre Vorbereitung", "Your preparation")}</h3><p>{t("Antworten, Notizen und offene Fragen ? ausdrücklich als Vorbereitung gekennzeichnet.", "A readable summary of answers, notes and open questions. Clearly labelled as preparation.")}</p></div><div className={s.buttonGroup}><button className={s.secondary} onClick={() => download(document)}><Icon name="download" width={17}/> Download notes</button><button className={s.primary} onClick={print}>{t("Drucken / PDF speichern", "Print / save PDF")}</button></div></div>
          <div className={s.downloadRow}><div><h3>{document.original}</h3><p>{template.label}. {template.note}</p></div><a className={s.secondary} href={template.url} target="_blank" rel="noreferrer">{t("Amtliches Original öffnen", "Open official original")}<Icon name="arrow" width={17}/></a></div>
          <NotaryPlanning key={document.id} documentId={document.id}/><div className={s.completion}><h3>{t("Original abschließen", "Finish outside VORAcard")}</h3><p>{t("Halten Sie erledigte Schritte fest. Ihre Angaben bestätigen keine rechtliche Wirksamkeit.", "Check off what you have done. These are your own records, not verification of legal validity.")}</p>{checklist.map((item, index) => <label className={s.checkRow} key={item}><input type="checkbox" checked={(state.completion[active] || []).includes(String(index))} onChange={() => { const current = state.completion[active] || []; update({ ...state, completion: { ...state.completion, [active]: current.includes(String(index)) ? current.filter(value => value !== String(index)) : [...current, String(index)] } }); }}/><span>{item}</span></label>)}</div>
          <div className={s.actionRow}><a href={document.source} target="_blank" rel="noreferrer" className={s.sourceLink}>{t("Amtliche Hinweise lesen", "Read the official guidance")}</a><a href={`/vorsorge?view=documents&lang=${locale}`} onClick={event => { event.preventDefault(); const url = new URL(window.location.href); url.pathname = "/vorsorge"; url.searchParams.set("view", "documents"); ["area", "case", "doc", "phase", "block", "offer"].forEach(key => url.searchParams.delete(key)); window.location.assign(url); }} className={s.secondary}>{t("Archiv unterschriebener Dokumente öffnen ", "Open signed-document archive ")}<Icon name="arrow" width={17}/></a></div>
        </section>}
      </>}
      <p className={s.statusMessage} role="status">{notice}</p>
    </div>
    <Dialog.Root open={pendingPerson !== null} onOpenChange={open => { if (!open) setPendingPerson(null); }}><Dialog.Portal><Dialog.Overlay className={s.chatOverlay}/><Dialog.Content className={s.confirmDialog}><Dialog.Title>{t("Person für die Vorbereitung wechseln?", "Change whose documents you are preparing?")}</Dialog.Title><Dialog.Description>{t("Damit Wünsche verschiedener Personen getrennt bleiben, werden die bisherigen Dokumentnotizen, Prüfungen und Abschlusslisten in diesem Browser gelöscht. Impfpass, Vorsorgefilter und Reiseplanung bleiben erhalten.", "To keep different people’s wishes separate, this will clear current document notes, reviews and completion checklists in this browser. Your personal vaccination record, prevention filters and travel plan stay as they are.")}</Dialog.Description><div className={s.buttonGroup}><Dialog.Close asChild><button className={s.secondary}>{t("Abbrechen", "Cancel")}</button></Dialog.Close><button className={s.primary} onClick={() => { if (pendingPerson) update({ ...state, planningFor: pendingPerson, answers: {}, completion: {} }); setPendingPerson(null); setBlock(0); setPhase(0); }}>{t("Notizen löschen und Person wechseln", "Clear notes & change person")}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <section className={s.printReport} aria-label="Printable preparation report"><h1>VORAcard · {document.original}</h1><h2>Preparation notes — not a signable legal document</h2><p>{t("Nutzen Sie diese Notizen für ein Gespräch und das amtliche Original. Offene Fragen sind keine Entscheidungen. Dieser Bericht erteilt keine Vollmacht und bestätigt keine Wirksamkeit.", "Use these notes to prepare a discussion and complete the official document. Open questions are not decisions. This report does not grant powers or certify legal validity.")}</p>{document.modules.map(item => { const itemAnswer = state.answers[answerKey(active, item.id)]; return <article key={item.id}><h2>{item.title}</h2><p>{item.prompt}</p><p><strong>{displayDocumentChoice(itemAnswer?.value || "", locale) || "Open — no decision recorded"}</strong></p><p>{itemAnswer?.note || t("Keine Notizen festgehalten.", "No notes recorded.")}</p><p>{itemAnswer?.reviewed ? t("Von Ihnen geprüft", "Reviewed by you") : t("Noch nicht geprüft", "Not reviewed")}</p></article>; })}<h2>{t("Amtliche Quelle", "Official source")}</h2><p>{document.source}</p><h2>{t("Schritte zum verwendbaren Original", "Before this becomes a usable document")}</h2><ol>{checklist.map(item => <li key={item}>{item}</li>)}</ol><p>{t("In VORAcard vorbereitet. Das amtliche Original und fachliche Hinweise haben Vorrang.", "Prepared locally in VORAcard. The original form and professional guidance take precedence.")}</p></section>
  </>;
}
