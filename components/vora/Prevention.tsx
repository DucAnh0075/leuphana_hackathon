"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import { Icon } from "@/components/Icons";
import { PREVENTION, SOURCES, type WorkspaceState } from "@/lib/vora";
import AppointmentPlanning, { type AppointmentPlanningHandle } from "./AppointmentPlanning";
import { useVoraLanguage } from "./VoraLanguage";
import { useVoraAccountActions } from "./VoraAccountActions";
import { preventionDetails } from "@/lib/vora-prevention-language";
export { preventionDetails } from "@/lib/vora-prevention-language";
import s from "./Vora.module.css";

export function BookingLinks({ plannerRef }: { plannerRef?: Ref<AppointmentPlanningHandle> }) { return <AppointmentPlanning plannerRef={plannerRef}/>; }
const offerSpecialties: Record<string, string> = { skin: "Dermatology", "cervical-young": "Gynaecology", cervical: "Gynaecology", breast: "Gynaecology", mammography: "Not sure yet", prostate: "Urology" };

export default function Prevention({ state, update }: { state: WorkspaceState; update: (next: WorkspaceState) => boolean }) {
 const { locale, t } = useVoraLanguage();
 const account = useVoraAccountActions();
 const [year, setYear] = useState(state.profile.birthYear);
 const [programme, setProgramme] = useState(state.profile.programme);
 const [notice, setNotice] = useState("");
 const [saving, setSaving] = useState<string | null>(null);
 const [savedTasks, setSavedTasks] = useState<string[]>(() => account?.tasks.filter(task => task.status === "open").map(task => task.offerId) || []);
 const planner = useRef<AppointmentPlanningHandle>(null);
 useEffect(() => { const offer = new URL(window.location.href).searchParams.get("offer"); if (!PREVENTION.some(value => value.id === offer)) return; const heading = document.getElementById("prevention-offer-" + offer); heading?.scrollIntoView({ block: "center" }); heading?.focus({ preventScroll: true }); }, []);
 const currentYear = new Date().getFullYear();
 const age = state.profile.birthYear ? currentYear - Number(state.profile.birthYear) : null;
 const offers = PREVENTION.filter(offer => (state.profile.programme === "all" || offer.group === "all" || offer.group === state.profile.programme) && (age === null || (age >= offer.min && (offer.max === undefined || age <= offer.max))));
 async function addTask(id: string) {
  if (!account || saving) return;
  setSaving(id); setNotice("");
  try { const saved = await account.addPreventionTask(id); if (saved) setSavedTasks(current => [...new Set([...current, id])]); setNotice(saved ? t("Im Dashboard als offene Aufgabe gespeichert. Kein Fälligkeitsdatum abgeleitet.", "Saved as an open dashboard task. No due date was inferred.") : t("Aufgabe nicht gespeichert. Bitte erneut versuchen.", "Task not saved. Please retry.")); }
  catch { setNotice(t("Aufgabe nicht gespeichert. Bitte erneut versuchen.", "Task not saved. Please retry.")); }
  finally { setSaving(null); }
 }
 return <>
  <div className={s.sectionHeading}><div><h1>{t("Vorsorge, die Ihnen offensteht.", "Know what is available to you.")}</h1><p>{t("Was wird angeboten, für wen, wie oft – und wo können Sie es klären?", "What is offered, for whom, how often — and where can you arrange it?")}</p></div><span className={s.subtleTag}>{t("Gesetzliche Krankenversicherung", "Statutory health insurance")}</span></div>
  <form className={s.profileForm} onSubmit={event => { event.preventDefault(); if (!update({ ...state, profile: { birthYear: year, programme } })) { setNotice(""); return; } setNotice(t("Filter übernommen.", "Filters applied.")); }}>
   <div><h2>{t("Angebote eingrenzen", "Narrow the offers")}</h2><p>{t("Freiwillige Angaben. Keine Krankengeschichte nötig.", "Optional details. No medical history needed.")}</p></div>
   <label htmlFor="birth-year">{t("Geburtsjahr", "Year of birth")}<input id="birth-year" type="number" min={currentYear - 120} max={currentYear} value={year} onChange={event => setYear(event.target.value)} placeholder={t("z. B. 1975", "e.g. 1975")}/></label>
   <label htmlFor="programme">{t("Programmgruppe", "Show programmes for")}<select id="programme" value={programme} onChange={event => setProgramme(event.target.value as typeof programme)}><option value="all">{t("Alle Programme", "All programmes")}</option><option value="women">{t("Frauen", "Women")}</option><option value="men">{t("Männer", "Men")}</option></select></label><button className={s.primary}>{t("Filter anwenden", "Apply filters")}</button>
  </form>
  <p className={s.statusMessage} role="status">{notice}</p>
  <div className={s.sectionBar}><h2>{age === null ? t("Früherkennung für Erwachsene", "Adult screening offers") : t(`Angebote etwa mit ${age} Jahren`, `Offers around age ${age}`)}</h2><span>{offers.length} {t("Angebote", "offers")}</span></div>
  <p className={s.listIntro}>{t("Ihr Alter ist aus dem Geburtsjahr geschätzt; Ansprüche beginnen am jeweiligen Geburtstag. Ohne Datum Ihrer letzten Untersuchung zeigt VORAcard keine Fälligkeit oder Überfälligkeit. Klären Sie bisherige Untersuchungen und individuelle Berechtigung mit Ihrer Praxis.", "Age is estimated from your birth year; eligibility begins at the relevant birthday. Without a last-examination date, VORAcard does not infer due or overdue status. Confirm previous screening and individual eligibility with your practice.")}</p>
  <div className={s.offerList}>{offers.map(offer => {
   const entry = preventionDetails[offer.id];
   const title = locale === "de" ? entry[0] : offer.title;
   const recorded = savedTasks.includes(offer.id);
   return <article key={offer.id} className={s.offer}><div className={s.offerAge}><strong>{offer.min}{offer.max ? `–${offer.max}` : "+"}</strong><span>{t("Jahre", "years")}</span></div><div><h3 id={`prevention-offer-${offer.id}`} tabIndex={-1}>{title}</h3><p className={s.offerSchedule}>{locale === "de" ? entry[1] : offer.schedule}</p><p>{locale === "de" ? entry[2] : offer.detail}</p><p><strong>{t("Anlaufstelle: ", "Where: ")}</strong>{locale === "de" ? entry[3] : entry[4]}</p><div className={s.buttonGroup}><button type="button" className={s.textButton} aria-label={t(`Termin für ${title} vorbereiten`, `Prepare a visit for ${title}`)} onClick={() => planner.current?.requestContext({ purpose: "Preventive screening", specialty: offerSpecialties[offer.id] || "General practice", title })}>{t("Termin vorbereiten", "Prepare a visit")}<Icon name="arrow" width={16}/></button>{account && <button type="button" className={s.secondary} disabled={!!saving || recorded} onClick={() => addTask(offer.id)}>{recorded ? t("In Ihren Aufgaben", "In your tasks") : saving === offer.id ? t("Wird gespeichert …", "Saving …") : t("Zu Aufgaben hinzufügen", "Add to tasks")}</button>}</div></div><span className={s.eligibility}>{offer.group === "all" ? t("Alle Programme", "All programmes") : offer.group === "women" ? t("Frauenprogramm", "Women’s programme") : t("Männerprogramm", "Men’s programme")}</span></article>;
  })}{!offers.length && <div className={s.empty}><h3>{t("Keine Erwachsenenangebote für diese Filter.", "No adult offers match these filters.")}</h3><p>{t("Für Kinder und Jugendliche gibt es eigene Programme.", "Children and adolescents have their own programmes.")}</p><a href="https://www.g-ba.de/themen/methodenbewertung/ambulant/frueherkennung-krankheiten/kinder/" target="_blank" rel="noreferrer" className={s.sourceLink}>{t("Kinder- und Jugenduntersuchungen beim G-BA", "G-BA child and adolescent check-ups")}</a></div>}</div>
  <div className={s.sourceNote}><Icon name="shield" width={18}/><p>{t("Ausgewählte G-BA-Angebote, geprüft am 6. November 2026. Keine persönliche Empfehlung, kein vollständiger Leistungskatalog. Teilnahme ist freiwillig. Programmgruppen entsprechen den veröffentlichten Regeln; die Praxis klärt Ihre individuelle Berechtigung.", "Selected G-BA offers, checked 6 November 2026. Not a personal recommendation or a complete benefits catalogue. Participation is voluntary. Programme groups reflect published rules; your practice can clarify individual eligibility.")} <a href={SOURCES.prevention} target="_blank" rel="noreferrer">{t("Amtliche G-BA-Informationen", "Official G-BA information")}</a>.</p></div>
  <BookingLinks plannerRef={planner}/>
 </>;
}
