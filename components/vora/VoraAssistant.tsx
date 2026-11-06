"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { DOCUMENTS } from "@/lib/vora";
import AgentAvatar from "./AgentAvatar";
import { useVoraLanguage } from "./VoraLanguage";
import { getLocalizedDocuments } from "@/lib/vora-document-language";
import s from "./Vora.module.css";

export type VoraAssistantProps = { area: string; documentTitle?: string; moduleTitle?: string; initialQuestion?: string; onClose: () => void; onUseAnswer?: (text: string) => void };
const germanUI: Record<string, string> = {
  "Ask VORAcard": "Frag VORAcard",
  "Temporary chat · clears on close": "Temporärer Chat · wird beim Schließen gelöscht",
  "Public guidance": "Allgemeine Orientierung",
  "VORAcard assistant": "VORAcard Assistent",
  "Close assistant": "Assistent schließen",
  "Conversation": "Gespräch",
  "Use assistant with": "Assistent verwenden mit",
  "My ChatGPT account": "Mein ChatGPT-Konto",
  "Configured API key": "Hinterlegter API-Schlüssel",
  "Disconnect ChatGPT": "ChatGPT trennen",
  "Cancelling sign-in…": "Anmeldung wird abgebrochen…",
  "Complete sign-in in the opened window.": "Schließe die Anmeldung im geöffneten Fenster ab.",
  "Cancel sign-in": "Anmeldung abbrechen",
  "Continue with ChatGPT": "Mit ChatGPT fortfahren",
  "Checking connection…": "Verbindung wird geprüft…",
  "Check connection status": "Verbindungsstatus prüfen",
  "What would you like to clarify?": "Was möchtest du klären?",
  "Ask a general question or choose a starting point.": "Stell eine allgemeine Frage oder wähle einen Einstieg.",
  "Add explanation to my notes": "Erklärung in meine Notizen übernehmen",
  "Conversation limit reached": "Gesprächslimit erreicht",
  "The complete conversation is sent for context. Start a new conversation before exceeding 24 messages or 18,000 characters; nothing is silently removed.": "Der vollständige Chat wird als Kontext gesendet. Beginne vor 24 Nachrichten oder 18.000 Zeichen ein neues Gespräch. Es wird nichts unbemerkt entfernt.",
  "Assistant unavailable": "Assistent nicht verfügbar",
  "Retry question": "Frage erneut senden",
  "Official references": "Offizielle Quellen",
  "Selected public guidance for this topic. No live lookup.": "Ausgewählte öffentliche Hinweise zum Thema. Keine Live-Recherche.",
  "Explain more simply": "Einfacher erklären",
  "What should I clarify?": "Was sollte ich klären?",
  "Clear this conversation? Your unsent question will be kept.": "Diesen Chat löschen? Deine ungesendete Frage bleibt erhalten.",
  "Cancel": "Abbrechen",
  "Clear & start new": "Löschen und neu beginnen",
  "Start new conversation": "Neues Gespräch starten",
  "What is shared with the AI?": "Was wird mit der KI geteilt?",
  "I agree to send my questions and this conversation to OpenAI, together with the selected topic and public VORAcard explanations.": "Ich stimme zu, meine Fragen und diesen Chat mit dem gewählten Thema und öffentlichen VORAcard-Erklärungen an OpenAI zu senden.",
  "Your question": "Deine Frage",
  "API key mode": "API-Schlüssel",
  "ChatGPT connected": "ChatGPT verbunden",
  "ChatGPT plan unavailable": "ChatGPT-Tarif nicht verfügbar",
  "Connect your ChatGPT account": "ChatGPT-Konto verbinden",
  "Sign in with ChatGPT to check whether your plan can be used here.": "Melde dich mit ChatGPT an, um zu prüfen, ob dein Tarif hier verfügbar ist.",
  "What are my organ donation card choices?": "Welche Möglichkeiten habe ich beim Organspendeausweis?",
  "How can this relate to my patient directive?": "Wie hängt das mit meiner Patientenverfügung zusammen?",
  "Can I leave my donation decision open?": "Kann ich meine Entscheidung zur Organspende offen lassen?",
  "Explain this block in plain language.": "Erkläre diesen Baustein in einfachen Worten.",
  "What should I clarify before completing this block?": "Was sollte ich vor diesem Baustein klären?",
  "Can I leave this question open?": "Kann ich diese Frage offen lassen?",
  "How do these three documents differ?": "Wie unterscheiden sich diese drei Dokumente?",
  "What needs a signature?": "Was muss unterschrieben werden?",
  "When should I speak to a professional?": "Wann sollte ich fachliche Beratung einholen?",
  "What is the difference between a vaccination record and proof?": "Was unterscheidet einen Impfeintrag von einem Nachweis?",
  "When does the measles proof requirement apply?": "Wann gilt die Masern-Nachweispflicht?",
  "How do entry requirements differ from vaccination recommendations?": "Wie unterscheiden sich Einreisevorschriften und Impfempfehlungen?",
  "Where can I check official travel health information?": "Wo finde ich offizielle Informationen zur Reisegesundheit?",
  "What should I prepare first?": "Was sollte ich zuerst vorbereiten?",
  "Explain statutory screening eligibility.": "Welche gesetzlichen Früherkennungsangebote gibt es?",
  "What can VORAcard help me understand?": "Wobei hilft mir VORAcard?",
  "Can you explain that more simply?": "Kannst du das einfacher erklären?",
  "Which point should I clarify with a professional?": "Welchen Punkt sollte ich mit einer Fachperson klären?",
  "Sending…": "Wird gesendet…",
  "Send": "Senden",
  "You": "Du",
  "Ask without personal details…": "Frage ohne persönliche Angaben…",
  "Connection status could not be checked. Try again.": "Der Verbindungsstatus konnte nicht geprüft werden. Bitte erneut versuchen.",
  "Connection status could not be checked.": "Der Verbindungsstatus konnte nicht geprüft werden.",
  "Sign-in cancelled. You can try again when you are ready.": "Die Anmeldung wurde abgebrochen. Du kannst sie erneut starten.",
  "The sign-in window is closed, but cancellation could not be confirmed. Check connection status before trying again.": "Das Anmeldefenster ist geschlossen. Der Abbruch konnte nicht bestätigt werden. Prüfe vor einem neuen Versuch den Verbindungsstatus.",
  "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.": "Dein Browser blockiert das Anmeldefenster. Erlaube Pop-ups für diese Seite und versuche es erneut.",
  "Sign-in timed out. No question was sent. Try connecting again.": "Die Anmeldefrist ist abgelaufen. Es wurde keine Frage gesendet. Verbinde dich erneut.",
  "Connection could not be checked. Try again.": "Die Verbindung konnte nicht geprüft werden. Bitte erneut versuchen.",
  "Sign-in could not start. Try again.": "Die Anmeldung konnte nicht starten. Bitte erneut versuchen.",
  "The sign-in address could not be verified.": "Die Anmeldeadresse konnte nicht geprüft werden.",
  "Could not disconnect. Try again.": "Die Verbindung konnte nicht getrennt werden. Bitte erneut versuchen.",
  "The assistant could not answer. Please try again.": "Der Assistent konnte nicht antworten. Bitte erneut versuchen.",
  "The request took too long or was cancelled. Your question is kept here; you can retry.": "Die Anfrage dauerte zu lange oder wurde abgebrochen. Deine Frage bleibt erhalten und kann erneut gesendet werden."
};

