"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  GOALS, TEMPLATES, MAX_ANSWER_LENGTH, createPlanningDraft, restorePlanningDraft,
  serializePlanningDraft, setSubject, setGoals, toggleTemplate, setAnswer,
  markPackagePending, getPackageStatus, getPackages, getProgress, recommendTemplates,
  setPlanningStep, setCurrentPackage, markReviewed, exportPlanningDraft,
  type GoalId, type PlanningDraft, type PlanningStep, type Subject, type PlanningTemplate,
} from "@/lib/planning";
import ConsumerShell from "./ConsumerShell";
import PlanningConfirmation from "./PlanningConfirmation";
import { Symbol } from "./Presentation";
import styles from "./Planning.module.css";

const steps: { id: PlanningStep; label: string }[] = [
  { id: "subject", label: "Who" }, { id: "purpose", label: "What matters" },
  { id: "templates", label: "Documents" }, { id: "packages", label: "Small tasks" },
  { id: "review", label: "Review" },
];
const statusLabels = { empty: "Not started", partial: "In progress", pending: "Needs attention", complete: "Answered" };
const help: Record<PlanningStep, { title: string; text: string }> = {
  subject: { title: "Planning for someone else", text: "You can help another person gather their wishes and questions. Keep their own choices separate from your assumptions. Choosing this option does not give you permission to act for them or open their records." },
  purpose: { title: "Start with what matters", text: "Choose the situations you want to prepare for. You can choose more than one, or say you are not sure. This only narrows the documents to explore; it makes no medical or legal decision." },
  templates: { title: "Choosing a starting document", text: "Each option has a different purpose. Read why it appears and what it cannot do, then choose what you want to work on. The originals are German references. The English planning questions do not complete or translate those forms." },
  packages: { title: "Small tasks, open questions welcome", text: "Use your own words. If something needs a conversation, leave the task open and return later. An answered task means you added planning notes; it does not mean a document is legally complete." },
  review: { title: "What this draft can do", text: "Check your notes and the open questions. You can edit any task before downloading a text copy. Preparing full legal forms, professional review, signatures and sharing with a clinic are separate steps." },
};

function TemplateOption({ template, selected, reason, onChange }: { template: PlanningTemplate; selected: boolean; reason?: string; onChange: () => void }) {
  return <article className={styles.template}>
    <label className={styles.choice}>
      <input id={"template-" + template.id} type="checkbox" checked={selected} onChange={onChange}/>
      <span><strong>{template.title}</strong><small>{template.summary}</small></span>
    </label>
    <div className={styles.templateMeta}>
      {reason && <p className={styles.reason}>Why this fits: {reason}</p>}
      <p>{template.limitation}</p>
      <details><summary>About the German source</summary><p><span lang="de">{template.germanTitle}</span>. {template.source.kind === "official-template" ? "Official reference template" : "Synthetic project example"}, {template.source.version}. The English guide is not a certified translation.</p><a href={template.source.localPath} target="_blank" rel="noopener noreferrer">Open German {template.source.kind === "official-template" ? "original" : "example"} (PDF)</a></details>
    </div>
  </article>;
}

