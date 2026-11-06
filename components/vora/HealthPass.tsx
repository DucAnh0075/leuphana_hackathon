"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Vaccine } from "@/lib/vora";
import { DEMO_VACCINATIONS, healthPassStorageKey, HEALTH_PASS_SOURCES, emptyHealthPass, parseHealthPass, readStoredCard, writeStoredCard, type HealthPassState, type StoredCard } from "@/lib/vora-health-pass";
import { useVoraAccountActions } from "./VoraAccountActions";
import { validateCardReadability } from "./health-pass-upload";
import { DonorCardEditor } from "./DonorCardEditor";
import s from "./HealthPass.module.css";
import { useVoraLanguage } from "./VoraLanguage";
import { healthText } from "@/lib/vora-health-language";

type Props = { legacyVaccines: Vaccine[]; ask?: (question: string, documentTitle?: string, moduleTitle?: string) => void };
export function HealthPass({ legacyVaccines, ask }: Props) {
  const account = useVoraAccountActions();
  // An existing account context without a valid scope must never fall back to legacy data.
  const scope = account ? account.localScope || "" : undefined;
  return <ScopedHealthPass key={scope ?? "legacy"} legacyVaccines={legacyVaccines} ask={ask} scope={scope}/>;
}
function ScopedHealthPass({ legacyVaccines, ask, scope }: Props & { scope?: string }) {
  const { locale, t } = useVoraLanguage();
  const tr = (text: string) => healthText(text, locale);
  const [state, setState] = useState<HealthPassState>(emptyHealthPass);
  const [ready, setReady] = useState(false);
  const raw = useRef<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const [sessionOnly, setSessionOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editor, setEditor] = useState(false);
  const [upload, setUpload] = useState(false);
  const demoTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let storageKey: string | null = null;
    try { storageKey = healthPassStorageKey(scope); raw.current = localStorage.getItem(storageKey); if (raw.current) setState(parseHealthPass(raw.current)); }
    catch (error) { setStorageError(error instanceof Error ? error.message : "Local storage could not be read. Your saved data is unchanged."); }
    setReady(true);
    const changed = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) setStorageError("Health pass changed in another tab. Reload the saved version before editing."); };
    window.addEventListener("storage", changed); return () => window.removeEventListener("storage", changed);
  }, [scope]);
  const blocked = !ready || (!!storageError && !sessionOnly);
  function commit(next: HealthPassState) {
    if (blocked) return false;
    if (!sessionOnly) {
      try {
        const storageKey = healthPassStorageKey(scope);
        if (localStorage.getItem(storageKey) !== raw.current) throw new Error("Health pass changed in another tab. Reload the saved version before editing.");
        const nextRaw = JSON.stringify(next); parseHealthPass(nextRaw); localStorage.setItem(storageKey, nextRaw); raw.current = nextRaw;
      } catch (error) { setStorageError(error instanceof Error ? error.message : "The draft could not be saved locally."); return false; }
    }
    setState(next); return true;
  }
  function importDemo() {
    if (!consent || blocked) return;
    const now = new Date().toISOString();
    if (commit({ ...state, demo: { consentAt: now, syncedAt: now } })) { setConnecting(false); setConsent(false); setStatus("Two fictional vaccinations imported from Demo-ePA. No real health record was accessed."); }
  }
  return <div className={s.healthPass}>
    <header className={s.pageHeading}><div><p className={s.eyebrow}>{tr("Your health documents")}</p><h1>{tr("Health pass")}</h1><p>{tr("Vaccinations and your organ donation decision, kept together.")}</p></div><span className={s.tag}>{tr(!ready ? "Reading local data" : sessionOnly ? "Session only" : storageError ? "Storage needs attention" : "Saved on this device")}</span></header>
    {!ready && <p role="status" className={s.small}>{tr("Reading your local Health pass…")}</p>}
    {storageError && <div className={s.error} role="alert"><p>{tr(storageError)}</p><div className={s.actions}><button className={s.secondary} onClick={() => window.location.reload()}>{tr("Reload saved Health pass")}</button>{!sessionOnly && <button className={s.textButton} onClick={() => { setSessionOnly(true); setStatus("Draft edits are session-only. Existing saved data will not be overwritten."); }}>{tr("Continue in this session only")}</button>}</div></div>}
    {sessionOnly && <p className={s.notice}>{tr("Draft edits and demo sync are session-only and will be lost when you reload. Existing saved data is unchanged.")}</p>}
    <p className={s.live} role="status" aria-live="polite">{tr(status)}</p>
    <section className={s.section} aria-labelledby="vaccination-passport-title">
      <div className={s.sectionHeader}><div><p className={s.eyebrow}>{tr("01 · Vaccinations")}</p><h2 id="vaccination-passport-title">{tr("Vaccination passport")}</h2></div><span className={s.tag}>{tr(state.demo ? "Demo-ePA · fictional" : "ePA not connected")}</span></div>
      <div className={s.sectionBody}>
        {!state.demo && !connecting && <div className={s.intro}><div><h3>{tr("Start with an ePA synchronization")}</h3><p>{tr("Import your vaccination record through ePA. A real ePA connection is not available in this prototype; you can try the flow with fictional records.")}</p></div><button className={s.primary} disabled={blocked} onClick={() => { setConnecting(true); setConsent(false); requestAnimationFrame(() => demoTitle.current?.focus()); }}>{tr("Connect Demo-ePA")}</button></div>}
        {connecting && <div className={s.connection}>
          <h3 ref={demoTitle} tabIndex={-1}>{tr("Connect to Demo-ePA")}</h3><p>{tr("This uses two fixed fictional vaccinations. VORAcard will not sign into your insurer or access a real ePA.")}</p>
          <label className={s.consent}><input type="checkbox" checked={consent} disabled={blocked} onChange={event => setConsent(event.target.checked)} /><span>{tr("I agree to import and keep fictional Demo-ePA records on this device.")}</span></label>
          <div className={s.actions}><button className={s.primary} disabled={!consent || blocked} onClick={importDemo}>{tr("Import demo vaccinations")}</button><button className={s.textButton} onClick={() => { setConnecting(false); setConsent(false); }}>{tr("Cancel connection")}</button></div>
        </div>}
        {state.demo && <>
          <div className={s.syncStatus}><div><strong>{tr("Demo-ePA synchronized")}</strong><p>{t("Erfundene Einträge · letzte Demo-Synchronisierung", "Fictional records · last demo sync")} {new Date(state.demo.syncedAt).toLocaleString(locale === "de" ? "de-DE" : "en-GB")}</p></div><button className={s.secondary} disabled={blocked} onClick={() => { if (commit({ ...state, demo: { ...state.demo!, syncedAt: new Date().toISOString() } })) setStatus("Demo-ePA synchronized again. The same two fictional records were refreshed."); }}>{tr("Sync demo again")}</button></div>
          <ul className={s.vaccines}>{DEMO_VACCINATIONS.map(vaccine => <li key={vaccine.id}><div><h3>{tr(vaccine.name)}</h3><p>{tr(vaccine.product)} · {t("Charge", "batch")} {vaccine.batch}</p><span>{tr("Source: Demo-ePA · fictional, not a medical record")}</span></div><time dateTime={vaccine.date}>{vaccine.date}</time></li>)}</ul>
          <p className={s.small}>{tr("A real ePA connection is unavailable. These examples do not establish your vaccination status.")}</p>
          {!resetting ? <button className={s.textButton} disabled={blocked} onClick={() => setResetting(true)}>{tr("Reset demo connection")}</button> : <div className={s.notice}><p>{tr("Remove the demo connection and fictional records? Your card and older self-entered records stay saved.")}</p><div className={s.actions}><button className={s.secondary} disabled={blocked} onClick={() => { if (commit({ ...state, demo: null })) { setResetting(false); setStatus("Demo connection and fictional records removed."); } }}>{tr("Remove demo records")}</button><button className={s.textButton} onClick={() => setResetting(false)}>{tr("Keep demo connection")}</button></div></div>}
        </>}
        {legacyVaccines.length > 0 && <details className={s.legacy}><summary>{t("Frühere eigene Einträge", "Older self-entered records")} ({legacyVaccines.length})</summary><p className={s.small}>{tr("Self-entered · unverified. Preserved separately; these are not ePA imports.")}</p><ul className={s.vaccines}>{legacyVaccines.map(vaccine => <li key={vaccine.id}><div><h3>{vaccine.name}</h3><p>{vaccine.product}{vaccine.batch ? ` · ${t("Charge", "batch")} ${vaccine.batch}` : ""}</p>{vaccine.note && <p>{vaccine.note}</p>}<span>{tr("Source: self-entered · unverified")}</span></div><time dateTime={vaccine.date}>{vaccine.date}</time></li>)}</ul></details>}
        {ask && <button className={s.textButton} onClick={() => ask(t("Wie funktioniert der Impfimport aus der Demo-ePA?", "How does the Demo-ePA vaccination import work?"), "Health pass", "Vaccination passport")}>{tr("Ask about ePA synchronization")}</button>}
      </div>
    </section>
    <section className={s.section} aria-labelledby="organ-donation-title">
      <div className={s.sectionHeader}><div><p className={s.eyebrow}>{tr("02 · Your decision")}</p><h2 id="organ-donation-title">{tr("Organ donation card")}</h2></div><span className={s.tag}>{tr("Local & private")}</span></div>
      <div className={s.sectionBody}>
        {!editor && !upload && <div className={s.intro}><div><h3>{tr("A card for your own decision")}</h3><p>{tr("Complete a German declaration or keep a copy of your existing card. You can do either without connecting ePA.")}</p><div className={s.actions}><button className={s.primary} disabled={blocked} onClick={() => setEditor(true)}>{tr(state.donor.name || state.donor.choice ? "Continue card draft" : "Complete a card")}</button><button className={s.secondary} onClick={() => setUpload(true)}>{tr("Upload existing card")}</button></div></div></div>}
        {editor && <DonorCardEditor draft={state.donor} disabled={blocked} update={donor => commit({ ...state, donor })} close={() => setEditor(false)} />}
        <CardUpload expanded={upload} close={() => setUpload(false)} scope={scope}/>
        <div className={s.sourceFoot}><p>{tr("Your draft and file stay in this browser. They are not sent to AI or the organ donation register.")}</p><div><a href={HEALTH_PASS_SOURCES.card} target="_blank" rel="noreferrer">{tr("Official organ donation form ↗")}</a><a href={HEALTH_PASS_SOURCES.guide} target="_blank" rel="noreferrer">{tr("How to fill it in ↗")}</a>{ask && <button className={s.textButton} onClick={() => ask(t("Welche Möglichkeiten habe ich beim Organspendeausweis?", "What are my organ donation card choices?"), "Health pass", "Organ donation card")}>{tr("Ask about the choices")}</button>}</div></div>
      </div>
    </section>
  </div>;
}

