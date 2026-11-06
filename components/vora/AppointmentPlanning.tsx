"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icons";
import s from "./AppointmentPlanning.module.css";
import v from "./Vora.module.css";

type AppointmentBrief = { purpose: string; specialty: string; location: string };
type Field = keyof AppointmentBrief;
const emptyBrief: AppointmentBrief = { purpose: "", specialty: "", location: "" };
const purposes = ["Preventive screening", "Vaccination discussion", "Travel health consultation", "General appointment"];
const specialties = ["General practice", "Dentistry", "Dermatology", "Gynaecology", "Ophthalmology", "Urology", "Travel medicine", "Not sure yet"];

export default function AppointmentPlanning() {
  const id = useId();
  const [draft, setDraft] = useState<AppointmentBrief>(emptyBrief);
  const [brief, setBrief] = useState<AppointmentBrief | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState("");
  const purposeRef = useRef<HTMLSelectElement>(null);
  const specialtyRef = useRef<HTMLSelectElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);

  useEffect(() => {
    if (brief) reviewRef.current?.focus();
    else if (interacted.current) purposeRef.current?.focus();
  }, [brief]);

  function change(field: Field, value: string) {
    setDraft(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setNotice("");
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!draft.purpose) nextErrors.purpose = "Choose an appointment purpose.";
    if (!draft.specialty) nextErrors.specialty = "Choose a specialty, or select Not sure yet.";
    if (!draft.location.trim()) nextErrors.location = "Enter a city or postcode.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstField = nextErrors.purpose ? purposeRef : nextErrors.specialty ? specialtyRef : locationRef;
      firstField.current?.focus();
      return;
    }
    interacted.current = true;
    setBrief({ ...draft, location: draft.location.trim() });
    setNotice("Appointment brief prepared on this page. No appointment has been booked.");
  }

  function edit() {
    setBrief(null);
    setNotice("");
  }

  function reset() {
    interacted.current = true;
    setDraft(emptyBrief);
    setBrief(null);
    setErrors({});
    setNotice("Your appointment brief has been cleared.");
    purposeRef.current?.focus();
  }

  function downloadBrief() {
    if (!brief) return;
    const content = [
      "VORA appointment preparation",
      "Preparation only. No appointment has been booked.",
      "",
      `Purpose: ${brief.purpose}`,
      `Specialty: ${brief.specialty}`,
      `City or postcode: ${brief.location}`,
      "",
      "Practice: not selected",
      "Date and time: not selected",
      "Booking status: Doctolib booking is not connected to VORA.",
      "Next step: contact a practice to discuss the appointment and confirm availability.",
      "",
      "These are your choices, not medical recommendations.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vora-appointment-brief.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Brief downloaded to your device. No appointment has been booked.");
  }

  return <section className={s.planner} aria-labelledby={`${id}-title`}>
    <header className={s.header}>
      <div className={s.title}><Icon name="hospital" width={24}/><div><h2 id={`${id}-title`}>Plan an appointment</h2><p>Bring your next conversation with a practice into focus.</p></div></div>
      <span className={s.localLabel}>Preparation only</span>
    </header>

    <div className={s.connection} aria-label="Doctolib connection">
      <strong>Doctolib</strong><span className={s.connectionStatus}><span aria-hidden="true"/>Booking not connected</span>
      <p>Practice search and live appointments are unavailable in VORA.</p>
    </div>

    <ol className={s.stages} aria-label="Appointment stages">
      <li className={s.current} aria-current="step"><span className={s.stepNumber}>01</span><div><strong>Prepare your visit</strong><span>{brief ? "Brief prepared" : "Your purpose & location"}</span></div></li>
      <li><span className={s.stepNumber}>02</span><div><strong>Choose a practice</strong><span>Live availability · unavailable</span></div></li>
      <li><span className={s.stepNumber}>03</span><div><strong>Review & confirm</strong><span>Unavailable</span></div></li>
      <li><span className={s.stepNumber}>04</span><div><strong>Booking receipt</strong><span>Provider confirmation · unavailable</span></div></li>
    </ol>

    <div className={s.body}>
      {brief ? <div className={s.review}>
        <div className={s.reviewHeading}><div><span className={s.eyebrow}>Your preparation</span><h3 tabIndex={-1} ref={reviewRef}>Your appointment brief</h3></div><span className={s.notBooked}>Not booked</span></div>
        <dl className={s.summary}>
          <div><dt>Appointment purpose</dt><dd>{brief.purpose}</dd></div>
          <div><dt>Specialty</dt><dd>{brief.specialty}</dd></div>
          <div><dt>City or postcode</dt><dd>{brief.location}</dd></div>
          <div><dt>Practice & appointment</dt><dd>Not selected</dd></div>
        </dl>
        <div className={s.reviewActions}><button type="button" className={v.secondary} onClick={edit}>Edit brief</button><button type="button" className={v.secondary} onClick={downloadBrief}><Icon name="download" width={16}/>Download brief</button><button type="button" className={v.textButton} onClick={reset}>Clear brief</button></div>
      </div> : <form className={s.form} onSubmit={prepare} noValidate aria-label="Appointment preparation">
        <div className={s.formIntro}><h3>What would you like to arrange?</h3><p>All fields are required. Choose “Not sure yet” if you have no specialty in mind.</p></div>
        <div className={s.fields}>
          <div className={s.field}><label htmlFor={`${id}-purpose`}>Appointment purpose</label><select id={`${id}-purpose`} ref={purposeRef} value={draft.purpose} required onChange={event => change("purpose", event.target.value)} aria-invalid={!!errors.purpose} aria-describedby={errors.purpose ? `${id}-purpose-error` : undefined}><option value="">Choose a purpose</option>{purposes.map(purpose => <option key={purpose}>{purpose}</option>)}</select>{errors.purpose && <p id={`${id}-purpose-error`} className={s.error} role="alert">{errors.purpose}</p>}</div>
          <div className={s.field}><label htmlFor={`${id}-specialty`}>Specialty</label><select id={`${id}-specialty`} ref={specialtyRef} value={draft.specialty} required onChange={event => change("specialty", event.target.value)} aria-invalid={!!errors.specialty} aria-describedby={errors.specialty ? `${id}-specialty-error` : undefined}><option value="">Choose a specialty</option>{specialties.map(specialty => <option key={specialty}>{specialty}</option>)}</select>{errors.specialty && <p id={`${id}-specialty-error`} className={s.error} role="alert">{errors.specialty}</p>}</div>
          <div className={s.field}><label htmlFor={`${id}-location`}>City or postcode</label><input id={`${id}-location`} ref={locationRef} value={draft.location} required maxLength={120} autoComplete="off" placeholder="e.g. Berlin or 10115" onChange={event => change("location", event.target.value)} aria-invalid={!!errors.location} aria-describedby={errors.location ? `${id}-location-error` : undefined}/>{errors.location && <p id={`${id}-location-error`} className={s.error} role="alert">{errors.location}</p>}</div>
        </div>
        <div className={s.formActions}><button className={v.primary} type="submit">Prepare appointment brief<Icon name="arrow" width={16}/></button>{Object.values(draft).some(Boolean) && <button className={v.textButton} type="button" onClick={reset}>Clear details</button>}</div>
      </form>}

      <aside className={s.nextStep} aria-labelledby={`${id}-next`}>
        <span className={s.eyebrow}>Next step</span><h3 id={`${id}-next`}>Choose a practice</h3>
        <p id={`${id}-unavailable`}>Doctolib booking is not connected. VORA cannot search practices, show appointment times or make a booking yet.</p>
        <button type="button" className={s.unavailable} disabled aria-describedby={`${id}-unavailable`}>Choose a practice<Icon name="arrow" width={16}/></button>
        <p className={s.alternative}>You can use your brief when contacting a practice. <a href="https://www.116117.de/" target="_blank" rel="noreferrer">116117 appointment support (opens a new tab)</a> is also available.</p>
      </aside>
    </div>

    <footer className={s.privacy}><Icon name="shield" width={17}/><p>These details stay in memory until you leave this section or reload. Nothing is sent to Doctolib; your questions, profile and vaccination record are not included. Download a brief only if you want to keep it.</p></footer>
    <p className={s.notice} role="status">{notice}</p>
  </section>;
}
