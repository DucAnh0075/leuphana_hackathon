"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icons";
import { DOCUMENTS, answerKey, progress, preparationText, type WorkspaceState, type DocumentId, type CareDocument } from "@/lib/vora";
import s from "./Vora.module.css";

type Props = { state: WorkspaceState; update: (next: WorkspaceState) => boolean; ask: (question: string, documentTitle?: string, moduleTitle?: string) => void; initialDocument?: DocumentId };
const steps = ["Choose documents", "Work through blocks", "Review your notes", "Prepare & keep"];
const checklist = ["Discuss open questions with a professional", "Transfer decisions into the official document", "Check formalities and sign the original", "Tell your trusted person where the original is kept"];
const pdfs: Record<DocumentId, string> = {
  power: "https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Vorsorgevollmacht.pdf?__blob=publicationFile&v=8",
  guardian: "https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Betreuungsverfuegung.pdf?__blob=publicationFile&v=5",
  directive: "https://www.bmjv.de/SharedDocs/Downloads/DE/Formular/Patientenverfuegung_Textbausteine_pdf.pdf?__blob=publicationFile&v=7",
};

export default function DocumentWorkshop({ state, update, ask, initialDocument }: Props) {
  const [phase, setPhase] = useState(initialDocument && !state.selected.includes(initialDocument) ? 0 : state.selected.length ? 1 : 0);
  const [active, setActive] = useState<DocumentId>(initialDocument || state.selected[0] || "power");
  const [block, setBlock] = useState(0);
  const [notice, setNotice] = useState("");
  const [pendingPerson, setPendingPerson] = useState<"self" | "someone" | null>(null);
  const document = DOCUMENTS.find(doc => doc.id === active)!;
  const currentBlock = document.modules[block] || document.modules[0];
  const key = answerKey(document.id, currentBlock.id);
  const answer = state.answers[key] || { value: "", note: "", reviewed: false };
  const selected = DOCUMENTS.filter(doc => state.selected.includes(doc.id));

  function changeAnswer(value: Partial<typeof answer>) {
    const accepted = update({ ...state, answers: { ...state.answers, [key]: { ...answer, ...value, reviewed: false } }, completion: { ...state.completion, [document.id]: [] } });
    setNotice("");
    return accepted;
  }
  function toggleDocument(id: DocumentId) {
    update({ ...state, selected: state.selected.includes(id) ? state.selected.filter(item => item !== id) : [...state.selected, id] });
  }
  function chooseDocument(id: DocumentId) { setActive(id); setBlock(0); setNotice(""); }
  function download(doc: CareDocument) {
    const blob = new Blob([preparationText(doc, state)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = `VORA-${doc.original}-preparation.txt`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("Preparation notes downloaded. Your signed original is a separate document.");
  }
  function print() { window.print(); }

  return <>
    <div className={s.noPrint}>
      <div className={phase === 0 ? s.sectionHeading : s.workshopHeading}><div><h1>{phase === 0 ? "Choose your documents." : document.title}</h1>{phase === 0 ? <p>Choose what you need. Understand each block. Keep questions open until you are ready.</p> : <p>{document.original} · {state.planningFor === "someone" ? "Supporting another person’s wishes" : "Preparing my own wishes"}</p>}</div>{phase === 0 ? <span className={s.subtleTag}>German legal documents</span> : <button className={s.textButton} onClick={() => setPhase(0)}>Change person or documents</button>}</div>
      {phase === 0 && <div className={s.personContext}><label htmlFor="planning-person">I am preparing documents for<select id="planning-person" value={state.planningFor || "self"} onChange={event => { const next = event.target.value as "self" | "someone"; if (Object.keys(state.answers).length) setPendingPerson(next); else update({ ...state, planningFor: next, answers: {}, completion: {} }); }}><option value="self">Myself</option><option value="someone">Someone I am supporting</option></select></label><p>{state.planningFor === "someone" ? "Record that person’s own wishes with their involvement. Supporting them does not authorise you to decide or sign for them. Your prevention, vaccination and travel sections remain personal." : "Start with your own wishes. You can ask a trusted person to help you think through them."}</p></div>}
      <ol className={s.steps} aria-label="Document preparation phases">{steps.map((step, index) => <li key={step}><button aria-current={phase === index ? "step" : undefined} disabled={index > 0 && !selected.length} onClick={() => { if (selected.length && !state.selected.includes(active)) chooseDocument(selected[0].id); setPhase(index); }}><span>{index + 1}</span>{step}</button></li>)}</ol>
      {phase === 0 && <section className={s.selection} aria-label="Choose your documents">
        <div className={s.sectionBar}><h2>What would you like to prepare?</h2><span>Choose one or more</span></div>
        {DOCUMENTS.map(doc => <label key={doc.id} className={`${s.documentChoice} ${state.selected.includes(doc.id) ? s.chosen : ""}`}>
          <input type="checkbox" autoFocus={doc.id === initialDocument} checked={state.selected.includes(doc.id)} onChange={() => toggleDocument(doc.id)} aria-label={`Select ${doc.title}`} />
          <Icon name="document" width={28} height={28}/><span><strong>{doc.title}</strong><span className={s.originalName}>{doc.original}</span><p>{doc.description}</p></span><span className={s.choiceMeta}>{doc.modules.length} blocks<Icon name="chevron"/></span>
        </label>)}
        <div className={s.actionRow}><p>You can add a document later. Your existing notes stay in this browser.</p><button className={s.primary} disabled={!selected.length} onClick={() => { chooseDocument(initialDocument && state.selected.includes(initialDocument) ? initialDocument : selected[0].id); setPhase(1); }}>Start selected documents <Icon name="arrow" width={18}/></button></div>
        <div className={s.explainer}><Icon name="shield"/><div><strong>Three documents. Three different jobs.</strong><p>A power of attorney appoints a representative. A patient directive records treatment wishes. A care directive gives a court your wishes about legal guardianship. One does not automatically replace the others.</p></div></div>
      </section>}

      {phase > 0 && selected.length > 0 && <>
        <div className={s.documentTabs} aria-label="Selected documents">{selected.map(doc => <button key={doc.id} aria-pressed={active === doc.id} onClick={() => chooseDocument(doc.id)}>{doc.title}<span>{progress(doc, state)}/{doc.modules.length}</span></button>)}</div>
        {phase === 1 && <div className={s.workshop}>
          <nav className={s.blockNav} aria-label="Document blocks"><div className={s.sectionBar}><h2>Document outline</h2><span>{progress(document, state)}/{document.modules.length} reviewed</span></div>{document.modules.map((item, index) => <button key={item.id} aria-current={index === block ? "step" : undefined} onClick={() => { setBlock(index); setNotice(""); }}><span className={`${s.blockNumber} ${state.answers[answerKey(active, item.id)]?.reviewed ? s.done : ""}`}>{state.answers[answerKey(active, item.id)]?.reviewed ? <Icon name="check" width={14} height={14}/> : String(index + 1).padStart(2, "0")}</span><span>{item.title}</span></button>)}</nav>
          <section className={s.blockEditor} aria-labelledby="block-title">
            <div className={s.blockTop}><span>Block {block + 1} of {document.modules.length}</span><span className={answer.reviewed ? s.greenText : s.muted}>{answer.reviewed ? "Reviewed by you" : "Open for review"}</span></div>
            <h2 id="block-title">{currentBlock.title}</h2><p className={s.purpose}>{currentBlock.purpose}</p>
            {currentBlock.caution && <div className={s.caution}><Icon name="alert" width={18}/><p>{currentBlock.caution}</p></div>}
            <fieldset className={s.question}><legend>{currentBlock.prompt}</legend>{currentBlock.options ? currentBlock.options.map(option => <label className={s.radioRow} key={option}><input type="radio" name={key} value={option} checked={answer.value === option} onChange={() => changeAnswer({ value: option })}/><span>{option}</span></label>) : <p className={s.muted}>Use a few words to prepare your discussion. Full identifying details belong in the official document.</p>}</fieldset>
            <label className={s.fieldLabel} htmlFor="block-notes">Your preparation notes <span>Optional · saved only in this browser</span></label>
            <textarea id="block-notes" value={answer.note} onChange={event => changeAnswer({ note: event.target.value })} placeholder="What matters to you? What do you still need to clarify?" rows={5} maxLength={5000}/>
            <button className={s.askInline} onClick={() => ask(`Explain the purpose of “${currentBlock.title}” in a ${document.original}. What should someone clarify before completing this block?`, document.original, currentBlock.title)}><Icon name="signal" width={17}/> Ask VORA about this block <span>No answers or notes are shared</span></button>
            <div className={s.editorActions}><button className={s.secondary} onClick={() => { if (!changeAnswer({ value: "", reviewed: false })) return; if (block < document.modules.length - 1) setBlock(block + 1); else setPhase(2); setNotice("Block left open. Your notes have been kept."); }}>Leave open</button><button className={s.primary} disabled={!answer.value.trim() && !answer.note.trim()} onClick={() => { if (!update({ ...state, answers: { ...state.answers, [key]: { ...answer, reviewed: true } } })) return; setNotice(`${currentBlock.title} reviewed. You can change it at any time.`); if (block < document.modules.length - 1) setBlock(block + 1); else setPhase(2); }}>Confirm & next <Icon name="arrow" width={17}/></button></div>
            <p className={s.smallPrint}>Confirming means you have reviewed these preparation notes. It does not sign or validate a legal document.</p>
          </section>
        </div>}

        {phase === 2 && <section className={s.review}>
          <div className={s.sectionBar}><div><h2>Read your decisions together</h2><p>{progress(document, state)} of {document.modules.length} blocks reviewed. Open questions remain visible in your preparation.</p></div><button className={s.secondary} onClick={print}><Icon name="pages" width={18}/> Print / save PDF</button></div>
          {document.modules.map((item, index) => { const itemAnswer = state.answers[answerKey(active, item.id)]; return <article className={s.reviewRow} key={item.id}><span className={s.blockNumber}>{index + 1}</span><div><h3>{item.title}</h3><p>{itemAnswer?.value || (itemAnswer?.note ? "See your notes below" : "No decision recorded")}</p>{itemAnswer?.note && <p className={s.noteText}>{itemAnswer.note}</p>}<span className={itemAnswer?.reviewed ? s.greenText : s.openText}>{itemAnswer?.reviewed ? "Reviewed by you" : "Open question"}</span></div><button className={s.textButton} onClick={() => { setBlock(index); setPhase(1); }}>Edit<span className={s.srOnly}> {item.title}</span></button></article>; })}
          <div className={s.actionRow}><p>Changing a block removes its review status and resets the completion checklist.</p><button className={s.primary} onClick={() => setPhase(3)}>Prepare official document <Icon name="arrow" width={18}/></button></div>
        </section>}

        {phase === 3 && <section className={s.finish}>
          <div className={s.finishLead}><div className={s.paperIcon}><Icon name="document" width={36} height={36}/></div><div><h2>From preparation to a usable document.</h2><p>Your notes are ready to take with you. The official document, its formalities and your signature are the next steps.</p></div></div>
          {progress(document, state) < document.modules.length && <div className={s.caution}><Icon name="alert" width={18}/><p>{document.modules.length - progress(document, state)} blocks are still open. You can print your notes for a discussion, or return to review before completing the original.</p></div>}
          <div className={s.downloadRow}><div><h3>Your preparation</h3><p>A readable summary of answers, notes and open questions. Clearly labelled as preparation.</p></div><div className={s.buttonGroup}><button className={s.secondary} onClick={() => download(document)}><Icon name="download" width={17}/> Download notes</button><button className={s.primary} onClick={print}>Print / save PDF</button></div></div>
          <div className={s.downloadRow}><div><h3>{document.original}</h3><p>{document.sourceLabel}. Opens the actual official PDF in a new tab.</p></div><a className={s.secondary} href={pdfs[document.id]} target="_blank" rel="noreferrer">Open official {document.id === "directive" ? "text modules" : "form"}<Icon name="arrow" width={17}/></a></div>
          <div className={s.completion}><h3>Finish outside VORA</h3><p>Check off what you have done. These are your own records, not verification of legal validity.</p>{checklist.map((item, index) => <label className={s.checkRow} key={item}><input type="checkbox" checked={(state.completion[active] || []).includes(String(index))} onChange={() => { const current = state.completion[active] || []; update({ ...state, completion: { ...state.completion, [active]: current.includes(String(index)) ? current.filter(value => value !== String(index)) : [...current, String(index)] } }); }}/><span>{item}</span></label>)}</div>
          <div className={s.actionRow}><a href={document.source} target="_blank" rel="noreferrer" className={s.sourceLink}>Read the official guidance</a><a href="/vorsorge?view=documents" className={s.secondary}>Open signed-document archive <Icon name="arrow" width={17}/></a></div>
        </section>}
      </>}
      <p className={s.statusMessage} role="status">{notice}</p>
    </div>
    <Dialog.Root open={pendingPerson !== null} onOpenChange={open => { if (!open) setPendingPerson(null); }}><Dialog.Portal><Dialog.Overlay className={s.chatOverlay}/><Dialog.Content className={s.confirmDialog}><Dialog.Title>Change whose documents you are preparing?</Dialog.Title><Dialog.Description>To keep different people’s wishes separate, this will clear current document notes, reviews and completion checklists in this browser. Your personal vaccination record, prevention filters and travel plan stay as they are.</Dialog.Description><div className={s.buttonGroup}><Dialog.Close asChild><button className={s.secondary}>Cancel</button></Dialog.Close><button className={s.primary} onClick={() => { if (pendingPerson) update({ ...state, planningFor: pendingPerson, answers: {}, completion: {} }); setPendingPerson(null); setBlock(0); setPhase(0); }}>Clear notes & change person</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <section className={s.printReport} aria-label="Printable preparation report"><h1>VORA · {document.original}</h1><h2>Preparation notes — not a signable legal document</h2><p>Use these notes to prepare a discussion and complete the official document. Open questions are not decisions. This report does not grant powers or certify legal validity.</p>{document.modules.map(item => { const itemAnswer = state.answers[answerKey(active, item.id)]; return <article key={item.id}><h2>{item.title}</h2><p>{item.prompt}</p><p><strong>{itemAnswer?.value || "Open — no decision recorded"}</strong></p><p>{itemAnswer?.note || "No notes recorded."}</p><p>{itemAnswer?.reviewed ? "Reviewed by you" : "Not reviewed"}</p></article>; })}<h2>Official source</h2><p>{document.source}</p><h2>Before this becomes a usable document</h2><ol>{checklist.map(item => <li key={item}>{item}</li>)}</ol><p>Prepared locally in VORA. The original form and professional guidance take precedence.</p></section>
  </>;
}
