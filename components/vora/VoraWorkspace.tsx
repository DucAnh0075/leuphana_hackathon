"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icons";
import { DOCUMENTS, STORAGE_KEY, answerKey, emptyWorkspace, parseWorkspace, progress, type Area, type DocumentId, type WorkspaceState } from "@/lib/vora";
import DocumentWorkshop from "./DocumentWorkshop";
import Prevention from "./Prevention";
import Vaccinations from "./Vaccinations";
import Travel from "./Travel";
import VoraAssistant from "./VoraAssistant";
import s from "./Vora.module.css";

const navigation: { id: Area; title: string; icon: "pages" | "document" | "pulse" | "shield" | "arrow" }[] = [
  { id: "overview", title: "Overview", icon: "pages" }, { id: "documents", title: "Documents", icon: "document" }, { id: "prevention", title: "Prevention", icon: "pulse" }, { id: "vaccinations", title: "Vaccinations", icon: "shield" }, { id: "travel", title: "Travel", icon: "arrow" },
];

export default function VoraWorkspace({ initialArea = "overview", initialDocument }: { initialArea?: Area; initialDocument?: DocumentId }) {
  const [area, setArea] = useState<Area>(initialArea);
  const [documentTarget, setDocumentTarget] = useState<DocumentId | undefined>(initialDocument);
  const [state, setState] = useState<WorkspaceState>(emptyWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [writeAllowed, setWriteAllowed] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [chat, setChat] = useState(false);
  const [chatContext, setChatContext] = useState<{ question: string; documentTitle?: string; moduleTitle?: string }>({ question: "" });
  const persistedRaw = useRef<string | null>(null);
  const chatTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Hydrate browser storage even when a background tab has no animation frames.
    const timer = window.setTimeout(() => {
      try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setState(parseWorkspace(saved)); persistedRaw.current = saved; }
      catch { setStorageError("Saved data could not be read. Existing data has been kept. Reload to retry, or use a temporary workspace."); setWriteAllowed(false); }
      setLoaded(true);
    }, 0);
    const changed = (event: StorageEvent) => { if (event.key === STORAGE_KEY && event.newValue !== persistedRaw.current) { setStorageError("This workspace changed in another tab. Reload to use the latest version before saving more changes."); setWriteAllowed(false); } };
    window.addEventListener("storage", changed); return () => { window.clearTimeout(timer); window.removeEventListener("storage", changed); };
  }, []);

  function update(next: WorkspaceState) {
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
  function navigate(next: Area, target?: DocumentId) { setArea(next); setDocumentTarget(target); setChatContext({ question: "" }); const url = new URL(window.location.href); url.searchParams.set("area", next); if (target) url.searchParams.set("doc", target); else url.searchParams.delete("doc"); window.history.replaceState(null, "", url); }
  function ask(question = "", documentTitle?: string, moduleTitle?: string) { chatTrigger.current = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null; setChatContext({ question, documentTitle, moduleTitle }); setChat(true); }
  const selected = DOCUMENTS.filter(doc => state.selected.includes(doc.id));
  const reviewed = selected.reduce((count, doc) => count + progress(doc, state), 0);
  const blocks = selected.reduce((count, doc) => count + doc.modules.length, 0);
  const navTitle = navigation.find(item => item.id === area)!.title;
  const chatDocument = DOCUMENTS.find(doc => doc.original === chatContext.documentTitle);
  const chatModule = chatDocument?.modules.find(module => module.title === chatContext.moduleTitle);
  function useExplanation(text: string) {
    if (!chatDocument || !chatModule) return;
    const key = answerKey(chatDocument.id, chatModule.id); const current = state.answers[key] || { value: "", note: "", reviewed: false };
    if (update({ ...state, answers: { ...state.answers, [key]: { ...current, note: `${current.note}${current.note ? "\n\n" : ""}AI explanation to review:\n${text}`, reviewed: false } }, completion: { ...state.completion, [chatDocument.id]: [] } })) setChat(false);
  }

  return <div className={s.app} lang="en">
    <aside className={s.sidebar} aria-label="VORA workspace">
      <a href="/vorsorge" className={s.brand} aria-label="VORA home"><span className={s.brandSymbol} aria-hidden="true">v</span>VORA<span className={s.brandDot}/></a>
      <div className={s.workspaceLabel}><span className={s.localAvatar}>Y</span><div>Your personal space<span>Care, considered.</span></div></div>
      <nav className={s.navigation} aria-label="Main navigation">{navigation.map(item => <button key={item.id} onClick={() => navigate(item.id)} aria-label={item.title} aria-current={area === item.id ? "page" : undefined}><Icon name={item.icon} width={20}/><span>{item.title}</span>{item.id === "documents" && selected.length > 0 && <span className={s.navCount} aria-hidden="true">{selected.length}</span>}</button>)}</nav>
      <div className={s.sidebarBottom}><div className={s.sidebarNote}><Icon name="shield" width={19}/><div>Your pace. Your decisions.<p>Keep the important things together.</p></div></div><a href="/vorsorge?view=documents"><Icon name="inbox" width={18}/> Signed-document archive</a><a href="/anmelden"><Icon name="users" width={18}/> Account & secure sharing</a><a className={s.legacyLink} href="/vorsorge?view=legacy">Open previous planning workspace</a></div>
    </aside>
    <div className={s.mainColumn}>
      <header className={s.topbar}><div className={s.breadcrumb}><span>My care</span><Icon name="chevron" width={13}/><strong>{navTitle}</strong></div><div className={s.topActions}><span className={s.saveState}><span className={writeAllowed ? s.statusDot : s.warningDot}/>{loaded ? writeAllowed ? "Saved in this browser" : "Temporary workspace" : "Loading local workspace"}</span><button className={s.assistantButton} onClick={() => ask()}><Icon name="signal" width={18}/> Ask VORA</button></div></header>
      <main id="main" tabIndex={-1} className={s.main}>
        {validationError && <div className={s.storageError} role="alert"><p>{validationError}</p><button className={s.textButton} onClick={() => setValidationError("")}>Dismiss</button></div>}
        {storageError && <div className={s.storageError} role="alert"><strong>Check your local workspace</strong><p>{storageError}</p><div className={s.buttonGroup}><button className={s.secondary} onClick={() => location.reload()}>Reload</button><button className={s.secondary} onClick={() => { setStorageError(""); setWriteAllowed(false); }}>Continue temporarily</button></div></div>}
        {!loaded ? <div className={s.empty} role="status">Loading your local workspace…</div> : <>
          {area === "overview" && <>
            <div className={s.sectionHeading}><div><p className={s.greeting}>Your care, in one place</p><h1>Your care, organised.</h1><p>Prepare your documents, keep vaccination records and find your next prevention step.</p></div><div className={s.overviewDate}><span>Personal workspace</span><strong>Start with what<br/>matters to you.</strong></div></div>
            <section className={s.startSurface} aria-labelledby="start-title"><div className={s.startCopy}><span className={s.workflowLabel}><Icon name="document" width={18}/> Your documents</span><h2 id="start-title">{selected.length ? "Pick up where you left off." : "Make your wishes understood."}</h2><p>{selected.length ? `${reviewed} of ${blocks} blocks reviewed across ${selected.length} selected ${selected.length === 1 ? "document" : "documents"}. Your open questions are kept with your notes.` : "A trusted person. Clear treatment wishes. A plan for support. Choose your documents and work through them one decision at a time."}</p><button className={s.primary} onClick={() => navigate("documents")}>{selected.length ? "Continue your documents" : "Choose your documents"}<Icon name="arrow" width={18}/></button><p className={s.startFootnote}>Based on the official German Ministry of Justice forms.</p></div><div className={s.documentRegister}><div className={s.registerHeader}><span>Your preparation folder</span><Icon name="pages" width={18}/></div>{DOCUMENTS.map((doc, index) => <button key={doc.id} onClick={() => navigate("documents", doc.id)}><span className={s.registerIndex}>{String(index + 1).padStart(2, "0")}</span><div><strong>{doc.title}</strong><span>{state.selected.includes(doc.id) ? `${progress(doc, state)} / ${doc.modules.length} blocks reviewed` : doc.original}</span></div><span className={state.selected.includes(doc.id) ? s.registerActive : s.registerOpen}>{state.selected.includes(doc.id) ? "In progress" : "Not started"}</span></button>)}<div className={s.registerFooter}><span>Choose</span><i/><span>Prepare</span><i/><span>Review</span><i/><span>Keep</span></div></div></section>
            <div className={s.overviewLower}><section className={s.yourNext}><div className={s.sectionBar}><h2>Beyond your documents</h2><span>Everything has its place</span></div><button onClick={() => navigate("prevention")}><span className={`${s.featureIcon} ${s.preventionIcon}`}><Icon name="pulse"/></span><div><strong>Understand your prevention options</strong><span>{state.profile.birthYear ? "Your age filters are ready. Explore public screening offers." : "Add your birth year to explore screening eligibility."}</span></div><Icon name="arrow" width={20}/></button><button onClick={() => navigate("vaccinations")}><span className={`${s.featureIcon} ${s.vaccineIcon}`}><Icon name="shield"/></span><div><strong>Keep your vaccination record together</strong><span>{state.vaccines.length ? `${state.vaccines.length} self-entered ${state.vaccines.length === 1 ? "entry" : "entries"}. Review or add your next record.` : "Start with your booklet. Add an entry in your own time."}</span></div><Icon name="arrow" width={20}/></button><button onClick={() => navigate("travel")}><span className={`${s.featureIcon} ${s.travelIcon}`}><Icon name="arrow"/></span><div><strong>{state.travel.destination ? `Prepare for ${state.travel.destination}` : "Plan ahead for a trip"}</strong><span>{state.travel.destination ? `${state.travel.checks.length} of 5 preparation checks completed by you.` : "A destination, official sources and your next steps."}</span></div><Icon name="arrow" width={20}/></button></section><aside className={s.overviewAside}><div className={s.smallAssistant}><Icon name="signal" width={26}/><h2>Understanding comes first.</h2><p>Not sure what a term means? Ask VORA about the thing you are working on.</p><button className={s.textButton} onClick={() => ask("How do a power of attorney, patient directive and care directive differ?")}>Start a conversation<Icon name="arrow" width={17}/></button></div><div className={s.localNotice}><Icon name="shield" width={18}/><p><strong>You control what you share.</strong> Preparation is saved in this browser, not in your account. Chat shares only what you explicitly send. Use your own device; browser storage is not an encrypted vault.</p></div></aside></div>
          </>}
          {area === "documents" && <DocumentWorkshop key={documentTarget || "selected"} state={state} update={update} ask={ask} initialDocument={documentTarget}/>}
          {area === "prevention" && <Prevention state={state} update={update}/>}
          {area === "vaccinations" && <Vaccinations state={state} update={update}/>}
          {area === "travel" && <Travel state={state} update={update}/>}
        </>}
        <footer className={s.footer}><span>VORA · Space for what matters.</span><span>Preparation and information. Your decisions stay yours.</span></footer>
      </main>
    </div>
    <Dialog.Root open={chat} onOpenChange={setChat}><Dialog.Portal><Dialog.Overlay className={s.chatOverlay}/><Dialog.Content className={s.chatDrawer} aria-describedby="assistant-description" onCloseAutoFocus={event => { event.preventDefault(); chatTrigger.current?.focus(); }}><Dialog.Title className={s.srOnly}>Ask VORA</Dialog.Title><Dialog.Description id="assistant-description" className={s.srOnly}>Ask general questions about your care preparation. Sharing with the AI provider requires your agreement.</Dialog.Description><VoraAssistant area={area} documentTitle={chatContext.documentTitle} moduleTitle={chatContext.moduleTitle} initialQuestion={chatContext.question} onClose={() => setChat(false)} onUseAnswer={chatModule ? useExplanation : undefined}/></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