type Message = { role: "user" | "assistant"; content: string };
type Source = { title: string; url: string };
type Connection = { available: boolean; connected: boolean; planEnabled: boolean; pending: boolean; accountLabel?: string; reason?: string; models?: { slug: string; displayName: string }[] };
type Provider = "chatgpt" | "apiKey";

export default function VoraAssistant({ area, documentTitle, moduleTitle, initialQuestion = "", onClose, onUseAnswer }: VoraAssistantProps) {
  const { locale, t } = useVoraLanguage();
  const tr = (text: string) => locale === "de" ? germanUI[text] || text : text;
  const canonicalDocument = DOCUMENTS.find(document => document.original === documentTitle || document.title === documentTitle);
  const localDocument = getLocalizedDocuments(locale).find(document => document.id === canonicalDocument?.id);
  const canonicalModule = canonicalDocument?.modules.find(module => module.title === moduleTitle);
  const contextLabel = localDocument?.modules.find(module => module.id === canonicalModule?.id)?.title || localDocument?.title || (moduleTitle === "Organ donation card" ? t("Organspendeausweis", "Organ donation card") : moduleTitle === "Vaccination passport" ? t("Impfpass", "Vaccination passport") : documentTitle === "Health pass" ? t("Gesundheits-Pass", "Health pass") : t(({ overview: "Übersicht", documents: "Dokumente", prevention: "Vorsorge", vaccinations: "Gesundheits-Pass", travel: "Reisen" } as Record<string,string>)[area] || "VORAcard", area.charAt(0).toUpperCase() + area.slice(1)));
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(initialQuestion);
  const [previousQuestion, setPreviousQuestion] = useState(initialQuestion);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [pending, setPending] = useState<Message[] | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [provider, setProvider] = useState<Provider>("chatgpt");
  const connectionAbort = useRef<AbortController | null>(null);
  const popup = useRef<Window | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionAttempt = useRef(0);
  const activeAttempt = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  if (previousQuestion !== initialQuestion) { setPreviousQuestion(initialQuestion); setDraft(initialQuestion); }
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/vora/chatgpt", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Connection status could not be checked. Try again.");
        const status = await response.json();
        if (typeof status.available !== "boolean" || typeof status.connected !== "boolean" || typeof status.planEnabled !== "boolean") throw new Error("Connection status could not be checked. Try again.");
        setConnection(status);
      }).catch(failure => { if (!controller.signal.aborted) setConnectionError(failure instanceof Error ? failure.message : "Connection status could not be checked."); });
    return () => {
      controller.abort();
      connectionAbort.current?.abort();
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
      popup.current?.close();
      if (activeAttempt.current) void fetch("/api/vora/chatgpt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }), keepalive: true }).catch(() => undefined);
      activeAttempt.current = false;
      connectionAttempt.current = -1;
    };
  }, []);
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "instant" }); }, [messages, loading]);

  async function readConnection(signal?: AbortSignal) {
    const response = await fetch("/api/vora/chatgpt", { cache: "no-store", signal });
    const status = await response.json();
    if (!response.ok || typeof status.available !== "boolean" || typeof status.connected !== "boolean" || typeof status.planEnabled !== "boolean") throw new Error("Connection status could not be checked. Try again.");
    return status as Connection;
  }

  function stopConnecting() {
    connectionAttempt.current++;
    activeAttempt.current = false;
    connectionAbort.current?.abort();
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (connectionTimeout.current) clearTimeout(connectionTimeout.current);
    popup.current?.close();
    popup.current = null;
    setConnecting(false);
  }

  async function cancelConnection(message = "Sign-in cancelled. You can try again when you are ready.") {
    stopConnecting();
    setCancelling(true);
    setConnectionError(message);
    try {
      const response = await fetch("/api/vora/chatgpt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
      if (!response.ok) throw new Error();
    } catch { setConnectionError("The sign-in window is closed, but cancellation could not be confirmed. Check connection status before trying again."); }
    finally { setCancelling(false); }
  }

  async function connect() {
    if (connecting || cancelling || loading) return;
    const windowHandle = window.open("about:blank", "vora-chatgpt-signin", "popup,width=520,height=720");
    if (!windowHandle) { setConnectionError("Your browser blocked the sign-in window. Allow pop-ups for this site, then try again."); return; }
    popup.current = windowHandle;
    const attempt = ++connectionAttempt.current;
    activeAttempt.current = true;
    const controller = new AbortController();
    connectionAbort.current = controller;
    setConnecting(true); setConnectionError("");
    const started = Date.now();
    const timeout = setTimeout(() => { if (connectionAttempt.current === attempt) void cancelConnection("Sign-in timed out. No question was sent. Try connecting again."); }, 300000);
    connectionTimeout.current = timeout;
    async function poll() {
      if (connectionAttempt.current !== attempt) { clearTimeout(timeout); return; }
      try {
        const status = await readConnection(controller.signal);
        if (connectionAttempt.current !== attempt) return;
        setConnection(status);
        if (!status.pending && status.connected) { clearTimeout(timeout); stopConnecting(); setProvider("chatgpt"); return; }
        if (!status.pending && !status.connected && status.reason) { clearTimeout(timeout); stopConnecting(); setConnectionError(status.reason); return; }
        // OAuth may sever window.opener through COOP, so `closed` is not proof of cancellation.
        if (Date.now() - started >= 300000) return;
        pollTimer.current = setTimeout(() => void poll(), 2000);
      } catch (failure) {
        if (connectionAttempt.current !== attempt) return;
        clearTimeout(timeout);
        await cancelConnection(failure instanceof Error ? failure.message : "Connection could not be checked. Try again.");
      }
    }
    try {
      const response = await fetch("/api/vora/chatgpt", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ action: "start" }) });
      const payload = await response.json();
      if (connectionAttempt.current !== attempt) return;
      if (!response.ok || typeof payload.authorizationUrl !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "Sign-in could not start. Try again.");
      const authorization = new URL(payload.authorizationUrl);
      if (authorization.origin !== "https://auth.openai.com" || authorization.pathname !== "/api/accounts/authorize") throw new Error("The sign-in address could not be verified.");
      windowHandle.location.href = authorization.href;
      void poll();
    } catch (failure) {
      if (connectionAttempt.current !== attempt) return;
      clearTimeout(timeout);
      await cancelConnection(failure instanceof Error ? failure.message : "Sign-in could not start. Try again.");
    }
  }

  async function refreshConnection() {
    setConnectionError("");
    try { setConnection(await readConnection()); }
    catch (failure) { setConnectionError(failure instanceof Error ? failure.message : "Connection status could not be checked."); }
  }

  async function disconnect() {
    setConnectionError("");
    try {
      const response = await fetch("/api/vora/chatgpt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect" }) });
      if (!response.ok) throw new Error("Could not disconnect. Try again.");
      setConnection(await readConnection());
    } catch (failure) { setConnectionError(failure instanceof Error ? failure.message : "Could not disconnect. Try again."); }
  }

  const ready = provider === "apiKey" || Boolean(connection?.connected && connection.planEnabled);

  async function send(retry?: Message[]) {
    if (!consent || !ready || loading || (!retry && !draft.trim())) return;
    const next: Message[] = retry || [...messages, { role: "user", content: draft.trim() }];
    if (next.length > 24 || next.reduce((count, message) => count + message.content.length, 0) > 18000) { setLimitReached(true); return; }
    setMessages(next); setPending(next); setDraft(""); setLoading(true); setError("");
    abort.current = new AbortController();
    const timeout = setTimeout(() => abort.current?.abort(), 45000);
    try {
      const response = await fetch("/api/vora/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.current.signal, body: JSON.stringify({ messages: next, context: { area, ...(documentTitle ? { documentTitle } : {}), ...(moduleTitle ? { moduleTitle } : {}) }, locale, consent: true, provider }) });
      const payload = await response.json();
      if (!response.ok || payload.mode !== "live" || typeof payload.message !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "The assistant could not answer. Please try again.");
      setMessages([...next, { role: "assistant", content: payload.message }]); setPending(null);
      setSources(Array.isArray(payload.sources) ? payload.sources.filter((source: Source) => source && typeof source.title === "string" && typeof source.url === "string" && source.url.startsWith("https://")) : []);
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "The request took too long or was cancelled. Your question is kept here; you can retry.");
    } finally { clearTimeout(timeout); setLoading(false); }
  }

  const organCardContext = area === "vaccinations" && documentTitle === "Health pass" && moduleTitle === "Organ donation card";
  const documentBlockContext = area === "documents" && DOCUMENTS.some(document => (document.original === documentTitle || document.title === documentTitle) && document.modules.some(block => block.title === moduleTitle));
  const prompts = organCardContext ? ["What are my organ donation card choices?", "How can this relate to my patient directive?", "Can I leave my donation decision open?"] : documentBlockContext ? ["Explain this block in plain language.", "What should I clarify before completing this block?", "Can I leave this question open?"] : area === "documents" ? ["How do these three documents differ?", "What needs a signature?", "When should I speak to a professional?"] : area === "vaccinations" ? ["What is the difference between a vaccination record and proof?", "When does the measles proof requirement apply?"] : area === "travel" ? ["How do entry requirements differ from vaccination recommendations?", "Where can I check official travel health information?"] : ["What should I prepare first?", "Explain statutory screening eligibility.", "What can VORAcard help me understand?"];

  return <section className={s.assistant} aria-label={tr("VORAcard assistant")}>
    <header className={s.assistantHeader}><div className={s.assistantAvatar}><AgentAvatar/></div><div><h2>{tr("Ask VORAcard")}</h2><p>{tr("Temporary chat · clears on close")}</p></div><button className={s.iconButton} onClick={onClose} aria-label={tr("Close assistant")}><Icon name="close"/></button></header>
    <div className={s.assistantContext}><Icon name="pages" width={16}/><span>{contextLabel}</span><span>{tr("Public guidance")}</span></div>
    <div className={s.connectionPanel}>
      <details className={s.connectionSettings}>
        <summary><span className={ready ? s.statusDot : s.warningDot}/><span>{tr(provider === "apiKey" ? "API key mode" : connection?.connected ? connection.planEnabled ? "ChatGPT connected" : "ChatGPT plan unavailable" : "Connect your ChatGPT account")}</span><Icon name="chevron" width={15}/></summary>
        <div className={s.connectionOptions}>
          <label htmlFor="assistant-provider">{tr("Use assistant with")}<select id="assistant-provider" value={provider} disabled={loading || connecting || cancelling} onChange={event => setProvider(event.target.value as Provider)}><option value="chatgpt">{tr("My ChatGPT account")}</option><option value="apiKey">{tr("Configured API key")}</option></select></label>
          {provider === "apiKey" ? <p>{t("Nutzt den hinterlegten API-Schlüssel mit separater API-Abrechnung. Dein ChatGPT-Tarif wird nicht verwendet.", "Uses this app’s configured API key with separate API billing. Your ChatGPT plan is not used.")}</p> : <p>{connection?.accountLabel || tr("Sign in with ChatGPT to check whether your plan can be used here.")}</p>}
          {provider === "chatgpt" && connection?.connected && connection.planEnabled && connection.models?.[0] && <p>{t("Verfügbares Modell:", "Available model:")} {connection.models[0].displayName}</p>}
          {connection?.connected && <button className={s.textButton} disabled={loading || connecting} onClick={() => void disconnect()}>{tr("Disconnect ChatGPT")}</button>}
        </div>
      </details>
      {provider === "chatgpt" && (!connection?.connected || !connection.planEnabled || connecting || cancelling) && <div className={s.connectionAction}>{cancelling ? <p role="status">{tr("Cancelling sign-in…")}</p> : connecting ? <><p role="status">{tr("Complete sign-in in the opened window.")}</p><button className={s.textButton} onClick={() => void cancelConnection()}>{tr("Cancel sign-in")}</button></> : <><button className={s.chatgptButton} onClick={() => void connect()} disabled={!connection?.available || loading}>{tr("Continue with ChatGPT")}</button>{!connection && !connectionError && <p role="status">{tr("Checking connection…")}</p>}</>}</div>}
      {provider === "chatgpt" && connection?.reason && connection.reason !== connectionError && (!connection.available || !connection.planEnabled) && <p className={s.connectionReason}>{tr(connection.reason)}</p>}
      {connectionError && <div className={s.connectionError} role="alert"><p>{tr(connectionError)}</p><button className={s.textButton} disabled={connecting} onClick={() => void refreshConnection()}>{tr("Check connection status")}</button></div>}
    </div>
    <div className={s.conversation} ref={scroll} role="log" aria-live="polite" aria-label={tr("Conversation")}>
      {!messages.length && <div className={s.assistantWelcome}><h3>{tr("What would you like to clarify?")}</h3><p>{tr("Ask a general question or choose a starting point.")}</p><div className={s.suggestions}>{prompts.map(prompt => <button key={prompt} onClick={() => { setDraft(tr(prompt)); textarea.current?.focus(); }}>{tr(prompt)}<Icon name="plus" width={16}/></button>)}</div></div>}
      {messages.map((message, index) => <article key={`${index}-${message.role}`} className={message.role === "user" ? s.userMessage : s.aiMessage}><strong>{message.role === "user" ? tr("You") : "VORAcard"}</strong><p>{message.content}</p>{message.role === "assistant" && onUseAnswer && <button className={s.textButton} onClick={() => onUseAnswer(message.content)}>{tr("Add explanation to my notes")}</button>}</article>)}
      {loading && <div className={s.thinking} role="status"><span/> {t("Deine Frage wird gelesen…", "Reading your question…")}</div>}
      {limitReached && <div className={s.chatError} role="alert"><strong>{tr("Conversation limit reached")}</strong><p>{tr("The complete conversation is sent for context. Start a new conversation before exceeding 24 messages or 18,000 characters; nothing is silently removed.")}</p></div>}
      {error && <div className={s.chatError} role="alert"><strong>{tr("Assistant unavailable")}</strong><p>{tr(error)}</p><button className={s.textButton} onClick={() => pending && void send(pending)} disabled={!consent || !ready || loading}>{tr("Retry question")}</button></div>}
      {sources.length > 0 && <div className={s.chatSources}><strong>{tr("Official references")}</strong><p>{tr("Selected public guidance for this topic. No live lookup.")}</p>{sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div>}
      {messages.some(message => message.role === "assistant") && !loading && <div className={s.followups}><button onClick={() => setDraft(tr("Can you explain that more simply?"))}>{tr("Explain more simply")}</button><button onClick={() => setDraft(tr("Which point should I clarify with a professional?"))}>{tr("What should I clarify?")}</button></div>}
    </div>
    <form className={s.composer} onSubmit={event => { event.preventDefault(); void send(); }}>
      {messages.length > 0 && <div className={s.newConversation}>{confirmNew ? <><p>{tr("Clear this conversation? Your unsent question will be kept.")}</p><button type="button" className={s.textButton} onClick={() => setConfirmNew(false)}>{tr("Cancel")}</button><button type="button" className={s.textButton} onClick={() => { setMessages([]); setPending(null); setSources([]); setError(""); setLimitReached(false); setConfirmNew(false); }}>{tr("Clear & start new")}</button></> : <button type="button" className={s.textButton} disabled={loading} onClick={() => setConfirmNew(true)}>{tr("Start new conversation")}</button>}</div>}
      <details className={s.privacyDetails}><summary>{tr("What is shared with the AI?")}</summary><p>{t("OpenAI erhält deine gesendeten Fragen, diesen vollständigen Chat, den gewählten Bereich und öffentliche VORAcard-Erklärungen zu amtlichen Vorlagen und Vorsorgeschritten. Gespeicherte Antworten, Profildaten, Impfeinträge, hochgeladene Ausweise und Reisepläne werden nicht angehängt. Schreibe keine Namen, Krankenunterlagen oder anderen sensiblen Angaben in deine Frage. Der Chat bleibt im Arbeitsspeicher und wird beim Schließen gelöscht.", "OpenAI receives questions you send, this complete conversation, your selected screen and VORAcard’s public explanations of official templates and care-preparation steps. Saved answers, profile details, vaccination records, uploaded cards and travel plans are not attached. Avoid names, medical records or other sensitive details in your question. Chat stays in memory and is cleared when you close this panel.")}</p></details>
      <label className={s.consent}><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>{tr("I agree to send my questions and this conversation to OpenAI, together with the selected topic and public VORAcard explanations.")}</span></label>
      <label className={s.srOnly} htmlFor="assistant-question">{tr("Your question")}</label><textarea ref={textarea} id="assistant-question" rows={2} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder={tr("Ask without personal details…")} disabled={loading}/>
      <div className={s.composerFooter}><span>{t("Allgemeine Informationen.", "General information.")}<br/>{t("Keine medizinische oder rechtliche Beratung.", "No medical or legal advice.")}</span><button className={s.primary} type="submit" disabled={!consent || !ready || loading || !draft.trim()}>{tr(loading ? "Sending…" : "Send")}<Icon name="arrow" width={16}/></button></div>
    </form>
  </section>;
}
