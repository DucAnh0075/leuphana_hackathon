"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icons";
import { DOCUMENTS, STORAGE_KEY, answerKey, emptyWorkspace, parseWorkspace, progress, type Area, type DocumentId, type WorkspaceState } from "@/lib/vora";
import DocumentWorkshop from "./DocumentWorkshop";
import Prevention from "./Prevention";
import { HealthPass } from "./HealthPass";
import Travel from "./Travel";
import VoraAssistant from "./VoraAssistant";
import AgentAvatar from "./AgentAvatar";
import { useVoraLanguage } from "./VoraLanguage";
import s from "./Vora.module.css";

const navigation: { id: Area; title: string; icon: "pages" | "document" | "pulse" | "shield" | "arrow" }[] = [
  { id: "overview", title: "Overview", icon: "pages" }, { id: "documents", title: "Documents", icon: "document" }, { id: "prevention", title: "Prevention", icon: "pulse" }, { id: "vaccinations", title: "Health pass", icon: "shield" }, { id: "travel", title: "Travel", icon: "arrow" },
];

export type ManagedWorkspace = { state: WorkspaceState; onChange: (state: WorkspaceState) => boolean; onEditCase: () => void; saveStatus: string };
export default function VoraWorkspace({ initialArea = "overview", initialDocument, initialPhase, initialBlock, managed }: { initialArea?: Area; initialDocument?: DocumentId; initialPhase?: number; initialBlock?: string; managed?: ManagedWorkspace }) {
  const { locale, t } = useVoraLanguage();
  const [area, setArea] = useState<Area>(initialArea);
  const [visitedHealthPass, setVisitedHealthPass] = useState(initialArea === "vaccinations");
  const [documentTarget, setDocumentTarget] = useState<DocumentId | undefined>(initialDocument);
  const [documentPhase, setDocumentPhase] = useState(initialPhase);
  const [documentBlock, setDocumentBlock] = useState(initialBlock);
  const [navigationId, setNavigationId] = useState(0);
  const [localState, setState] = useState<WorkspaceState>(emptyWorkspace);
  const state = managed?.state ?? localState;
  const [loaded, setLoaded] = useState(!!managed);
  const [storageError, setStorageError] = useState("");
  const [writeAllowed, setWriteAllowed] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [chat, setChat] = useState(false);
  const [chatContext, setChatContext] = useState<{ question: string; documentTitle?: string; moduleTitle?: string }>({ question: "" });
  const persistedRaw = useRef<string | null>(null);
  const chatTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (managed) return;
    // Hydrate browser storage even when a background tab has no animation frames.
    const timer = window.setTimeout(() => {
      try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setState(parseWorkspace(saved)); persistedRaw.current = saved; }
      catch { setStorageError("Saved data could not be read. Existing data has been kept. Reload to retry, or use a temporary workspace."); setWriteAllowed(false); }
      setLoaded(true);
    }, 0);
    const changed = (event: StorageEvent) => { if (event.key === STORAGE_KEY && event.newValue !== persistedRaw.current) { setStorageError("This workspace changed in another tab. Reload to use the latest version before saving more changes."); setWriteAllowed(false); } };
    window.addEventListener("storage", changed); return () => { window.clearTimeout(timer); window.removeEventListener("storage", changed); };
  }, [managed]);

  function update(next: WorkspaceState) {
    if (managed) return managed.onChange(next);
    if (!loaded || (storageError && writeAllowed === false)) return false;
    let admitted: WorkspaceState;
    try { admitted = parseWorkspace(JSON.stringify(next)); setValidationError(""); }
    catch { setValidationError("This change could not be saved. Check dates and field lengths. Your saved workspace has not been changed."); return false; }
    if (!writeAllowed) { setState(admitted); return true; }
    try {
      if (localStorage.getItem(STORAGE_KEY) !== persistedRaw.current) { setStorageError("This workspace changed in another tab. Reload before saving; the newer saved version has been kept."); setWriteAllowed(false); return false; }
      const serialized = JSON.stringify(admitted); localStorage.setItem(STORAGE_KEY, serialized); persistedRaw.current = serialized; setState(admitted); return true;
    }
    catch { setState(admitted); setStorageError("Browser storage is unavailable. Your latest change is held in this tab. Continue temporarily or enable storage and reload."); setWriteAllowed(false); return true; }
  }
  function navigate(next: Area, target?: DocumentId, phase?: number) {
    if (next === "vaccinations") setVisitedHealthPass(true);
    setArea(next); setDocumentTarget(target); setDocumentPhase(phase); setDocumentBlock(undefined); setNavigationId(value => value + 1); setChatContext({ question: "" });
    const url = new URL(window.location.href); url.searchParams.set("area", next);
    for (const key of ["doc", "phase", "block"]) url.searchParams.delete(key);
    if (next === "documents" && target) url.searchParams.set("doc", target);
    if (next === "documents" && phase !== undefined) url.searchParams.set("phase", ["select", "blocks", "review", "finish"][phase]);
    window.history.replaceState(null, "", url);
    // Orient this navigation before a newly mounted document editor focuses its active block.
    window.document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function ask(question = "", documentTitle?: string, moduleTitle?: string) {
    chatTrigger.current = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    if (!question && !documentTitle && area === "documents") {
      const params = new URL(window.location.href).searchParams;
      const currentDocument = DOCUMENTS.find(doc => doc.id === params.get("doc"));
      const currentModule = params.get("phase") === "blocks" ? currentDocument?.modules.find(module => module.id === params.get("block")) : undefined;
      documentTitle = currentDocument?.original; moduleTitle = currentModule?.title;
    }
    setChatContext({ question, documentTitle, moduleTitle }); setChat(true);
  }
  const selected = DOCUMENTS.filter(doc => state.selected.includes(doc.id));
  const reviewed = selected.reduce((count, doc) => count + progress(doc, state), 0);
  const blocks = selected.reduce((count, doc) => count + doc.modules.length, 0);
  const nextDocument = selected.find(doc => progress(doc, state) < doc.modules.length);
  const nextTravelCheck = [
    { id: "country", title: "Check official destination advice" },
    { id: "entry", title: "Check entry requirements" },
    { id: "consultation", title: "Prepare a travel health consultation" },
    { id: "proof", title: "Check your vaccination proof" },
    { id: "documents", title: "Prepare your travel documents" },
  ].find(check => !state.travel.checks.includes(check.id));
  const nextAction: { title: string; detail: string; label: string; area: Area; document?: DocumentId; phase?: number } = nextDocument
    ? { title: `Continue ${nextDocument.title.toLowerCase()}`, detail: `${nextDocument.modules.length - progress(nextDocument, state)} blocks still open. Your existing notes are kept.`, label: "Continue document", area: "documents", document: nextDocument.id, phase: 1 }
    : !selected.length
      ? { title: "Choose a document to prepare", detail: "Start with representation, treatment wishes or support from a guardian.", label: "Choose your documents", area: "documents" as Area }
      : state.travel.destination && nextTravelCheck
        ? { title: nextTravelCheck.title, detail: `${state.travel.destination}: ${state.travel.checks.length} of 5 preparation checks completed.`, label: "Continue trip preparation", area: "travel" as Area }
        : !state.profile.birthYear
            ? { title: "Find your screening options", detail: "Add your birth year to filter the public prevention offers.", label: "Set prevention filters", area: "prevention" as Area }
            : { title: "Review your document next steps", detail: "Your selected blocks are reviewed. Check the steps for official forms, signatures and storage.", label: "Review documents", area: "documents", document: selected[0].id, phase: 2 };
  const navTitle = navigation.find(item => item.id === area)!.title;
  const chatDocument = DOCUMENTS.find(doc => doc.original === chatContext.documentTitle);
  const chatModule = chatDocument?.modules.find(module => module.title === chatContext.moduleTitle);
  function useExplanation(text: string) {
    if (!chatDocument || !chatModule) return;
    const key = answerKey(chatDocument.id, chatModule.id); const current = state.answers[key] || { value: "", note: "", reviewed: false };
    if (update({ ...state, answers: { ...state.answers, [key]: { ...current, note: `${current.note}${current.note ? "\n\n" : ""}AI explanation to review:\n${text}`, reviewed: false } }, completion: { ...state.completion, [chatDocument.id]: [] } })) setChat(false);
  }

  const Content = managed ? "section" : "main";
  return <div className={managed ? s.embeddedApp : s.app} lang={locale}>
    {!managed && <aside className={s.sidebar} aria-label="VORAcard workspace">
      <a href="/vorsorge" className={s.brand} aria-label="VORAcard home"><span className={s.brandSymbol} aria-hidden="true">v</span>VORAcard<span className={s.brandDot}/></a>
      <div className={s.workspaceLabel}><span className={s.localAvatar}>Y</span><div>Your personal space<span>Care, considered.</span></div></div>
      <nav className={s.navigation} aria-label="Main navigation">{navigation.map(item => <button key={item.id} onClick={() => navigate(item.id)} aria-label={item.title} aria-current={area === item.id ? "page" : undefined}><Icon name={item.icon} width={20}/><span>{item.title}</span>{item.id === "documents" && selected.length > 0 && <span className={s.navCount} aria-hidden="true">{selected.length}</span>}</button>)}</nav>
      <div className={s.sidebarBottom}><div className={s.sidebarNote}><Icon name="shield" width={19}/><div>Your pace. Your decisions.<p>Keep the important things together.</p></div></div><a href="/vorsorge?view=documents"><Icon name="inbox" width={18}/> Signed-document archive</a><a href="/anmelden"><Icon name="users" width={18}/> Account & secure sharing</a><a className={s.legacyLink} href="/vorsorge?view=legacy">Open previous planning workspace</a></div>
    </aside>}
    <div className={s.mainColumn}>
      {!managed && <header className={s.topbar}><div className={s.breadcrumb}><span>My care</span><Icon name="chevron" width={13}/><strong>{navTitle}</strong></div><div className={s.topActions}><span className={s.saveState}><span className={writeAllowed ? s.statusDot : s.warningDot}/>{loaded ? writeAllowed ? "Saved in this browser" : "Temporary workspace" : "Loading local workspace"}</span></div></header>}
      <Content id={managed ? undefined : "main"} tabIndex={-1} className={managed ? s.embeddedMain : s.main}>
        {validationError && <div className={s.storageError} role="alert"><p>{validationError}</p><button className={s.textButton} onClick={() => setValidationError("")}>Dismiss</button></div>}
        {storageError && <div className={s.storageError} role="alert"><strong>Check your local workspace</strong><p>{storageError}</p><div className={s.buttonGroup}><button className={s.secondary} onClick={() => location.reload()}>Reload</button><button className={s.secondary} onClick={() => { setStorageError(""); setWriteAllowed(false); }}>Continue temporarily</button></div></div>}
        {!loaded ? <div className={s.empty} role="status">Loading your local workspace…</div> : <>
          {area === "overview" && <>
            <div className={s.sectionHeading}><div><h1>Your care, organised.</h1><p>Documents, health records and the next thing to do.</p></div></div>
            <section className={s.nextAction} aria-labelledby="next-action-title"><div className={s.nextActionIcon}><Icon name="arrow" width={22}/></div><div><span className={s.nextActionLabel}>Next action</span><h2 id="next-action-title">{nextAction.title}</h2><p>{nextAction.detail}</p></div><button className={s.primary} onClick={() => navigate(nextAction.area, nextAction.document, nextAction.phase)}>{nextAction.label}<Icon name="arrow" width={17}/></button></section>
            <div className={s.overviewSections}>
              <section className={s.documentSection} aria-labelledby="documents-heading">
                <div className={s.sectionBar}><div><h2 id="documents-heading">Your documents</h2><p>{selected.length ? `${reviewed} of ${blocks} selected blocks reviewed` : "Choose the documents you need"}</p></div><button className={s.textButton} onClick={() => navigate("documents")}>Manage documents</button></div>
                <div className={s.documentRows}>{DOCUMENTS.map(doc => {
                  const isSelected = state.selected.includes(doc.id);
                  const count = progress(doc, state);
                  return <button key={doc.id} onClick={() => navigate("documents", doc.id)} className={s.documentRow}>
                    <Icon name="document" width={23}/><div className={s.documentRowCopy}><strong>{doc.title}</strong><span>{doc.original}</span><div className={s.documentProgress}><progress value={isSelected ? count : 0} max={doc.modules.length} aria-label={`${doc.title}: ${isSelected ? count : 0} of ${doc.modules.length} blocks reviewed`}/><span>{isSelected ? `${count}/${doc.modules.length} reviewed` : "Not selected"}</span></div></div><Icon name="chevron" width={17}/>
                  </button>;
                })}</div>
                <p className={s.sectionNote}>Preparation based on the official German Ministry of Justice forms.</p>
              </section>
              <section className={s.yourNext} aria-labelledby="health-heading"><div className={s.sectionBar}><h2 id="health-heading">Health & travel</h2></div><button onClick={() => navigate("prevention")}><span className={`${s.featureIcon} ${s.preventionIcon}`}><Icon name="pulse"/></span><div><strong>{state.profile.birthYear ? "Review your screening options" : "Set your prevention filters"}</strong><span>{state.profile.birthYear ? `Birth year ${state.profile.birthYear}. Explore public screening offers.` : "Add your birth year to find relevant public offers."}</span></div><Icon name="arrow" width={18}/></button><button onClick={() => navigate("vaccinations")}><span className={`${s.featureIcon} ${s.vaccineIcon}`}><Icon name="shield"/></span><div><strong>Open your Health pass</strong><span>Sync Demo-ePA vaccinations and prepare your organ donation card.</span></div><Icon name="arrow" width={18}/></button><button onClick={() => navigate("travel")}><span className={`${s.featureIcon} ${s.travelIcon}`}><Icon name="arrow"/></span><div><strong>{state.travel.destination ? `Continue your ${state.travel.destination} checklist` : "Prepare a trip"}</strong><span>{state.travel.destination ? `${state.travel.checks.length} of 5 checks completed by you.` : "Add a destination and departure date."}</span></div><Icon name="arrow" width={18}/></button></section>
            </div>
            <div className={s.localNotice}><Icon name="shield" width={18}/><p><strong>Your preparation stays in this browser.</strong> Use your own device; this is not an encrypted vault. Chat shares your submitted conversation and public screen context after consent.</p></div>
          </>}
          {area === "documents" && <DocumentWorkshop key={`${documentTarget || "selected"}-${navigationId}`} state={state} update={update} ask={ask} initialDocument={documentTarget} initialPhase={documentPhase} initialBlock={documentBlock} caseManaged={!!managed} onEditCase={managed?.onEditCase}/>}
          {area === "prevention" && <Prevention state={state} update={update}/>}
          {visitedHealthPass && <div hidden={area !== "vaccinations"}><HealthPass legacyVaccines={state.vaccines} ask={ask}/></div>}
          {area === "travel" && <Travel state={state} update={update}/>}
        </>}
        {!managed && <footer className={s.footer}><span>VORAcard · Space for what matters.</span><span>Preparation and information. Your decisions stay yours.</span></footer>}
      </Content>
    </div>
    <button className={s.agentLauncher} aria-label={t("VORAcard fragen", "Ask VORAcard")} title={t("VORAcard fragen", "Ask VORAcard")} aria-expanded={chat} aria-controls="vora-chat" aria-haspopup="dialog" onClick={() => ask()}><AgentAvatar animated/></button>
    <Dialog.Root open={chat} onOpenChange={setChat}><Dialog.Portal><Dialog.Overlay className={s.chatOverlay}/><Dialog.Content id="vora-chat" className={s.chatDrawer} aria-describedby="assistant-description" onCloseAutoFocus={event => { event.preventDefault(); chatTrigger.current?.focus(); }}><Dialog.Title className={s.srOnly}>{t("VORAcard fragen", "Ask VORAcard")}</Dialog.Title><Dialog.Description id="assistant-description" className={s.srOnly}>{t("Fragen zur Vorsorgevorbereitung. Vor dem Teilen mit dem KI-Anbieter ist deine Zustimmung erforderlich.", "Ask general questions about your care preparation. Sharing with the AI provider requires your agreement.")}</Dialog.Description><VoraAssistant area={area} documentTitle={chatContext.documentTitle} moduleTitle={chatContext.moduleTitle} initialQuestion={chatContext.question} onClose={() => setChat(false)} onUseAnswer={chatModule ? useExplanation : undefined}/></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