function CardUpload({ expanded, close, scope }: { expanded: boolean; close: () => void; scope?: string }) {
  const { locale, t } = useVoraLanguage();
  const tr = (text: string) => healthText(text, locale);
  const [card, setCard] = useState<StoredCard | null>(null);
  const [candidate, setCandidate] = useState<StoredCard | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [status, setStatus] = useState("");
  const alive = useRef(true);
  const uploadHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (expanded) { const frame = requestAnimationFrame(() => uploadHeading.current?.focus()); return () => cancelAnimationFrame(frame); } }, [expanded]);
  useEffect(() => {
    alive.current = true;
    readStoredCard(scope).then(value => { if (alive.current) { setCard(value); setReady(true); } }).catch(error => { if (alive.current) setError(error instanceof Error ? error.message : "The saved file could not be read."); }).finally(() => { if (alive.current) setBusy(false); });
    return () => { alive.current = false; };
  }, [scope]);
  useEffect(() => {
    const objectUrl = card ? URL.createObjectURL(card.blob) : "";
    const timer = window.setTimeout(() => setUrl(objectUrl), 0);
    return () => { window.clearTimeout(timer); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [card]);
  async function save(next: StoredCard | null) {
    setBusy(true); setError("");
    try {
      await writeStoredCard(next, card?.revision ?? null, scope);
      if (!alive.current) return;
      setCard(next); setCandidate(null); setRemoving(false); setStatus(next ? "Card saved locally on this device. Contents have not been extracted or verified." : "Saved card file removed. Your typed draft is unchanged.");
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : "The file could not be saved."); }
    finally { if (alive.current) setBusy(false); }
  }
  async function choose(file: File) {
    setBusy(true); setError(""); setCandidate(null);
    try {
      const kind = await validateCardReadability(file);
      if (!alive.current) return;
      const next: StoredCard = { id: "organ-card", revision: crypto.randomUUID(), name: file.name.slice(0, 255), kind, blob: new Blob([file], { type: kind }), savedAt: new Date().toISOString() };
      if (card) { setCandidate(next); setBusy(false); } else await save(next);
    } catch (error) { if (alive.current) { setError(error instanceof Error ? error.message : "The file could not be read."); setBusy(false); } }
  }
  if (!expanded && !card && !error) return null;
  return <div className={s.upload}>
    {expanded && <><h3 ref={uploadHeading} tabIndex={-1}>{tr("Keep an existing organ donation card")}</h3><p className={s.small}>{tr("One PNG, JPEG or PDF, up to 5 MB. Saved locally in this browser; no text extraction or verification.")}</p><label className={s.fileLabel} htmlFor="organ-card-file">{tr(card ? "Choose a replacement card" : "Choose organ donation card")}<input id="organ-card-file" type="file" accept="image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf" disabled={busy || !ready} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void choose(file); }} /></label></>}
    {error && <div className={s.error} role="alert"><p>{tr(error)}</p><button className={s.textButton} disabled={busy} onClick={async () => { setBusy(true); try { setCard(await readStoredCard(scope)); setReady(true); setError(""); setCandidate(null); } catch (error) { setError(error instanceof Error ? error.message : "The file could not be read."); } finally { setBusy(false); } }}>{tr("Reload saved file")}</button></div>}
    {candidate && <div className={s.notice}><p>{t("Ersetze", "Replace")} “{card?.name}” {t("durch", "with")} “{candidate.name}”? {t("Die Datei wird erst nach deiner Bestätigung ersetzt.", "The saved file is replaced only when you confirm.")}</p><div className={s.actions}><button className={s.primary} disabled={busy} onClick={() => void save(candidate)}>{tr("Replace saved card")}</button><button className={s.textButton} disabled={busy} onClick={() => setCandidate(null)}>{tr("Cancel replacement")}</button></div></div>}
    {card && <div className={s.savedFile}><div><strong>{card.name}</strong><p className={s.small}>{card.kind === "application/pdf" ? "PDF" : card.kind === "image/png" ? t("PNG-Bild", "PNG image") : t("JPEG-Bild", "JPEG image")} · {(card.blob.size / 1024).toFixed(1)} KB · {t("auf diesem Gerät gespeichert", "saved on this device")}</p><p className={s.small}>{tr("Uploaded copy · contents not verified")}</p></div>
      {url && card.kind !== "application/pdf" && <div className={s.imagePreview}><Image unoptimized src={url} width={520} height={330} alt={tr("Your uploaded organ donation card")} /></div>}
      {url && <div className={s.actions}><a className={s.secondary} href={url} download={card.name}>{tr("Download saved card")}</a><a className={s.textButton} href={url} target="_blank" rel="noreferrer">{tr("Open saved card ↗")}</a>{!removing && <button className={s.textButton} disabled={busy} onClick={() => setRemoving(true)}>{tr("Remove saved file")}</button>}</div>}
      {removing && <div className={s.notice}><p>{tr("Remove this uploaded file from this browser?")}</p><div className={s.actions}><button className={s.secondary} disabled={busy} onClick={() => void save(null)}>{tr("Confirm file removal")}</button><button className={s.textButton} disabled={busy} onClick={() => setRemoving(false)}>{tr("Keep file")}</button></div></div>}
    </div>}
    <p className={s.live} role="status">{tr(busy && expanded ? "Reading local file storage…" : status)}</p>
    {expanded && <button className={s.textButton} disabled={busy} onClick={() => { setCandidate(null); close(); }}>{tr("Close upload")}</button>}
  </div>;
}
