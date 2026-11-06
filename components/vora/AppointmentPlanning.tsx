"use client";

import { useEffect, useId, useImperativeHandle, useReducer, useRef, useState, type FormEvent, type Ref } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/Icons";
import { demoCalendar, demoReducer, formatDemoTime, type AppointmentBrief, type DemoState } from "@/lib/vora-appointments";
import { useVoraLanguage } from "./VoraLanguage";
import { useVoraAccountActions } from "./VoraAccountActions";
import type { VoraAppointment } from "@/lib/vora-profile";
import s from "./AppointmentPlanning.module.css";
import v from "./Vora.module.css";

type Field = keyof AppointmentBrief;
const emptyBrief: AppointmentBrief = { purpose: "", specialty: "", location: "" };
const purposes = ["Preventive screening", "Vaccination discussion", "Travel health consultation", "General appointment"];
const specialties = ["General practice", "Dentistry", "Dermatology", "Gynaecology", "Ophthalmology", "Urology", "Travel medicine", "Not sure yet"];

export type AppointmentContext = { purpose: "Preventive screening" | "Travel health consultation"; specialty: string; title: string };
export type AppointmentPlanningHandle = { requestContext: (context: AppointmentContext) => void };

export default function AppointmentPlanning({ plannerRef }: { plannerRef?: Ref<AppointmentPlanningHandle> }) {
  const id = useId();
  const { locale, t } = useVoraLanguage();
  const account = useVoraAccountActions();
  const stageNames = [t("Anliegen", "Prepare your visit"), t("Praxis und Zeit", "Choose a practice"), t("Prüfen und bestätigen", "Review & confirm"), t("Demo-Bestätigung", "Demo receipt")];
  const labels: Record<string, string> = { "Preventive screening": "Früherkennung", "Vaccination discussion": "Impfberatung", "Travel health consultation": "Reisemedizinische Beratung", "General appointment": "Allgemeiner Termin", "General practice": "Hausarztpraxis", Dentistry: "Zahnmedizin", Dermatology: "Dermatologie", Gynaecology: "Gynäkologie", Ophthalmology: "Augenheilkunde", Urology: "Urologie", "Travel medicine": "Reisemedizin", "Not sure yet": "Noch unklar" };
  const label = (value: string) => locale === "de" ? labels[value] || value : value;
  const [savedReceipt, setSavedReceipt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveLock = useRef(false);
  const [draft, setDraft] = useState<AppointmentBrief>(emptyBrief);
  const [brief, setBrief] = useState<AppointmentBrief | null>(null);
  const [demo, dispatch] = useReducer(demoReducer, { step: "off" } as DemoState);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState("");
  const [visitTitle, setVisitTitle] = useState("");
  const [pendingContext, setPendingContext] = useState<AppointmentContext | null>(null);
  const [contextRevision, setContextRevision] = useState(0);
  const planner = useRef<HTMLElement>(null);
  const contextTrigger = useRef<HTMLElement | null>(null);
  const contextAccepted = useRef(false);
  const focusLocation = useRef(false);
  const purposeRef = useRef<HTMLSelectElement>(null);
  const specialtyRef = useRef<HTMLSelectElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  const isDemo = demo.step !== "off";
  const formVisible = demo.step === "prepare" || (demo.step === "off" && !brief);
  const context = "brief" in demo ? demo.brief : brief;
  const stage = demo.step === "practices" ? 1 : demo.step === "review" ? 2 : demo.step === "confirmed" || demo.step === "cancelled" ? 3 : 0;

  useEffect(() => {
    if (!interacted.current) return;
    if (focusLocation.current) {
      focusLocation.current = false;
      planner.current?.scrollIntoView({ block: "start", behavior: "instant" });
      locationRef.current?.focus();
    } else if (demo.step === "prepare" || (demo.step === "off" && !brief)) purposeRef.current?.focus();
    else headingRef.current?.focus();
  }, [demo.step, brief, contextRevision]);

  function applyContext(next: AppointmentContext) {
    interacted.current = true;
    focusLocation.current = true;
    setDraft(current => ({ purpose: next.purpose, specialty: next.specialty, location: current.location }));
    setVisitTitle(next.title);
    setBrief(null);
    setErrors({});
    if (isDemo) dispatch({ type: "edit" });
    setContextRevision(current => current + 1);
    setNotice(t(`Anlass: ${next.title}. Prüfen Sie die Fachrichtung und ergänzen Sie Ihren Ort.`, `Visit topic set to ${next.title}. Check the purpose and specialty, then enter your city or postcode.`));
  }

  useImperativeHandle(plannerRef, () => ({ requestContext(next) {
    contextTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    contextAccepted.current = false;
    if (visitTitle === next.title && draft.purpose === next.purpose && draft.specialty === next.specialty) {
      planner.current?.scrollIntoView({ block: "start", behavior: "instant" });
      if (formVisible) locationRef.current?.focus(); else headingRef.current?.focus();
      return;
    }
    if (Object.values(draft).some(Boolean) || brief || isDemo) setPendingContext(next);
    else applyContext(next);
  } }));

  async function saveReceipt(value: Extract<DemoState, { step: "confirmed" | "cancelled" }>) {
    if (!account || saveLock.current) return;
    saveLock.current = true; setSaving(true); setSaveError("");
    const receipt = value.receipt;
    const appointment: VoraAppointment = { id: receipt.id, kind: "doctor", purpose: visitTitle || value.brief.purpose, providerLabel: receipt.practice.name, location: value.brief.location, startsAt: receipt.slot.startsAt, endsAt: receipt.slot.endsAt, createdAt: receipt.createdAt, status: "confirmed", mode: "demo" };
    try { if (await account.recordAppointment(appointment)) setSavedReceipt(receipt.id); else setSaveError(t("Demo bestätigt, aber noch nicht im Dashboard gespeichert. Bitte erneut speichern.", "Demo confirmed, but not saved to the dashboard. Please retry saving.")); }
    catch { setSaveError(t("Noch nicht im Dashboard gespeichert. Bitte erneut versuchen.", "Not saved to the dashboard. Please retry.")); }
    finally { saveLock.current = false; setSaving(false); }
  }
  async function confirmDemo() {
    if (demo.step !== "review" || saveLock.current) return;
    const action = { type: "confirm" as const, now: new Date(), id: `demo-${crypto.randomUUID()}` };
    const next = demoReducer(demo, action);
    dispatch(action);
    if (next.step === "confirmed") await saveReceipt(next);
  }
  async function cancelDemo() {
    if (demo.step !== "confirmed" || saveLock.current) return;
    saveLock.current = true; setSaving(true); setSaveError("");
    try {
      if (account && !await account.cancelAppointment(demo.receipt.id)) { setSaveError(t("Stornierung nicht gespeichert. Bitte erneut versuchen.", "Cancellation was not saved. Please retry.")); return; }
      dispatch({ type: "cancel" }); setNotice(t("Demo storniert. Entfernen Sie eine heruntergeladene Kalenderdatei selbst.", "Demo cancelled. Remove any downloaded calendar entry yourself."));
    } catch { setSaveError(t("Stornierung nicht gespeichert.", "Cancellation was not saved.")); }
    finally { saveLock.current = false; setSaving(false); }
  }
  function change(field: Field, value: string) {
    if (field === "purpose" && value !== draft.purpose) setVisitTitle("");
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setNotice("");
  }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!draft.purpose) nextErrors.purpose = t("Wählen Sie ein Anliegen.", "Choose an appointment purpose.");
    if (!draft.specialty) nextErrors.specialty = t("Wählen Sie eine Fachrichtung oder Noch unklar.", "Choose a specialty, or select Not sure yet.");
    if (!draft.location.trim()) nextErrors.location = t("Geben Sie Stadt oder Postleitzahl ein.", "Enter a city or postcode.");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstField = nextErrors.purpose ? purposeRef : nextErrors.specialty ? specialtyRef : locationRef;
      firstField.current?.focus();
      return;
    }
    interacted.current = true;
    const prepared = { ...draft, location: draft.location.trim() };
    setBrief(prepared);
    if (isDemo) {
      dispatch({ type: "preview", brief: prepared, now: new Date() });
      setNotice(t("Fiktive Praxen und Beispielzeiten sind bereit. Echte Verfügbarkeiten wurden nicht abgefragt.", "Fictional practices and example times are ready. No live availability was checked."));
    } else setNotice(t("Terminnotiz auf dieser Seite vorbereitet. Es wurde kein Termin gebucht.", "Appointment brief prepared on this page. No appointment has been booked."));
  }
  function startDemo() {
    interacted.current = true;
    dispatch({ type: "start" });
    if (brief) dispatch({ type: "preview", brief, now: new Date() });
    setNotice(t("Termin-Demo gestartet. Praxen und Zeiten sind fiktiv; es erfolgt keine echte Buchung.", "Appointment demo started. Practices and times are fictional; no real booking will be made."));
  }
  function edit() {
    interacted.current = true;
    if (isDemo) dispatch({ type: "edit" });
    setBrief(null);
    setErrors({});
    setNotice(isDemo ? t("Neue Angaben vorbereiten. Ein bereits gespeicherter Demo-Termin bleibt im Dashboard, bis Sie ihn dort stornieren.", "Edit your choices. The previous demo appointment and selected time have been cleared.") : "");
  }
  function reset() {
    interacted.current = true;
    setDraft(emptyBrief);
    setVisitTitle("");
    setBrief(null);
    setErrors({});
    dispatch({ type: "exit" });
    setNotice(t("Die aktuelle Vorbereitung wurde geleert. Gespeicherte Demo-Termine bleiben im Dashboard.", "Your appointment brief has been cleared."));
    purposeRef.current?.focus();
  }
  function download(content: string, filename: string, mime: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadBrief() {
    if (!brief) return;
    download([
      t("VORAcard Terminvorbereitung", "VORAcard appointment preparation"), t("Nur Vorbereitung. Es wurde kein Termin gebucht.", "Preparation only. No appointment has been booked."), "",
      ...(visitTitle ? [`${t("Anlass", "Visit topic")}: ${visitTitle}`] : []), `${t("Anliegen", "Purpose")}: ${label(brief.purpose)}`, `${t("Fachrichtung", "Specialty")}: ${label(brief.specialty)}`, `${t("Stadt oder Postleitzahl", "City or postcode")}: ${brief.location}`, "",
      t("Praxis: nicht ausgewählt", "Practice: not selected"), t("Datum und Uhrzeit: nicht ausgewählt", "Date and time: not selected"), t("Buchung: Doctolib ist nicht angebunden.", "Booking status: Doctolib booking is not connected to VORAcard."),
      t("Nächster Schritt: Kontaktieren Sie eine Praxis, um Anliegen und Verfügbarkeit zu klären.", "Next step: contact a practice to discuss the appointment and confirm availability."), "", t("Dies sind Ihre Angaben, keine medizinischen Empfehlungen.", "These are your choices, not medical recommendations."),
    ].join("\n"), "vora-appointment-brief.txt", "text/plain;charset=utf-8");
    setNotice(t("Terminnotiz heruntergeladen. Es wurde kein Termin gebucht.", "Brief downloaded to your device. No appointment has been booked."));
  }
  const summary = (value: AppointmentBrief) => <dl className={s.summary}>
    {visitTitle && <div><dt>{t("Anlass", "Visit topic")}</dt><dd>{visitTitle}</dd></div>}
    <div><dt>{t("Anliegen", "Appointment purpose")}</dt><dd>{label(value.purpose)}</dd></div>
    <div><dt>{t("Fachrichtung", "Specialty")}</dt><dd>{label(value.specialty)}</dd></div>
    <div><dt>{t("Stadt oder Postleitzahl", "City or postcode")}</dt><dd>{value.location}</dd></div>
  </dl>;

  return <section ref={planner} className={s.planner} aria-labelledby={`${id}-title`}>
    <header className={s.header}>
      <div className={s.title}><Icon name="hospital" width={24}/><div><h2 id={`${id}-title`}>{t("Einen Termin vorbereiten", "Plan an appointment")}</h2><p>{t("Vom Anliegen zum nächsten Schritt.", "From your first question to your next step.")}</p></div></div>
      <span className={s.localLabel}>{isDemo ? t("Termin-Demo", "Appointment demo") : t("Nur Vorbereitung", "Preparation only")}</span>
    </header>
    {isDemo && <p className={s.demoBanner}><strong>Demo</strong><span>{t("Fiktive Praxen und Zeiten · Keine echte Buchung", "Fictional practices and times · No real booking")}</span></p>}
    <ol className={s.stages} aria-label={t("Terminschritte", "Appointment stages")}>
      {stageNames.map((name, index) => <li key={name} className={index === stage ? s.current : index < stage ? s.completed : undefined} aria-current={index === stage ? "step" : undefined}><span className={s.stepNumber}>{index < stage ? <Icon name="check" width={15}/> : `0${index + 1}`}</span><div><strong>{name}</strong><span>{[t("Anliegen und Ort", "Your purpose & location"), t("Beispielzeiten ansehen", "Explore example times"), t("Angaben prüfen", "Check your choices"), t("Kalendereintrag behalten", "Keep a demo calendar entry")][index]}</span></div></li>)}
    </ol>
    <div className={`${s.body} ${demo.step === "practices" ? s.resultsBody : ""}`}>
      {formVisible && <form className={s.form} onSubmit={prepare} noValidate aria-label={t("Terminvorbereitung", "Appointment preparation")}>
        <div className={s.formIntro}><h3>{t("Welchen Termin möchten Sie vorbereiten?", "What would you like to arrange?")}</h3>{visitTitle && <p><strong>{t("Anlass", "Visit topic")}: {visitTitle}</strong></p>}<p>{t("Alle Felder sind erforderlich. Prüfen Sie die Angaben; sie sind keine medizinischen Empfehlungen.", "All fields are required. Check or change the choices below; they are not medical recommendations.")}</p></div>
        <div className={s.fields}>
          <div className={s.field}><label htmlFor={`${id}-purpose`}>{t("Anliegen", "Appointment purpose")}</label><select id={`${id}-purpose`} ref={purposeRef} value={draft.purpose} required onChange={event => change("purpose", event.target.value)} aria-invalid={!!errors.purpose} aria-describedby={errors.purpose ? `${id}-purpose-error` : undefined}><option value="">{t("Anliegen wählen", "Choose a purpose")}</option>{purposes.map(purpose => <option key={purpose} value={purpose}>{label(purpose)}</option>)}</select>{errors.purpose && <p id={`${id}-purpose-error`} className={s.error} role="alert">{errors.purpose}</p>}</div>
          <div className={s.field}><label htmlFor={`${id}-specialty`}>{t("Fachrichtung", "Specialty")}</label><select id={`${id}-specialty`} ref={specialtyRef} value={draft.specialty} required onChange={event => change("specialty", event.target.value)} aria-invalid={!!errors.specialty} aria-describedby={errors.specialty ? `${id}-specialty-error` : undefined}><option value="">{t("Fachrichtung wählen", "Choose a specialty")}</option>{specialties.map(specialty => <option key={specialty} value={specialty}>{label(specialty)}</option>)}</select>{errors.specialty && <p id={`${id}-specialty-error`} className={s.error} role="alert">{errors.specialty}</p>}</div>
          <div className={s.field}><label htmlFor={`${id}-location`}>{t("Stadt oder Postleitzahl", "City or postcode")}</label><input id={`${id}-location`} ref={locationRef} value={draft.location} required maxLength={120} autoComplete="off" placeholder={t("z. B. Berlin oder 10115", "e.g. Berlin or 10115")} onChange={event => change("location", event.target.value)} aria-invalid={!!errors.location} aria-describedby={errors.location ? `${id}-location-error` : undefined}/>{errors.location && <p id={`${id}-location-error`} className={s.error} role="alert">{errors.location}</p>}</div>
        </div>
        <div className={s.formActions}><button className={v.primary} type="submit">{isDemo ? t("Praxen ansehen · Demo", "Preview practices (demo)") : t("Terminnotiz vorbereiten", "Prepare appointment brief")}<Icon name="arrow" width={16}/></button>{Object.values(draft).some(Boolean) && <button className={v.textButton} type="button" onClick={reset}>{t("Angaben löschen", "Clear details")}</button>}</div>
      </form>}
      {demo.step === "off" && brief && <div className={s.review}>
        <div className={s.reviewHeading}><div><span className={s.eyebrow}>{t("Ihre Vorbereitung", "Your preparation")}</span><h3 tabIndex={-1} ref={headingRef}>{t("Ihre Terminnotiz", "Your appointment brief")}</h3></div><span className={s.notBooked}>{t("Nicht gebucht", "Not booked")}</span></div>
        {summary(brief)}
        <div className={s.reviewActions}><button type="button" className={v.secondary} onClick={edit}>{t("Notiz bearbeiten", "Edit brief")}</button><button type="button" className={v.secondary} onClick={downloadBrief}><Icon name="download" width={16}/>{t("Notiz herunterladen", "Download brief")}</button><button type="button" className={v.textButton} onClick={reset}>{t("Notiz löschen", "Clear brief")}</button></div>
      </div>}
      {demo.step === "practices" && <div className={s.results}>
        <div className={s.reviewHeading}><div><span className={s.eyebrow}>{t("Schritt 2 · Beispielzeiten", "Step 02 · Example availability")}</span><h3 tabIndex={-1} ref={headingRef}>{t("Demo-Praxis und Zeit wählen", "Choose a demo practice & time")}</h3></div></div>
        <p className={s.resultsIntro}>{t("Wählen Sie eine Beispielzeit. Alle Zeiten gelten in Berlin; diese Praxen existieren nicht.", "Select a time to continue. All times are in Berlin time; these practices do not exist.")}</p>
        {demo.notice && <p className={s.error} role="alert">{demo.notice}</p>}
        <div className={s.practiceList}>{demo.practices.map(practice => <article key={practice.id} className={s.practice} aria-label={practice.name}>
          <div className={s.practiceHeading}><span className={s.practiceIcon}><Icon name="hospital" width={20}/></span><div><h4>{practice.name}</h4><p>{practice.slots.length ? t("Vor-Ort-Gespräch · 30 Minuten", practice.detail) : t("Beispielpraxis ohne verfügbare Zeiten", practice.detail)}</p></div>{practice.slots.length > 0 && <span className={s.exampleTag}>{t("Fiktiv", "Fictional")}</span>}</div>
          {practice.slots.length ? <div className={s.slots}>{practice.slots.map(slot => <button type="button" key={slot.id} aria-label={t(`${formatDemoTime(slot.startsAt, locale)} bei ${practice.name} wählen`, `Select ${formatDemoTime(slot.startsAt, locale)} at ${practice.name}`)} onClick={() => { dispatch({ type: "select", practiceId: practice.id, slotId: slot.id }); setNotice(t("Beispielzeit gewählt. Prüfen Sie Ihre Angaben vor der Bestätigung.", "Example time selected. Review before confirming the demo.")); }}>{formatDemoTime(slot.startsAt, locale)}<Icon name="arrow" width={14}/></button>)}</div> : <p className={s.noSlots}>{t("Keine Beispielzeiten. Wählen Sie eine andere Demo-Praxis.", "No example times here. Choose another demo practice above.")}</p>}
        </article>)}</div>
        <button className={v.textButton} type="button" onClick={edit}><Icon name="back" width={15}/>{t("Angaben bearbeiten", "Edit visit details")}</button>
      </div>}
      {demo.step === "review" && <div className={s.review}>
        <span className={s.eyebrow}>{t("Schritt 3 · Angaben prüfen", "Step 03 · Check your choices")}</span><h3 tabIndex={-1} ref={headingRef}>{t("Demo-Termin prüfen", "Review demo appointment")}</h3>
        <div className={s.appointmentTime}><strong>{formatDemoTime(demo.selection.slot.startsAt, locale)}</strong><span>{t("Berliner Zeit · 30 Minuten", "Berlin time · 30 minutes")}</span></div>
        <h4 className={s.selectedPractice}>{demo.selection.practice.name}</h4>
        <p className={s.reviewExplanation}>{t("Sie bestätigen ein Beispiel. Es wird keine Praxis kontaktiert und kein echter Termin gebucht.", "This confirms an example on this page. No practice will be contacted and no real appointment will be made.")}</p>
        {summary(demo.brief)}
        <div className={s.reviewActions}><button className={v.primary} type="button" disabled={saving} onClick={confirmDemo}>{t("Demo-Termin bestätigen", "Confirm demo appointment")}<Icon name="check" width={16}/></button><button className={v.secondary} type="button" onClick={() => { dispatch({ type: "back" }); setNotice(t("Wählen Sie eine andere Beispielzeit. Die vorherige Auswahl wurde entfernt.", "Choose a different example time. The previous selection has been cleared.")); }}>{t("Zurück zu Zeiten", "Back to times")}</button><button className={v.textButton} type="button" onClick={edit}>{t("Angaben bearbeiten", "Edit visit details")}</button></div>
      </div>}
      {(demo.step === "confirmed" || demo.step === "cancelled") && <div className={s.review}>
        <div className={s.receiptTitle}><span className={demo.step === "confirmed" ? s.receiptIcon : s.cancelledIcon}><Icon name={demo.step === "confirmed" ? "check" : "close"} width={23}/></span><div><span className={s.eyebrow}>{demo.step === "confirmed" ? t("Schritt 4 · Demo bestätigt", "Step 04 · Saved on this page") : t("Demo storniert", "Cancelled on this page")}</span><h3 tabIndex={-1} ref={headingRef}>{demo.step === "confirmed" ? t("Demo-Termin", "Demo appointment") : t("Demo-Termin storniert", "Demo appointment cancelled")}</h3></div></div>
        <div className={s.appointmentTime}><strong>{formatDemoTime(demo.receipt.slot.startsAt, locale)}</strong><span>{t("Berliner Zeit · 30 Minuten", "Berlin time · 30 minutes")}</span></div>
        <h4 className={s.selectedPractice}>{demo.receipt.practice.name}</h4>
        <p className={s.reviewExplanation}>{demo.step === "confirmed" ? t("Der Demo-Ablauf ist abgeschlossen. Dies ist ein fiktiver Termin. Bitte erscheinen Sie nicht in dieser Praxis.", "Your walkthrough is complete. This is a fictional appointment, not a booking confirmation. Do not attend this practice.") : t("Der Demo-Termin ist storniert. Eine echte Buchung wurde nicht geändert. Entfernen Sie einen heruntergeladenen Eintrag selbst aus Ihrem Kalender.", "The demo appointment is cancelled. No real booking was changed. If you downloaded the example calendar entry, remove it from your calendar yourself.")}</p>
        {summary(demo.brief)}
        {demo.step === "confirmed" && account && <p role="status">{savedReceipt === demo.receipt.id ? t("Im Dashboard gespeichert.", "Saved to dashboard.") : <button className={v.secondary} disabled={saving} onClick={() => saveReceipt(demo)}>{saving ? t("Wird gespeichert …", "Saving …") : t("Erneut im Dashboard speichern", "Retry saving to dashboard")}</button>}</p>}<p className={s.receiptId}>{t("Demo-Referenz", "Demo reference")} <code>{demo.receipt.id}</code></p>
        <div className={s.reviewActions}>{demo.step === "confirmed" ? <><button type="button" className={v.primary} onClick={() => { download(demoCalendar(demo.receipt), "vora-demo-appointment.ics", "text/calendar;charset=utf-8"); setNotice(t("Demo-Kalenderdatei heruntergeladen. Sie ist als DEMO gekennzeichnet und enthält keine echte Buchung oder persönlichen Notizen.", "Demo calendar file downloaded. It is marked DEMO and contains no real booking or personal notes.")); }}><Icon name="download" width={16}/>{t("Kalenderdatei (.ics) herunterladen", "Download calendar (.ics)")}</button><button type="button" className={v.secondary} onClick={edit}>{t("Neuen Demo-Termin vorbereiten", "Edit demo appointment")}</button><button type="button" className={v.textButton} disabled={saving} onClick={cancelDemo}>{t("Demo-Termin stornieren", "Cancel demo appointment")}</button></> : <button type="button" className={v.primary} onClick={edit}>{t("Anderen Demo-Termin vorbereiten", "Try another demo appointment")}<Icon name="arrow" width={16}/></button>}</div>
      </div>}
      <aside className={`${s.nextStep} ${stage > 1 ? s.compactAside : ""}`} aria-labelledby={`${id}-next`}>
        {isDemo ? <><span className={s.eyebrow}>{t("Ihr Termin", "Your visit")}</span><h3 id={`${id}-next`}>{context ? label(context.specialty) : t("Zuerst etwas Vorbereitung", "A little preparation first")}</h3>{context ? <><p className={s.contextPurpose}>{label(context.purpose)}</p><p className={s.contextLocation}>{context.location}</p></> : <p>{t("Wählen Sie Anliegen, Fachrichtung und Ort. Bei unklarer Fachrichtung wählen Sie „Noch unklar“.", "Choose a purpose, specialty and location. Select “Not sure yet” if you have no specialty in mind.")}</p>}{demo.step === "review" && <p className={s.sideSelection}>{demo.selection.practice.name}<br/>{formatDemoTime(demo.selection.slot.startsAt, locale)}</p>}<p className={s.alternative}>{t("Ihre Angaben steuern die Demo. Die Beispiele zeigen keine echten Praxen in Ihrer Nähe und sind keine medizinischen Empfehlungen.", "Your choices guide this walkthrough. These examples do not show actual nearby practices or medical recommendations.")}</p><button className={v.textButton} type="button" onClick={reset}>{t("Demo verlassen", "Exit & clear demo")}</button></> : <><span className={s.eyebrow}>{t("Nächsten Schritt ausprobieren", "Explore the next step")}</span><h3 id={`${id}-next`}>{t("Den Terminablauf kennenlernen", "Try the appointment journey")}</h3><p>{t("Wählen Sie eine fiktive Praxis und eine Beispielzeit. Behalten Sie einen Demo-Kalendereintrag.", "Choose a fictional practice, pick an example time and keep a demo calendar entry.")}</p><button type="button" className={`${v.primary} ${s.demoStart}`} onClick={startDemo}>{brief ? t("Praxen ansehen · Demo", "Preview practices (demo)") : t("Termin-Demo starten", "Try appointment demo")}<Icon name="arrow" width={16}/></button><p className={s.demoHint}>{t("Nur Demo · Keine echte Buchung", "Demo only · No real booking")}</p><p className={s.alternative}>{t("Kontaktieren Sie für einen echten Termin eine Praxis mit Ihrer Terminnotiz. ", "For an actual appointment, contact a practice with your brief. ")}<a href="https://www.116117.de/" target="_blank" rel="noreferrer">{t("116117-Terminservice (neuer Tab)", "116117 appointment support (opens a new tab)")}</a></p></>}
      </aside>
    </div>
    <div className={s.connection} aria-label="Doctolib connection"><strong>Doctolib</strong><span className={s.connectionStatus}><span aria-hidden="true"/>{t("Buchung nicht verbunden", "Booking not connected")}</span><p>{t("Live-Praxissuche und echte Buchung sind nicht angebunden.", "Live practice search and booking are not connected.")}</p></div>
    <footer className={s.privacy}><Icon name="shield" width={17}/><p>{t("Entwürfe bleiben auf dieser Seite. Bestätigte Demo-Termine werden im Dashboard gespeichert, sofern die Speicherung gelingt. Es werden keine Daten an Doctolib gesendet. Dokumentantworten und Impfpass werden nicht angehängt.", "Drafts stay on this page. Confirmed demo appointments are saved to the dashboard when saving succeeds. Nothing is sent to Doctolib. Document answers and vaccination records are not attached.")}</p></footer>
    {saveError && <p className={s.error} role="alert">{saveError}</p>}<p className={s.notice} role="status">{notice}</p>
    <Dialog.Root open={pendingContext !== null} onOpenChange={open => { if (!open) setPendingContext(null); }}><Dialog.Portal><Dialog.Overlay className={v.chatOverlay}/><Dialog.Content className={v.confirmDialog} onCloseAutoFocus={event => { event.preventDefault(); if (contextAccepted.current) { planner.current?.scrollIntoView({ block: "start", behavior: "instant" }); locationRef.current?.focus(); } else contextTrigger.current?.focus(); }}><Dialog.Title>{t("Anliegen wechseln?", "Change your visit topic?")}</Dialog.Title><Dialog.Description>{t(`Das Anliegen „${pendingContext?.title}“ übernehmen? Anliegen und Fachrichtung werden ersetzt; Notiz, Praxis und Zeit auf dieser Seite werden zurückgesetzt. Bereits im Dashboard gespeicherte Termine bleiben bestehen. Ihr Ort bleibt erhalten.`, `Use ${pendingContext?.title} for this visit? This replaces the purpose and specialty and clears the draft, practice and time on this page. Previously saved dashboard appointments remain. Your city or postcode is kept.`)}</Dialog.Description><div className={v.buttonGroup}><Dialog.Close asChild><button type="button" className={v.secondary}>{t("Bisheriges Anliegen behalten", "Keep current visit")}</button></Dialog.Close><button type="button" className={v.primary} onClick={() => { if (!pendingContext) return; contextAccepted.current = true; applyContext(pendingContext); setPendingContext(null); }}>{t("Neues Anliegen übernehmen", "Use new visit topic")}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
