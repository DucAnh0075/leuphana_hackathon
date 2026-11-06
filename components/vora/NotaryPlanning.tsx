"use client";
import { useEffect, useRef, useState } from "react";
import { checkDocumentForm, FORM_SOURCES, type FormScope } from "@/lib/vora-document-templates";
import { createDemoPractices, demoCalendar, formatDemoTime, type DemoReceipt, type DemoSelection } from "@/lib/vora-appointments";
import type { DocumentId } from "@/lib/vora";
import type { VoraAppointment } from "@/lib/vora-profile";
import { useVoraAccountActions } from "./VoraAccountActions";
import { useVoraLanguage } from "./VoraLanguage";
import s from "./NotaryPlanning.module.css";
import v from "./Vora.module.css";

const scopes: [FormScope, string, string][] = [["unknown", "Noch unklar", "Not sure yet"], ["ordinary", "Alltag, Gesundheit und gewöhnliche Vermögenssorge", "Everyday, health and ordinary financial matters"], ["land", "Grundstück / Grundbuch", "Property / land register"], ["irrevocable-land", "Unwiderrufliche Grundstücksvollmacht", "Irrevocable property authority"], ["consumer-loan", "Künftige Verbraucherdarlehen", "Future consumer loans"], ["registry", "Handelsregister oder Erbausschlagung", "Commercial register or rejecting an inheritance"], ["complex", "Unternehmen, komplexes Vermögen oder mehrere Vertretungen", "Business, complex assets or multiple representatives"]];

