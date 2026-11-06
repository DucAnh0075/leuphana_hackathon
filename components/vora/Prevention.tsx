"use client";
import { useState } from "react";
import { Icon } from "@/components/Icons";
import { PREVENTION, SOURCES, type WorkspaceState } from "@/lib/vora";
import AppointmentPlanning from "./AppointmentPlanning";
import s from "./Vora.module.css";

export function BookingLinks() { return <AppointmentPlanning/>; }

export default function Prevention({ state, update }: { state: WorkspaceState; update: (next: WorkspaceState) => void }) {
  const [year, setYear] = useState(state.profile.birthYear);
  const [programme, setProgramme] = useState(state.profile.programme);
  const [notice, setNotice] = useState("");
  const currentYear = new Date().getFullYear();
  const age = state.profile.birthYear ? currentYear - Number(state.profile.birthYear) : null;
  const offers = PREVENTION.filter(offer => (state.profile.programme === "all" || offer.group === "all" || offer.group === state.profile.programme) && (age === null || (age >= offer.min && (offer.max === undefined || age <= offer.max))));
  return <>
    <div className={s.sectionHeading}><div><h1>Know what is available to you.</h1><p>Public screening offers in Germany. A clear starting point for your next conversation.</p></div><span className={s.subtleTag}>Statutory health insurance</span></div>
    <form className={s.profileForm} onSubmit={event => { event.preventDefault(); update({ ...state, profile: { birthYear: year, programme } }); setNotice("Your filters are saved in this browser."); }}>
      <div><h2>Your starting point</h2><p>Optional. No account or medical history needed.</p></div><label htmlFor="birth-year">Year of birth<input id="birth-year" type="number" min={currentYear - 120} max={currentYear} value={year} onChange={event => setYear(event.target.value)} placeholder="e.g. 1975"/></label><label htmlFor="programme">Show programmes for<select id="programme" value={programme} onChange={event => setProgramme(event.target.value as typeof programme)}><option value="all">All programmes</option><option value="women">Women</option><option value="men">Men</option></select></label><button className={s.primary}>Apply filters</button>
    </form>
    <p className={s.statusMessage} role="status">{notice}</p>
    <div className={s.sectionBar}><h2>{age === null ? "Adult screening offers" : `Offers around age ${age}`}</h2><span>{offers.length} offers</span></div>
    <p className={s.listIntro}>{age === null ? "Add your birth year to narrow this list. These are eligibility rules, not personal recommendations or appointment reminders." : "Your age is estimated from the year of birth. Eligibility starts at the relevant birthday. Confirm the applicable programme and previous screening history with your practice."}</p>
    <div className={s.offerList}>{offers.map(offer => <article key={offer.id} className={s.offer}><div className={s.offerAge}><strong>{offer.min}+</strong><span>years</span></div><div><h3>{offer.title}</h3><p className={s.offerSchedule}>{offer.schedule}</p><p>{offer.detail}</p></div><span className={s.eligibility}>{offer.group === "all" ? "All programmes" : offer.group === "women" ? "Women’s programme" : "Men’s programme"}</span></article>)}{!offers.length && <div className={s.empty}><h3>No adult offers match these filters.</h3><p>This list focuses on adults. Childhood and adolescent check-ups follow their own programme.</p><a href="https://www.g-ba.de/themen/methodenbewertung/ambulant/frueherkennung-krankheiten/kinder/" target="_blank" rel="noreferrer" className={s.sourceLink}>See G-BA child and adolescent check-ups</a></div>}</div>
    <div className={s.sourceNote}><Icon name="shield" width={18}/><p>Based on G-BA public programme rules, checked 6 November 2026. The list is a selected overview, not a complete benefits catalogue. Participation is voluntary. Programme categories reflect the published rules; your practice can clarify individual eligibility. <a href={SOURCES.prevention} target="_blank" rel="noreferrer">Read the official G-BA information</a>.</p></div>
    <BookingLinks/>
  </>;
}
