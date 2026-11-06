"use client";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { SOURCES, type WorkspaceState } from "@/lib/vora";
import { TRAVEL_ADVICE, travelAdvice } from "@/lib/vora-travel";
import { BookingLinks } from "./Prevention";
import type { AppointmentPlanningHandle } from "./AppointmentPlanning";
import { useVoraLanguage } from "./VoraLanguage";
import s from "./Vora.module.css";

const originalTasks = [
  { id: "country", title: "Read the official destination advice", text: "Check your destination and transit countries, passport rules and current travel notices.", href: SOURCES.countries, link: "Foreign Office country advice" },
  { id: "entry", title: "Check vaccination entry requirements", text: "Entry conditions can depend on where you arrive from, transit, age and travel history. Verify them with official country and consular information.", href: SOURCES.countries, link: "Find the destination’s entry rules" },
  { id: "consultation", title: "Separate advice from requirements", text: "Medical travel recommendations are different from border requirements. Arrange a travel-health discussion early enough for your itinerary.", href: SOURCES.travel, link: "Official travel-health information" },
  { id: "proof", title: "Prepare accepted proof", text: "Take the original certificates required for your route. A self-entered VORAcard record is not an international certificate or verified proof." },
  { id: "documents", title: "Make your documents accessible", text: "Tell a trusted person how to find your documents. Ask whether translations or country-specific arrangements are needed." },
];