export default function PlanningWorkspace({ demoId }: { demoId?: string }) {
  const [draft, setDraft] = useState<PlanningDraft>(createPlanningDraft);
  const [ready, setReady] = useState(false);
  const [confirmation, setConfirmation] = useState<{ subject?: Subject; returnFocus: HTMLElement | null } | null>(null);
  const [storageIssue, setStorageIssue] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [downloaded, setDownloaded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const downloadButton = useRef<HTMLButtonElement>(null);
  const storageKey = "vorsorge:planning:v1:" + (demoId || "guest");
  const packages = getPackages(draft);
  const packageIndex = Math.max(0, packages.findIndex(item => item.id === draft.currentPackageId));
  const currentPackage = packages[Math.min(packageIndex, Math.max(0, packages.length - 1))];
  const focusedPackageId = draft.step === "packages" ? currentPackage?.id : undefined;
  const progress = getProgress(draft);
  const recommendations = recommendTemplates(draft.goals);
  const recommendedIds = recommendations.map(item => item.templateId);
  const visibleTemplates = TEMPLATES.filter(item => !recommendations.length || recommendedIds.includes(item.id) || draft.selectedTemplateIds.includes(item.id));
  const additionalTemplates = TEMPLATES.filter(item => !visibleTemplates.includes(item));
  const hasPlan = Boolean(draft.subject || draft.goals.length || draft.selectedTemplateIds.length);

  useEffect(() => {
    // Storage is a browser-only boundary. Render the same loading state during hydration.
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const restored = restorePlanningDraft(raw);
          if (restored) {
            setDraft(restored);
          } else {
            sessionStorage.removeItem(storageKey);
            setError("The saved draft was outdated or could not be read. It has been cleared. You can start a new plan.");
          }
        }
      } catch {
        setStorageIssue("This browser cannot save this draft. Your notes stay in memory until you leave or reload; download a copy to keep them.");
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    if (!ready || storageIssue) return;
    try { sessionStorage.setItem(storageKey, serializePlanningDraft(draft)); }
    catch {
      // Surface the failed storage effect without asserting a save succeeded.
      const frame = requestAnimationFrame(() => setStorageIssue("This browser cannot save this draft. Your notes stay in memory until you leave or reload; download a copy to keep them."));
      return () => cancelAnimationFrame(frame);
    }
  }, [draft, ready, storageIssue, storageKey]);

  useEffect(() => { heading.current?.focus(); }, [draft.step, focusedPackageId]);

  function setPackageIndex(next: number | ((index: number) => number)) {
    setError("");
    setFieldErrors({});
    setDraft(value => {
      const available = getPackages(value);
      const index = Math.max(0, available.findIndex(item => item.id === value.currentPackageId));
      const nextIndex = typeof next === "function" ? next(index) : next;
      const nextPackage = available[Math.max(0, Math.min(nextIndex, available.length - 1))];
      return nextPackage ? setCurrentPackage(value, nextPackage.id) : value;
    });
  }
  function go(step: PlanningStep) { setError(""); setFieldErrors({}); setDownloaded(false); setDraft(value => setPlanningStep(value, step)); }
  function updateAnswer(packageId: string, fieldId: string, answer: string) {
    setDraft(value => setAnswer(value, packageId, fieldId, answer));
    if (answer.trim()) setFieldErrors(current => {
      const next = { ...current };
      delete next[packageId + "-" + fieldId];
      return next;
    });
  }
  function selectSubject(subject: Subject) {
    if (draft.subject && draft.subject !== subject) {
      setConfirmation({ subject, returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null });
      return;
    }
    applySubject(subject);
  }
  function applySubject(subject: Subject) {
    setDraft(value => setPlanningStep(setSubject(value, subject), "subject")); setPackageIndex(0); setDownloaded(false);
  }
  function selectGoal(id: GoalId) {
    const next: GoalId[] = id === "unsure" ? (draft.goals.includes(id) ? [] : [id]) : draft.goals.includes(id) ? draft.goals.filter(value => value !== id) : [...draft.goals.filter(value => value !== "unsure"), id];
    setDraft(value => setGoals(value, next));
  }
  function selectTemplate(id: PlanningTemplate["id"]) {
    setDraft(value => toggleTemplate(value, id));
    // A retained selection may move out of the collapsed alternatives. Keep the
    // same control focused instead of losing keyboard position on its remount.
    requestAnimationFrame(() => {
      const input = document.getElementById("template-" + id);
      const disclosure = input?.closest("details");
      if (disclosure) disclosure.open = true;
      input?.focus();
    });
  }
  function reset() {
    setConfirmation({ returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  }
  function confirmChange() {
    if (confirmation?.subject) {
      applySubject(confirmation.subject);
      setConfirmation(null);
      return;
    }
    try { sessionStorage.removeItem(storageKey); setStorageIssue(""); } catch { /* The memory-only draft can still be reset. */ }
    setDraft(createPlanningDraft()); setFieldErrors({}); setError(""); setDownloaded(false); setConfirmation(null);
  }
  function nextPackage() {
    setError("");
    if (packageIndex >= packages.length - 1) go("review");
    else setPackageIndex(index => index + 1);
  }
  function savePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPackage) return;
    const missing = currentPackage.fields.filter(field => field.required && !draft.answers[currentPackage.id]?.[field.id]?.trim());
    if (missing.length) {
      setError("Add the required answers, or leave this task open to come back later.");
      setFieldErrors(Object.fromEntries(missing.map(field => [currentPackage.id + "-" + field.id, "Add an answer, or leave this task open to come back later."])));
      const firstMissingId = currentPackage.id + "-" + missing[0].id;
      requestAnimationFrame(() => document.getElementById(firstMissingId)?.focus());
      return;
    }
    const firstField = currentPackage.fields[0];
    setDraft(value => setAnswer(value, currentPackage.id, firstField.id, value.answers[currentPackage.id]?.[firstField.id] || ""));
    nextPackage();
  }
  function editPackage(id: string) { setPackageIndex(Math.max(0, packages.findIndex(item => item.id === id))); go("packages"); }
  function download() {
    const blob = new Blob([exportPlanningDraft(draft)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "vorsorge-planning-draft.txt";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setDownloaded(true);
  }
  const subjectLabel = draft.subject === "someone-else" ? "Planning for someone else" : "Planning for yourself";
  const stepHelp = draft.step === "subject" && draft.subject !== "someone-else"
    ? { title: draft.subject === "self" ? "Planning for yourself" : "Start with a small step", text: "Start with the person this plan is for. Then choose what matters to them and explore suitable documents. You can leave any difficult question open. No account is needed, and this first draft stays in this tab." }
    : help[draft.step];

  function taskTree() {
    const groups = [{ id: "person", title: "Person details", items: packages.filter(item => !item.templateId) }, ...TEMPLATES.filter(item => draft.selectedTemplateIds.includes(item.id)).map(template => ({ id: template.id, title: template.title, items: packages.filter(item => item.templateId === template.id) }))];
    return <aside className={styles.outline} aria-label="Your plan tasks"><h2>Your plan</h2><p>{progress.complete} of {progress.total} tasks answered</p><ul className={styles.taskTree}>{groups.map(group => <li key={group.id}><span className={styles.treeDocument}><Symbol name="document" size={15}/>{group.title}</span><ul>{group.items.map(item => { const status = getPackageStatus(draft, item.id); return <li key={item.id}><button onClick={() => editPackage(item.id)} aria-current={draft.step === "packages" && currentPackage?.id === item.id ? "step" : undefined}><span className={styles.statusDot} data-state={status}/><span>{item.title}<small>{statusLabels[status]}</small></span></button></li>; })}</ul></li>)}</ul></aside>;
  }

  return <ConsumerShell active="plan" demoId={demoId} onReset={hasPlan ? reset : undefined} helpTitle={stepHelp.title} helpContent={<p>{stepHelp.text + (draft.step === "packages" && currentPackage ? " Current task: " + currentPackage.description : "")}</p>}>
    <main id="main" className={styles.main}>
      {!ready ? <p className={styles.loading} role="status">Opening your planning space…</p> : <>
        {storageIssue && <p className={styles.errorNote} role="status">{storageIssue}</p>}
        {error && <p className={styles.errorNote} role="alert">{error}</p>}
        <>
          <ol className={styles.stepper} aria-label="Planning steps">{steps.map(step => <li key={step.id}><button aria-current={draft.step === step.id ? "step" : undefined} disabled={(step.id !== "subject" && !draft.subject) || (["packages", "review"].includes(step.id) && (!draft.selectedTemplateIds.length || !draft.goals.length)) || (step.id === "templates" && !draft.goals.length)} onClick={() => go(step.id)}>{step.label}</button></li>)}</ol>
          <div className={styles.contentGrid + (["packages", "review"].includes(draft.step) ? " " + styles.withOutline : "")}>
            <section className={styles.question}>
              {draft.step === "subject" && <><h1 ref={heading} tabIndex={-1}>Who are you planning for?</h1><p className={styles.intro}>Prepare care wishes in small, manageable steps. Start with the person this is for.</p><p className={styles.entryNote}>No account needed. You can leave difficult questions open.</p><form onSubmit={event => { event.preventDefault(); if (draft.subject) go("purpose"); }}><fieldset className={styles.fieldset}><legend className={styles.visuallyHidden}>Who this plan is for</legend><div className={styles.choices}><label className={styles.choice}><input type="radio" name="subject" value="self" required checked={draft.subject === "self"} onChange={() => selectSubject("self")}/><span><strong>Myself</strong><small>My wishes, my choices, my next steps.</small></span></label><label className={styles.choice}><input type="radio" name="subject" value="someone-else" checked={draft.subject === "someone-else"} onChange={() => selectSubject("someone-else")}/><span><strong>Someone else</strong><small>Help someone gather their wishes and questions.</small></span></label></div></fieldset>{draft.subject === "someone-else" && <p className={styles.inlineNote}>Helping someone plan does not grant authority to act for them or access their records.</p>}<div className={styles.actions}><button className={styles.primaryButton} aria-describedby={!draft.subject ? "choose-person-hint" : undefined} disabled={!draft.subject}>Continue<Symbol name="arrow" size={16}/></button></div>{!draft.subject && <p id="choose-person-hint" className={styles.nextHint}>Choose one option to continue.</p>}</form></>}
              {draft.step === "purpose" && <><h1 ref={heading} tabIndex={-1}>What would you like to prepare?</h1><p className={styles.intro}>Choose what feels relevant. It’s fine to be unsure.</p><form onSubmit={event => { event.preventDefault(); if (draft.goals.length) go("templates"); }}><fieldset className={styles.fieldset}><legend className={styles.visuallyHidden}>Planning goals</legend><div className={styles.choices}>{GOALS.map(goal => <label className={styles.choice} key={goal.id}><input type="checkbox" checked={draft.goals.includes(goal.id)} onChange={() => selectGoal(goal.id)}/><span><strong>{goal.title}</strong><small>{goal.description}</small></span></label>)}</div></fieldset><div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => go("subject")}>Back</button><button className={styles.primaryButton} disabled={!draft.goals.length}>Continue<Symbol name="arrow" size={16}/></button></div></form></>}
              {draft.step === "templates" && <><h1 ref={heading} tabIndex={-1}>Choose your starting documents</h1><p className={styles.intro}>{recommendations.length ? "These options connect to what you selected. Choose only what you want to explore." : "Take a look at the different purposes. Choose a starting point; you can change it later."}</p><section className={styles.selectionSummary} aria-labelledby="selection-title"><h2 id="selection-title">Your selection</h2><p role="status" aria-atomic="true">{draft.selectedTemplateIds.length ? draft.selectedTemplateIds.length + " " + (draft.selectedTemplateIds.length === 1 ? "document" : "documents") + " selected · " + packages.length + " small tasks" : "Choose at least one document to create your task list."}</p></section><div className={styles.templateList}>{visibleTemplates.map(template => <TemplateOption key={template.id} template={template} selected={draft.selectedTemplateIds.includes(template.id)} reason={recommendations.find(item => item.templateId === template.id)?.reason ?? (draft.selectedTemplateIds.includes(template.id) && recommendations.length ? "Kept from your earlier selection. Keep it or uncheck it as your needs change." : undefined)} onChange={() => selectTemplate(template.id)}/>)}</div>{recommendations.length > 0 && additionalTemplates.length > 0 && <details className={styles.moreTemplates}><summary>Explore other documents ({additionalTemplates.length})</summary><div className={styles.templateList}>{additionalTemplates.map(template => <TemplateOption key={template.id} template={template} selected={draft.selectedTemplateIds.includes(template.id)} onChange={() => selectTemplate(template.id)}/>)}</div></details>}<div className={styles.actions}><button className={styles.secondaryButton} onClick={() => go("purpose")}>Back</button><button className={styles.primaryButton} disabled={!draft.selectedTemplateIds.length} onClick={() => { setPackageIndex(0); go("packages"); }}>Continue<Symbol name="arrow" size={16}/></button></div><p className={styles.quietNote} style={{ marginTop: 16 }}>German reference documents. This flow prepares notes, not completed legal forms.</p></>}
              {draft.step === "packages" && currentPackage && <><p className={styles.taskCount}>{subjectLabel}. Task {Math.min(packageIndex, packages.length - 1) + 1} of {packages.length}.</p><h1 ref={heading} tabIndex={-1}>{currentPackage.title}</h1><p className={styles.intro}>{currentPackage.description}</p><form className={styles.surface} noValidate onSubmit={savePackage}><div className={styles.fields}>{currentPackage.fields.map(field => <div className={styles.field} key={currentPackage.id + field.id}><label htmlFor={currentPackage.id + "-" + field.id}>{field.label}<span aria-hidden="true">{field.required ? "Required" : "Optional"}</span></label>{field.multiline ? <textarea name={currentPackage.id + "-" + field.id} autoComplete="off" id={currentPackage.id + "-" + field.id} className={styles.textarea} value={draft.answers[currentPackage.id]?.[field.id] || ""} placeholder={field.placeholder} required={field.required} maxLength={MAX_ANSWER_LENGTH} aria-invalid={Boolean(fieldErrors[currentPackage.id + "-" + field.id])} aria-describedby={currentPackage.id + "-" + field.id + "-help" + (fieldErrors[currentPackage.id + "-" + field.id] ? " " + currentPackage.id + "-" + field.id + "-error" : "")} onChange={event => updateAnswer(currentPackage.id, field.id, event.target.value)}/> : <input name={currentPackage.id + "-" + field.id} id={currentPackage.id + "-" + field.id} className={styles.input} value={draft.answers[currentPackage.id]?.[field.id] || ""} placeholder={field.placeholder} required={field.required} maxLength={MAX_ANSWER_LENGTH} autoComplete="off" aria-invalid={Boolean(fieldErrors[currentPackage.id + "-" + field.id])} aria-describedby={currentPackage.id + "-" + field.id + "-help" + (fieldErrors[currentPackage.id + "-" + field.id] ? " " + currentPackage.id + "-" + field.id + "-error" : "")} onChange={event => updateAnswer(currentPackage.id, field.id, event.target.value)}/>}<small id={currentPackage.id + "-" + field.id + "-help"}>{field.help}</small>{fieldErrors[currentPackage.id + "-" + field.id] && <p id={currentPackage.id + "-" + field.id + "-error"} className={styles.fieldError}>{fieldErrors[currentPackage.id + "-" + field.id]}</p>}</div>)}</div><div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => packageIndex > 0 ? setPackageIndex(index => index - 1) : go("templates")}>Back</button><button className={styles.primaryButton} type="submit">{packageIndex >= packages.length - 1 ? "Review my draft" : "Save and continue"}</button><button type="button" className={styles.textButton + " " + styles.mutedButton} onClick={() => { setDraft(value => markPackagePending(value, currentPackage.id)); nextPackage(); }}>Leave this task open</button></div></form></>}
              {draft.step === "review" && <><h1 ref={heading} tabIndex={-1}>Your planning draft</h1><p className={styles.intro}>Read your notes, revisit a task, and keep the open questions for your next conversation.</p><div className={styles.surface}><div className={styles.reviewTop}><div><h2>{draft.subject === "someone-else" ? "A plan for someone else" : "A plan for yourself"}</h2><p>{progress.complete} of {progress.total} tasks answered. {progress.pending} still open.</p></div><button className={styles.textButton} onClick={() => go("subject")}>Edit who this is for</button></div><p className={styles.quietNote}>{TEMPLATES.filter(template => draft.selectedTemplateIds.includes(template.id)).map(template => template.title).join(", ")}</p><button className={styles.textButton} onClick={() => go("templates")}>Edit document choices</button>{packages.map(item => { const status = getPackageStatus(draft, item.id); return <section className={styles.reviewSection} key={item.id}><div className={styles.reviewSectionHead}><h3>{item.title}</h3><button className={styles.textButton} aria-label={"Edit " + item.title} onClick={() => editPackage(item.id)}>Edit</button></div><span className={styles.statusLabel} data-state={status}>{statusLabels[status]}</span><dl className={styles.reviewValues}>{item.fields.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{draft.answers[item.id]?.[field.id]?.trim() || <span className={styles.unanswered}>{field.required ? "Still open" : "Not provided (optional)"}</span>}</dd></div>)}</dl></section>; })}<p className={styles.inlineNote}>This is a planning draft. It does not grant authority or replace a completed legal form. Full legal PDFs, professional review, signatures and clinic sharing are separate steps.</p>{progress.reviewed ? <p className={styles.successNote} role="status">You reviewed this version. Editing an answer will require a new review.</p> : <button className={styles.secondaryButton} style={{ marginTop: 22 }} onClick={() => { setDraft(value => markReviewed(value)); requestAnimationFrame(() => downloadButton.current?.focus()); }}>Mark draft reviewed</button>}<div className={styles.actions}><button ref={downloadButton} className={styles.primaryButton} disabled={!progress.reviewed} onClick={download}>Download planning draft (.txt)</button><button className={styles.textButton} onClick={() => { setPackageIndex(Math.max(0, packages.length - 1)); go("packages"); }}>Back to tasks</button></div>{downloaded && <p className={styles.successNote} role="status">Your text download was started. Keep it as a planning draft for your next conversation.</p>}</div></>}
            </section>
            {["packages", "review"].includes(draft.step) && taskTree()}
          </div>
        </>
        <div className={styles.footerStatus}><span><Symbol name="lock" size={13}/>{storageIssue ? "In memory only" : "Saved in this tab. No cloud copy."}</span>{draft.subject && <span>{subjectLabel}</span>}</div>
        <p className={styles.prototypeNote}>Prototype: use sample details only. Closing this tab can remove your draft. Existing documents stay in Documents.</p>
      </>}
    </main>
    {confirmation && <PlanningConfirmation changingPerson={Boolean(confirmation.subject)} returnFocus={confirmation.returnFocus} onCancel={() => setConfirmation(null)} onConfirm={confirmChange} onConfirmedFocus={() => requestAnimationFrame(() => heading.current?.focus())}/>}
  </ConsumerShell>;
}
