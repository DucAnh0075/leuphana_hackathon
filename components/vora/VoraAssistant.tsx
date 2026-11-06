"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import s from "./Vora.module.css";

export type VoraAssistantProps = { area: string; documentTitle?: string; moduleTitle?: string; initialQuestion?: string; onClose: () => void; onUseAnswer?: (text: string) => void };
type Message = { role: "user" | "assistant"; content: string };
type Source = { title: string; url: string };

export default function VoraAssistant({ area, documentTitle, moduleTitle, initialQuestion = "", onClose, onUseAnswer }: VoraAssistantProps) {
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
  const abort = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  if (previousQuestion !== initialQuestion) { setPreviousQuestion(initialQuestion); setDraft(initialQuestion); }
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "instant" }); }, [messages, loading]);

  async function send(retry?: Message[]) {
    if (!consent || loading || (!retry && !draft.trim())) return;
    const next: Message[] = retry || [...messages, { role: "user", content: draft.trim() }];
    if (next.length > 24 || next.reduce((count, message) => count + message.content.length, 0) > 18000) { setLimitReached(true); return; }
    setMessages(next); setPending(next); setDraft(""); setLoading(true); setError("");
    abort.current = new AbortController();
    const timeout = setTimeout(() => abort.current?.abort(), 45000);
    try {
      const response = await fetch("/api/vora/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.current.signal, body: JSON.stringify({ messages: next, context: { area, ...(documentTitle ? { documentTitle } : {}), ...(moduleTitle ? { moduleTitle } : {}) }, locale: "en", consent: true }) });
      const payload = await response.json();
      if (!response.ok || payload.mode !== "live" || typeof payload.message !== "string") throw new Error(typeof payload.error === "string" ? payload.error : "The assistant could not answer. Please try again.");
      setMessages([...next, { role: "assistant", content: payload.message }]); setPending(null);
      setSources(Array.isArray(payload.sources) ? payload.sources.filter((source: Source) => source && typeof source.title === "string" && typeof source.url === "string" && source.url.startsWith("https://")) : []);
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "The request took too long or was cancelled. Your question is kept here; you can retry.");
    } finally { clearTimeout(timeout); setLoading(false); }
  }

  const prompts = area === "documents" ? ["How do these three documents differ?", "What needs a signature?", "When should I speak to a professional?"] : area === "vaccinations" ? ["What is the difference between a vaccination record and proof?", "When does the measles proof requirement apply?"] : area === "travel" ? ["How do entry requirements differ from vaccination recommendations?", "Where can I check official travel health information?"] : ["What should I prepare first?", "Explain statutory screening eligibility.", "What can VORA help me understand?"];

  return <section className={s.assistant} aria-label="VORA assistant">
    <header className={s.assistantHeader}><div className={s.assistantAvatar}><Icon name="signal" width={21}/></div><div><h2>Ask VORA</h2><p>Your questions, in plain language</p></div><button className={s.iconButton} onClick={onClose} aria-label="Close assistant"><Icon name="close"/></button></header>
    <div className={s.assistantContext}><Icon name="pages" width={16}/><span>{moduleTitle || documentTitle || area.charAt(0).toUpperCase() + area.slice(1)}</span><span>Context label only</span></div>
    <div className={s.conversation} ref={scroll} role="log" aria-live="polite" aria-label="Conversation">
      {!messages.length && <div className={s.assistantWelcome}><h3>A term unclear?<br/>Start there.</h3><p>Ask about a document block, a public screening offer or where to find an official source.</p><div className={s.suggestions}>{prompts.map(prompt => <button key={prompt} onClick={() => { setDraft(prompt); textarea.current?.focus(); }}>{prompt}<Icon name="plus" width={16}/></button>)}</div></div>}
      {messages.map((message, index) => <article key={`${index}-${message.role}`} className={message.role === "user" ? s.userMessage : s.aiMessage}><strong>{message.role === "user" ? "You" : "VORA"}</strong><p>{message.content}</p>{message.role === "assistant" && onUseAnswer && <button className={s.textButton} onClick={() => onUseAnswer(message.content)}>Add explanation to my notes</button>}</article>)}
      {loading && <div className={s.thinking} role="status"><span/> Reading your question…</div>}
      {limitReached && <div className={s.chatError} role="alert"><strong>Conversation limit reached</strong><p>The complete conversation is sent for context. Start a new conversation before exceeding 24 messages or 18,000 characters; nothing is silently removed.</p></div>}
      {error && <div className={s.chatError} role="alert"><strong>Assistant unavailable</strong><p>{error}</p><button className={s.textButton} onClick={() => pending && void send(pending)} disabled={!consent || loading}>Retry question</button></div>}
      {sources.length > 0 && <div className={s.chatSources}><strong>Sources</strong>{sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</div>}
      {messages.some(message => message.role === "assistant") && !loading && <div className={s.followups}><button onClick={() => setDraft("Can you explain that more simply?")}>Explain more simply</button><button onClick={() => setDraft("Which point should I clarify with a professional?")}>What should I clarify?</button></div>}
    </div>
    <form className={s.composer} onSubmit={event => { event.preventDefault(); void send(); }}>
      {messages.length > 0 && <div className={s.newConversation}>{confirmNew ? <><p>Clear this conversation? Your unsent question will be kept.</p><button type="button" className={s.textButton} onClick={() => setConfirmNew(false)}>Cancel</button><button type="button" className={s.textButton} onClick={() => { setMessages([]); setPending(null); setSources([]); setError(""); setLimitReached(false); setConfirmNew(false); }}>Clear & start new</button></> : <button type="button" className={s.textButton} disabled={loading} onClick={() => setConfirmNew(true)}>Start new conversation</button>}</div>}
      <details className={s.privacyDetails}><summary>What is shared with the AI?</summary><p>Only questions you send, this complete conversation and the visible topic labels go to OpenAI, our AI provider. Document answers, profile details, vaccination entries and travel plans are not attached. Avoid names, medical records or other sensitive details in your question. Chat stays in memory and is cleared when you close this panel.</p></details>
      <label className={s.consent}><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I agree to send my questions and this conversation to OpenAI, the AI provider.</span></label>
      <label className={s.srOnly} htmlFor="assistant-question">Your question</label><textarea ref={textarea} id="assistant-question" rows={3} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Ask a question without personal details…" disabled={loading}/>
      <div className={s.composerFooter}><span>General information.<br/>No medical or legal advice.</span><button className={s.primary} type="submit" disabled={!consent || loading || !draft.trim()}>{loading ? "Sending…" : "Send"}<Icon name="arrow" width={16}/></button></div>
    </form>
  </section>;
}
