"use client";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { SOURCES, type WorkspaceState } from "@/lib/vora";
import { TRAVEL_ADVICE, travelAdvice } from "@/lib/vora-travel";
import { BookingLinks } from "./Prevention";
import s from "./Vora.module.css";

const tasks = [
  { id: "country", title: "Read the official destination advice", text: "Check your destination and transit countries, passport rules and current travel notices.", href: SOURCES.countries, link: "Foreign Office country advice" },
  { id: "entry", title: "Check vaccination entry requirements", text: "Entry conditions can depend on where you arrive from, transit, age and travel history. Verify them with official country and consular information.", href: SOURCES.countries, link: "Find the destination’s entry rules" },
  { id: "consultation", title: "Separate advice from requirements", text: "Medical travel recommendations are different from border requirements. Arrange a travel-health discussion early enough for your itinerary.", href: SOURCES.travel, link: "Official travel-health information" },
  { id: "proof", title: "Prepare accepted proof", text: "Take the original certificates required for your route. A self-entered VORA record is not an international certificate or verified proof." },
  { id: "documents", title: "Make your documents accessible", text: "Tell a trusted person how to find your documents. Ask whether translations or country-specific arrangements are needed." },
];

export default function Travel({ state, update }: { state: WorkspaceState; update: (next: WorkspaceState) => boolean }) {
  const [destination, setDestination] = useState(state.travel.destination);
  const [departure, setDeparture] = useState(state.travel.departure);
  const [notice, setNotice] = useState("");
  const advice = travelAdvice(state.travel.destination);
  const sourceFor = (href: string) => href === SOURCES.countries && advice ? advice.source : href;
  function download() {
    const content = [`VORA travel preparation — ${state.travel.destination}`, `Departure: ${state.travel.departure}`, "This checklist is not medical advice, an entry clearance or verified vaccination proof.", ...(advice ? [`${advice.title}\n${advice.text}\nChecked ${advice.checked}\n${advice.source}`] : []), ...tasks.map(task => `${state.travel.checks.includes(task.id) ? "[x]" : "[ ]"} ${task.title}\n${task.text}${task.href ? `\n${sourceFor(task.href)}` : ""}`)].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "VORA-travel-checklist.txt"; anchor.click(); URL.revokeObjectURL(url); setNotice("Travel checklist downloaded.");
  }
  return <>
    <div className={s.sectionHeading}><div><h1>Prepare before you leave.</h1><p>Your trip, official information and a checklist you can work through.</p></div><span className={s.subtleTag}>Travel preparation</span></div>
    <form className={s.travelForm} onSubmit={event => { event.preventDefault(); if (!update({ ...state, travel: { destination: destination.trim(), departure, checks: destination.trim() === state.travel.destination && departure === state.travel.departure ? state.travel.checks : [] } })) return; setNotice("Trip saved. Recheck country rules when the route or dates change."); }}><div className={s.tripSymbol}><Icon name="arrow" width={30} height={30}/></div><label htmlFor="destination">Destination<input id="destination" list="travel-destinations" required maxLength={100} value={destination} onChange={event => setDestination(event.target.value)} placeholder="Choose a country or enter your own"/><datalist id="travel-destinations">{TRAVEL_ADVICE.map(item => <option key={item.country} value={item.country}/>)}</datalist></label><label htmlFor="departure">Departure date<input id="departure" required type="date" value={departure} onChange={event => setDeparture(event.target.value)}/></label><button className={s.primary}>Save trip</button></form>
    <p className={s.statusMessage} role="status">{notice}</p>
    <div className={s.caution}><Icon name="alert" width={18}/><p>VORA does not determine which vaccinations you need. Entry requirements and medical recommendations are different. Rules change; check the official sources for your precise route and travel dates.</p></div>
    {advice && <section className={s.entryForm} aria-label={`Official entry information for ${advice.country}`}><div className={s.sectionBar}><h2>{advice.country}: official entry information</h2><span>Checked {advice.checked}</span></div><h3>{advice.title}</h3><p>{advice.text}</p><a className={s.sourceLink} href={advice.source} target="_blank" rel="noreferrer">Read {advice.country} entry and health rules</a></section>}
    <div className={s.sectionBar}><div><h2>{state.travel.destination ? `Preparation for ${state.travel.destination}` : "Your travel checklist"}</h2><p>{state.travel.departure ? `Departure ${new Date(`${state.travel.departure}T12:00:00`).toLocaleDateString("en-GB")}` : "Save a destination and date to track your preparation."}</p></div><span>{state.travel.checks.length}/{tasks.length} checked</span></div>
    <div className={s.travelChecklist}>{tasks.map((task, index) => <article key={task.id}><label><input type="checkbox" checked={state.travel.checks.includes(task.id)} disabled={!state.travel.destination} onChange={() => update({ ...state, travel: { ...state.travel, checks: state.travel.checks.includes(task.id) ? state.travel.checks.filter(item => item !== task.id) : [...state.travel.checks, task.id] } })}/><span><span className={s.checkStep}>Step {index + 1}</span><strong>{task.title}</strong></span></label><div><p>{task.text}</p>{task.href && <a href={sourceFor(task.href)} className={s.sourceLink} target="_blank" rel="noreferrer">{task.link}</a>}</div></article>)}</div>
    <div className={s.actionRow}><p>The checklist records what you have checked yourself. It does not confirm fitness to travel.</p><button className={s.secondary} disabled={!state.travel.destination} onClick={download}><Icon name="download" width={17}/> Download checklist</button></div>
    <BookingLinks/>
  </>;
}