export default function Travel({ state, update }: { state: WorkspaceState; update: (next: WorkspaceState) => boolean }) {
  const { locale, t } = useVoraLanguage();
  const translations: Record<string, [string, string, string?]> = {
    country: ["Amtliche Länderhinweise lesen", "Prüfen Sie Ziel- und Transitländer, Passregeln und aktuelle Reisehinweise.", "Länderhinweise des Auswärtigen Amts"],
    entry: ["Impfbezogene Einreisebedingungen prüfen", "Einreiseregeln hängen unter anderem von Herkunft, Transit, Alter und Reiseverlauf ab. Prüfen Sie amtliche Länder- und Konsularinformationen.", "Einreiseregeln des Ziellands"],
    consultation: ["Einreise und Beratung unterscheiden", "Medizinische Reiseempfehlungen sind keine Grenzanforderungen. Planen Sie rechtzeitig ein reisemedizinisches Gespräch für Ihre Route.", "Amtliche Reisegesundheitsinformationen"],
    proof: ["Anerkannte Nachweise vorbereiten", "Nehmen Sie die für Ihre Route geforderten Originalbescheinigungen mit. Ein selbst eingetragener oder Demo-VORAcard-Datensatz ist kein internationaler Impfnachweis."],
    documents: ["Dokumente zugänglich machen", "Informieren Sie eine Vertrauensperson, wie Ihre Dokumente auffindbar sind. Klären Sie Übersetzungen und landesspezifische Anforderungen."],
  };
  const tasks = originalTasks.map(task => ({ ...task, title: t(translations[task.id][0], task.title), text: t(translations[task.id][1], task.text), link: t(translations[task.id][2] || "", task.link || "") }));
  const adviceDe: Record<string, [string,string]> = {
    Ghana: ["Gelbfiebernachweis ist Einreisevoraussetzung", "Das Auswärtige Amt nennt für die Einreise ab einem Alter von 9 Monaten einen Gelbfieber-Impfnachweis. Prüfen Sie die aktuellen Zertifikatsregeln und Ihre gesamte Route in der amtlichen Quelle."],
    Thailand: ["Gelbfieberregel hängt von Anreise und Transit ab", "Bei direkter Einreise aus Deutschland ist keine Pflichtimpfung aufgeführt. Bei Einreise aus einem Gelbfiebergebiet oder Transit dort über 12 Stunden wird ab 9 Monaten ein Gelbfiebernachweis verlangt. Das Zielland allein bestimmt die Regel nicht."],
    Japan: ["Keine Impfpflicht für die Einreise aufgeführt", "Das Auswärtige Amt nennt keine vorgeschriebenen Impfungen für die Einreise. Daraus folgt nichts über persönliche medizinische Empfehlungen oder Transitländer. Prüfen Sie vor Abreise erneut die aktuellen Regeln."],
    Brazil: ["Auch die Weiterreise prüfen", "Bei direkter Einreise aus Deutschland ist keine Pflichtimpfung aufgeführt. Bei Weiterreise in bestimmte andere Länder kann ein Gelbfiebernachweis verlangt werden. Prüfen Sie jedes Ziel- und Transitland gesondert."],
  };
  function goArea(area: string) { const url = new URL(window.location.href); url.pathname = "/vorsorge/app"; ["view","doc","phase","block"].forEach(key => url.searchParams.delete(key)); url.searchParams.set("area", area); window.location.assign(url); }
  const [destination, setDestination] = useState(state.travel.destination);
  const [departure, setDeparture] = useState(state.travel.departure);
  const [notice, setNotice] = useState("");
  const planner = useRef<AppointmentPlanningHandle>(null);
  const originalAdvice = travelAdvice(state.travel.destination);
  const advice = originalAdvice ? { ...originalAdvice, title: t(adviceDe[originalAdvice.country][0], originalAdvice.title), text: t(adviceDe[originalAdvice.country][1], originalAdvice.text), country: originalAdvice.country === "Brazil" ? t("Brasilien", "Brazil") : originalAdvice.country } : undefined;
  const sourceFor = (href: string) => href === SOURCES.countries && advice ? advice.source : href;
  function download() {
    const content = [`VORAcard travel preparation — ${state.travel.destination}`, `Departure: ${state.travel.departure}`, "This checklist is not medical advice, an entry clearance or verified vaccination proof.", ...(advice ? [`${advice.title}\n${advice.text}\nChecked ${advice.checked}\n${advice.source}`] : []), ...tasks.map(task => `${state.travel.checks.includes(task.id) ? "[x]" : "[ ]"} ${task.title}\n${task.text}${task.href ? `\n${sourceFor(task.href)}` : ""}`)].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "VORA-travel-checklist.txt"; anchor.click(); URL.revokeObjectURL(url); setNotice(t("Reisecheckliste heruntergeladen.", "Travel checklist downloaded."));
  }
  return <>
    <div className={s.sectionHeading}><div><h1>{t("Vor der Reise vorbereitet.", "Prepare before you leave.")}</h1><p>{t("Ihre Reise, amtliche Hinweise und konkrete Schritte zur Vorbereitung.", "Your trip, official information and a checklist you can work through.")}</p></div><span className={s.subtleTag}>{t("Reisevorbereitung", "Travel preparation")}</span></div>
    <form className={s.travelForm} onSubmit={event => { event.preventDefault(); if (!update({ ...state, travel: { destination: destination.trim(), departure, checks: destination.trim() === state.travel.destination && departure === state.travel.departure ? state.travel.checks : [] } })) return; setNotice(t("Reisedaten übernommen. Prüfen Sie Länderregeln erneut bei Änderungen von Route oder Datum.", "Trip details applied. Recheck country rules when the route or dates change.")); }}><div className={s.tripSymbol}><Icon name="arrow" width={30} height={30}/></div><label htmlFor="destination">{t("Reiseziel", "Destination")}<input id="destination" list="travel-destinations" required maxLength={100} value={destination} onChange={event => setDestination(event.target.value)} placeholder={t("Land wählen oder eingeben", "Choose a country or enter your own")}/><datalist id="travel-destinations">{TRAVEL_ADVICE.map(item => <option key={item.country} value={item.country}/>)}</datalist></label><label htmlFor="departure">{t("Abreisedatum", "Departure date")}<input id="departure" required type="date" value={departure} onChange={event => setDeparture(event.target.value)}/></label><button className={s.primary}>{t("Reise übernehmen", "Save trip")}</button></form>
    <p className={s.statusMessage} role="status">{notice}</p>
    <div className={s.caution}><Icon name="alert" width={18}/><p>{t("VORAcard legt nicht fest, welche Impfungen Sie benötigen. Einreiseanforderungen und medizinische Empfehlungen sind verschieden. Regeln ändern sich: Prüfen Sie die amtlichen Quellen für Ihre genaue Route und Reisedaten.", "VORAcard does not determine which vaccinations you need. Entry requirements and medical recommendations are different. Rules change; check the official sources for your precise route and travel dates.")}</p></div>
    {advice && <section className={s.entryForm} aria-label={`Official entry information for ${advice.country}`}><div className={s.sectionBar}><h2>{advice.country}: {t("amtliche Einreisehinweise", "official entry information")}</h2><span>{t("Geprüft", "Checked")} {advice.checked}</span></div><h3>{advice.title}</h3><p>{advice.text}</p><a className={s.sourceLink} href={advice.source} target="_blank" rel="noreferrer">{t("Einreise- und Gesundheitshinweise lesen", "Read entry and health rules")} · {advice.country}</a></section>}
    <div className={s.sectionBar}><div><h2>{state.travel.destination ? t(`Vorbereitung für ${state.travel.destination}`, `Preparation for ${state.travel.destination}`) : t("Ihre Reisecheckliste", "Your travel checklist")}</h2><p>{state.travel.departure ? `${t("Abreise", "Departure")} ${new Date(`${state.travel.departure}T12:00:00`).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB")}` : t("Übernehmen Sie Ziel und Datum, um Ihre Vorbereitung festzuhalten.", "Save a destination and date to track your preparation.")}</p></div><span>{state.travel.checks.length}/{tasks.length} {t("geprüft", "checked")}</span></div>
    <div className={s.travelChecklist}>{tasks.map((task, index) => <article key={task.id}><label><input type="checkbox" checked={state.travel.checks.includes(task.id)} disabled={!state.travel.destination} onChange={() => update({ ...state, travel: { ...state.travel, checks: state.travel.checks.includes(task.id) ? state.travel.checks.filter(item => item !== task.id) : [...state.travel.checks, task.id] } })}/><span><span className={s.checkStep}>{t("Schritt", "Step")} {index + 1}</span><strong>{task.title}</strong></span></label><div><p>{task.text}</p>{task.href && <a href={sourceFor(task.href)} className={s.sourceLink} target="_blank" rel="noreferrer">{task.link}</a>}{task.id === "consultation" && <div><button type="button" className={s.textButton} onClick={() => planner.current?.requestContext({ purpose: "Travel health consultation", specialty: "Travel medicine", title: t("Reisemedizinische Beratung", "Travel consultation") })}>{t("Reisemedizinischen Termin vorbereiten", "Prepare travel consultation")}<Icon name="arrow" width={16}/></button></div>}{task.id === "proof" && <a href="/vorsorge/app?area=vaccinations" onClick={event => { event.preventDefault(); goArea("vaccinations"); }} className={s.textButton}>{t("Gesundheitspass öffnen", "Open Health Pass")}<Icon name="arrow" width={16}/></a>}{task.id === "documents" && <a href="/vorsorge/app?area=documents" onClick={event => { event.preventDefault(); goArea("documents"); }} className={s.textButton}>{t("Dokumente öffnen", "Open your documents")}<Icon name="arrow" width={16}/></a>}</div></article>)}</div>
    <div className={s.actionRow}><p>{t("Die Checkliste hält Ihre eigenen Prüfschritte fest. Sie bestätigt keine Reisefähigkeit.", "The checklist records what you have checked yourself. It does not confirm fitness to travel.")}</p><button className={s.secondary} disabled={!state.travel.destination} onClick={download}><Icon name="download" width={17}/> Download checklist</button></div>
    <BookingLinks plannerRef={planner}/>
  </>;
}