export default function NotaryPlanning({ documentId }: { documentId: DocumentId }) {
  const { locale, t } = useVoraLanguage();
  const account = useVoraAccountActions();
  const [scope, setScope] = useState<FormScope>("unknown");
  const [stage, setStage] = useState(0);
  const [location, setLocation] = useState("");
  const [selection, setSelection] = useState<DemoSelection | null>(null);
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);
  const [offices, setOffices] = useState<ReturnType<typeof createDemoPractices>>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = checkDocumentForm(documentId, scope);
  useEffect(() => { if (stage) heading.current?.focus(); }, [stage]);
  const purpose = `${({ power: "Vorsorgevollmacht", directive: "Patientenverfügung", guardian: "Betreuungsverfügung" })[documentId]} · ${documentId === "power" ? scopes.find(([value]) => value === scope)?.[1] : "Formfragen klären"}`;
  async function persist(value: DemoReceipt) {
    if (!account) return;
    const appointment: VoraAppointment = { id: value.id, kind: "notary", caseId: account.activeCaseId, purpose, providerLabel: value.practice.name, location, startsAt: value.slot.startsAt, endsAt: value.slot.endsAt, createdAt: value.createdAt, status: "confirmed", mode: "demo" };
    const accepted = await account.recordAppointment(appointment);
    setSaved(accepted);
    if (!accepted) setError(t("Demo bestätigt, aber noch nicht im Dashboard gespeichert. Bitte erneut speichern.", "Demo confirmed, but not saved to your dashboard. Retry saving."));
  }
  async function confirm() {
    if (!selection || lock.current) return;
    if (Date.parse(selection.slot.startsAt) <= Date.now()) { setError(t("Diese Beispielzeit ist abgelaufen. Wählen Sie neu.", "This example time has passed. Choose again.")); setStage(1); return; }
    lock.current = true; setBusy(true); setError("");
    const value = receipt || { ...selection, id: `notary-demo-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
    setReceipt(value); setStage(3);
    try { await persist(value); } catch { setError(t("Noch nicht im Dashboard gespeichert. Erneut versuchen.", "Not saved to the dashboard. Please retry.")); } finally { lock.current = false; setBusy(false); }
  }
  async function cancel() {
    if (!receipt || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { if (account && !await account.cancelAppointment(receipt.id)) { setError(t("Stornierung nicht gespeichert. Bitte erneut versuchen.", "Cancellation was not saved. Please retry.")); return; } setCancelled(true); } catch { setError(t("Stornierung nicht gespeichert.", "Cancellation was not saved.")); } finally { lock.current = false; setBusy(false); }
  }
  function calendar() {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([demoCalendar(receipt)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "vora-notary-DEMO.ics"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className={s.panel} aria-label={t("Formprüfung und Notariat", "Formalities and notary")}>
    <div><span className={s.eyebrow}>{t("Nächster Schritt · Form klären", "Next step · Check formalities")}</span><h3>{t("Brauche ich ein Notariat?", "Do I need a notary?")}</h3><p>{t("Das hängt vom Dokument und vom konkreten Geschäft ab.", "It depends on the document and the particular transaction.")}</p></div>
    {documentId === "power" && <label className={s.field}>{t("Welche Geschäfte soll die Vollmacht abdecken?", "Which transactions should the authority cover?")}<select value={scope} disabled={stage > 0} onChange={event => setScope(event.target.value as FormScope)}>{scopes.map(([value, de, en]) => <option key={value} value={value}>{t(de, en)}</option>)}</select></label>}
    <div className={s.result}><strong>{result.level === "deed" ? t("Beurkundung klären", "Clarify a notarial deed") : result.level === "certification" ? t("Öffentliche Beglaubigung klären", "Clarify public certification") : result.level === "clarify" ? t("Umfang zuerst klären", "Clarify scope first") : t("Keine allgemeine Notarpflicht", "No general notary requirement")}</strong><p>{t(result.de, result.en)}</p></div>
    <details className={s.explanation}><summary>{t("Beglaubigung oder Beurkundung – der Unterschied", "Certification or notarial deed — the difference")}</summary><p>{t("Beglaubigung bestätigt die Unterschrift. Bei einer Beurkundung berät das Notariat auch zum Inhalt und hält die Erklärung in einer Urkunde fest. Auch die Betreuungsbehörde kann bestimmte Vollmachtsunterschriften öffentlich beglaubigen; die Wirkung ihrer seit 2023 vorgenommenen Beglaubigung endet mit dem Tod der vollmachtgebenden Person (§ 7 BtOG).", "Certification confirms the signature. A notarial deed also involves advice about the content and records the declaration. A guardianship authority can publicly certify certain power-of-attorney signatures; the effect of certifications made since 2023 ends on the principal’s death (§ 7 BtOG).")}</p><a href={FORM_SOURCES.guidance} target="_blank" rel="noreferrer">BMJV · {t("Formanforderungen, S. 45–46 / 53", "Formalities, pp. 45–46 / 53")}</a> · <a href={FORM_SOURCES.authority} target="_blank" rel="noreferrer">§ 7 BtOG</a></details>
    {!stage ? <div className={s.actions}><button className={v.primary} onClick={() => { setStage(1); setOffices(createDemoPractices(new Date()).slice(0, 2).map((office, index) => ({ ...office, name: index ? "VORAcard Demo-Notariat · Park" : "VORAcard Demo-Notariat · Mitte", detail: "Fiktives Notariat / Fictional office" }))); }}>{t("Notartermin vorbereiten · Demo", "Prepare a notary visit · Demo")}</button><a href="https://www.notar.de/notarsuche/notarsuche" target="_blank" rel="noreferrer" className={v.sourceLink}>{t("Echtes Notariat suchen", "Find a real notary")}</a></div> : <div className={s.booking}>
      <p className={s.demo}><strong>DEMO</strong> · {t("Fiktive Notariate und Zeiten. Keine echte Buchung.", "Fictional offices and times. No real booking.")}</p>
      {stage === 1 && <button className={v.textButton} onClick={() => { setStage(0); setSelection(null); setError(""); }}>{t("Formprüfung ändern", "Change form check")}</button>}
      <ol className={s.stages} aria-label={t("Terminschritte", "Booking steps")}>{[t("Anliegen", "Purpose"), t("Zeit wählen", "Choose time"), t("Prüfen", "Review"), t("Bestätigung", "Receipt")].map((label, index) => <li key={index} aria-current={(stage === 1 ? (location.trim() ? 1 : 0) : stage) === index ? "step" : undefined}>{index + 1}. {label}</li>)}</ol>
      {stage === 1 && <><h4 ref={heading} tabIndex={-1}>{t("Ort und Beispielzeit wählen", "Choose a location and example time")}</h4><label className={s.field}>{t("Stadt oder Postleitzahl", "City or postcode")}<input value={location} maxLength={120} onChange={event => setLocation(event.target.value)} placeholder={t("z. B. Berlin", "e.g. Berlin")}/></label><p>{t("Das Anliegen stammt aus Ihrer Formprüfung. Dokumentantworten werden nicht weitergegeben.", "The purpose comes from your form check. Document answers are not shared.")}</p>{offices.map(office => <article key={office.id} className={s.office}><strong>{office.name}</strong><div className={s.slots}>{office.slots.map(slot => <button disabled={!location.trim()} key={slot.id} className={v.secondary} onClick={() => { setSelection({ practice: office, slot }); setStage(2); setError(""); }}>{formatDemoTime(slot.startsAt, locale)}</button>)}</div></article>)}</>}
      {stage === 2 && selection && <><h4 ref={heading} tabIndex={-1}>{t("Demo-Notartermin prüfen", "Review demo notary appointment")}</h4><p><strong>{selection.practice.name}</strong><br/>{formatDemoTime(selection.slot.startsAt, locale)} · Europe/Berlin<br/>{location}</p><p>{t("Vorbereitung: ", "Preparation: ")}{scopes.find(([value]) => value === scope)?.[locale === "de" ? 1 : 2]}</p><div className={s.actions}><button disabled={busy} className={v.primary} onClick={confirm}>{t("Demo-Notartermin bestätigen", "Confirm demo notary appointment")}</button><button className={v.secondary} onClick={() => setStage(1)}>{t("Zurück zu Zeiten", "Back to times")}</button></div></>}
      {stage === 3 && receipt && <><h4 ref={heading} tabIndex={-1}>{cancelled ? t("Demo-Notartermin storniert", "Demo notary appointment cancelled") : t("Demo-Notartermin", "Demo notary appointment")}</h4><p><strong>{receipt.practice.name}</strong><br/>{formatDemoTime(receipt.slot.startsAt, locale)}</p><p>{saved ? t("Im Dashboard gespeichert.", "Saved to your dashboard.") : t("Auf dieser Seite bestätigt.", "Confirmed on this page.")} {t("Bitte nicht erscheinen: Es gibt keine echte Buchung.", "Do not attend: this is not a real booking.")}</p><div className={s.actions}>{!cancelled && <><button className={v.secondary} onClick={calendar}>{t("Kalenderdatei herunterladen", "Download calendar file")}</button>{account && !saved && <button className={v.primary} disabled={busy} onClick={confirm}>{t("Erneut im Dashboard speichern", "Retry saving to dashboard")}</button>}<button className={v.textButton} disabled={busy} onClick={cancel}>{t("Demo stornieren", "Cancel demo")}</button></>}</div><p className={s.reference}>{receipt.id}</p></>}
      {error && <p role="alert">{error}</p>}
    </div>}
  </section>;
}
