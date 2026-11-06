"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import PdfViewer from "./PdfViewer";
import IdleDialog from "./IdleDialog";
import PulseMonitor from "./PulseMonitor";
import { Icon } from "./Icons";
import type { CareSnapshot } from "@/lib/care/types";
import { projectClinicalPatients } from "@/lib/clinical-care";

import type { ClinicalDocument, ClinicalFact as Fact, ClinicalPatient as Patient } from "@/lib/clinical-care";
type Section = "overview" | "vitals" | "documents" | "contacts" | "history";
type OpenDocument = { document: ClinicalDocument; page: number; section?: string; quote?: string; fact?: Fact };
const sections: { id: Section; label: string; icon: "pages" | "pulse" | "document" | "users" | "history" }[] = [
  { id: "overview", label: "Fallübersicht", icon: "pages" },
  { id: "vitals", label: "Kurve / Vitaldaten", icon: "pulse" },
  { id: "documents", label: "Dokumente", icon: "document" },
  { id: "contacts", label: "Kontakte / Vertretung", icon: "users" },
  { id: "history", label: "Verlauf", icon: "history" },
];
const categoryNames: Record<string, string> = { representation: "Vertretung", wishes: "Behandlungswünsche", care: "Betreuungswunsch", information: "Auskunft" };
const formatDate = (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(value).toLocaleDateString("de-DE") : value;

function Panel({ title, children, action, className = "", headingRef }: { title: string; children: ReactNode; action?: ReactNode; className?: string; headingRef?: import("react").RefObject<HTMLHeadingElement | null> }) {
  return <section className={"clinical-panel " + className}><header><h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2>{action}</header><div className="panel-content">{children}</div></section>;
}

function VitalChart({ patient }: { patient: Patient }) {
  const values = patient.vitals;
  const pulsePoints = values.map((v, i) => `${32 + i * (590 / Math.max(1, values.length - 1))},${142 - (v.pulse / 180) * 108}`).join(" ");
  const pressurePoints = values.map((v, i) => `${32 + i * (590 / Math.max(1, values.length - 1))},${142 - (v.bpSys / 180) * 108}`).join(" ");
  return <div className="vital-chart"><div className="chart-legend"><span><i className="pulse-dot" />Puls / min</span><span><i className="pressure-dot" />RR syst. / mmHg</span><small>Synthetischer Verlauf</small></div><svg viewBox="0 0 660 185" role="img" aria-label="Synthetischer Verlauf von Puls und systolischem Blutdruck. Messwerte stehen in der Tabelle.">
    {[34, 70, 106, 142].map((y, i) => <g key={y}><line x1="28" y1={y} x2="640" y2={y} stroke="#dbe3e9" /><text x="2" y={y + 4} fontSize="10" fill="#5a6875">{180 - i * 60}</text></g>)}
    {values.map((v, i) => <g key={v.time}><line x1={32 + i * (590 / Math.max(1, values.length - 1))} y1="28" x2={32 + i * (590 / Math.max(1, values.length - 1))} y2="148" stroke="#e5ebef" /><text x={32 + i * (590 / Math.max(1, values.length - 1))} y="172" textAnchor="middle" fontSize="10" fill="#5a6875">{v.time}</text></g>)}
    <polyline points={pressurePoints} fill="none" stroke="#386f9a" strokeWidth="2" /><polyline points={pulsePoints} fill="none" stroke="#b45664" strokeWidth="2" />
    {values.map((v, i) => <circle key={v.time} cx={32 + i * (590 / Math.max(1, values.length - 1))} cy={142 - (v.pulse / 180) * 108} r="3" fill="#b45664" />)}
  </svg></div>;
}

export default function KisWorkspace({ initialPatientId, initialDocumentId, initialEvidenceId, initialPage = 1, careState, integrationPanel, basePath = "/" }: { initialPatientId?: string; initialDocumentId?: string; initialEvidenceId?: string; initialPage?: number; careState?: CareSnapshot; integrationPanel?: ReactNode; basePath?: string }) {
  const patients: Patient[] = useMemo(() => projectClinicalPatients(careState), [careState]);
  const initialPatient = patients.find(patient => patient.id === initialPatientId) ?? null;
  const initialDoc = initialPatient?.documents.find(doc => doc.id === initialDocumentId);
  const initialFact = initialDoc && initialPatient ? [...initialPatient.facts, ...(initialPatient.carePreferences ?? [])].find(fact => fact.id === initialEvidenceId && fact.documentId === initialDoc.id) : undefined;
  const [selectedSeed, setSelected] = useState<Patient | null>(initialPatient);
  const selected = patients.find(patient => patient.id === selectedSeed?.id) ?? null;
  const [section, setSection] = useState<Section>(initialDoc ? "documents" : "overview");
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [opened, setOpened] = useState<OpenDocument | null>(initialDoc ? { document: initialDoc, page: initialFact?.page ?? Math.max(1, Math.min(initialPage, initialDoc.pages.length)), section: initialFact?.section, quote: initialFact?.quote, fact: initialFact } : null);
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const [readDocuments, setReadDocuments] = useState<string[]>([]);
  const [documentSearchQuery, setDocumentQuery] = useState("");
  const documentQuery = section === "documents" ? documentSearchQuery : "";
  const [inbox, setInbox] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const viewerHeading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<string | null>(null);
  const sourcePanel = useRef<HTMLDivElement>(null);
  const stationSearchInput = useRef<HTMLInputElement>(null);
  const documentSearchInput = useRef<HTMLInputElement>(null);
  const stationReturnPatient = useRef<string | null>(initialPatient?.id ?? null);
  const chartFocusRequested = useRef(false);
  const hintOrigin = useRef<{ element: HTMLElement | null; factId: string } | null>(null);
  const patientBanner = useRef<HTMLElement>(null);
  const carePreferencesHeading = useRef<HTMLHeadingElement>(null);

  const showCarePreferences = () => {
    const target = carePreferencesHeading.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    // Measure the sticky context so the destination stays visible on narrow screens too.
    window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - (patientBanner.current?.offsetHeight ?? 0) - 16, behavior: "instant" });
  };

  const updateAddress = useCallback((patient: Patient | null, doc?: ClinicalDocument, page = 1, fact?: Fact) => {
    const params = new URLSearchParams();
    if (patient) params.set("patient", patient.id);
    if (doc) { params.set("document", doc.id); params.set("page", String(page)); }
    if (fact) params.set("evidence", fact.id);
    window.history.replaceState(null, "", params.size ? basePath + (basePath.includes("?") ? "&" : "?") + params.toString() : basePath);
  }, [basePath]);
  const openPatient = (patient: Patient, nextSection: Section = "overview") => {
    stationReturnPatient.current = patient.id;
    chartFocusRequested.current = true;
    setSelected(patient); setSection(nextSection); setOpened(null); setActiveFact(null); setDocumentQuery(""); setInbox(false);
    updateAddress(patient);
  };
  const closeChart = () => {
    setSelected(null); setOpened(null); setActiveFact(null); setInbox(false); updateAddress(null);
  };
  const selectSection = (next: Section) => { setSection(next); setOpened(null); if (selected) updateAddress(selected); };
  const openDocument = (doc: ClinicalDocument, page = 1, fact?: Fact, originId?: string) => {
    returnFocus.current = originId ?? "document-" + doc.id;
    setOpened({ document: doc, page, section: fact?.section, quote: fact?.quote, fact });
    setReadDocuments(current => Array.from(new Set([...current, doc.id])));
    if (selected) updateAddress(selected, doc, page, fact);
  };
  const closeDocument = () => { setOpened(null); if (selected) updateAddress(selected); };
  const closeFact = useCallback(() => {
    setActiveFact(null);
    const origin = hintOrigin.current;
    const target = origin?.element?.isConnected ? origin.element : origin ? document.getElementById("hint-toggle-" + origin.factId) : null;
    target?.focus();
  }, []);
  useEffect(() => {
    if (selectedSeed?.id) {
      // Route hydration must not take focus back from a control the user already reached.
      if (chartFocusRequested.current || document.activeElement === document.body) heading.current?.focus();
    }
    else if (stationReturnPatient.current) {
      const target = document.getElementById("station-patient-" + stationReturnPatient.current) ?? stationSearchInput.current;
      target?.focus();
      stationReturnPatient.current = null;
    }
    chartFocusRequested.current = false;
  }, [selectedSeed?.id]);
  useEffect(() => {
    if (opened) { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); viewerHeading.current?.focus({ preventScroll: true }); }
    if (!opened && returnFocus.current) {
      const originId = returnFocus.current;
      const documentId = originId.startsWith("document-") ? originId.slice("document-".length) : null;
      // History links have no element ID and are remounted when the reader closes.
      const origin = document.getElementById(originId) ?? (documentId
        ? Array.from(document.querySelectorAll<HTMLAnchorElement>('[role="tabpanel"][data-state="active"] a.patient-link'))
          .find(link => new URL(link.href).searchParams.get("document") === documentId)
        : null);
      origin?.focus();
      returnFocus.current = null;
    }
  }, [opened]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      if (opened) { setOpened(null); if (selected) updateAddress(selected); }
      else if (activeFact) closeFact();
      else if (selected) { setSelected(null); setInbox(false); updateAddress(null); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [opened, activeFact, selected, updateAddress, closeFact]);

  const visiblePatients = patients.filter(patient => (!room || patient.room === room) && [patient.name, patient.first, patient.id, patient.room, ...patient.diagnoses.map(d => d.title)].join(" ").toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de")));
  const activeScope = selected?.facts.find(fact => fact.id === activeFact);
  const hasDocumentedAllergy = selected?.allergies.some(allergy => allergy !== "Keine Allergie dokumentiert") ?? false;
  const openFact = (fact: Fact) => {
    if (activeFact === fact.id && !opened) { closeFact(); return; }
    hintOrigin.current = { element: document.activeElement instanceof HTMLElement ? document.activeElement : null, factId: fact.id };
    setActiveFact(fact.id);
    closeDocument();
    requestAnimationFrame(() => sourcePanel.current?.scrollIntoView({ block: "nearest", behavior: "auto" }));
  };
  const sourceLink = (fact: Fact, compact = false) => {
    const doc = selected?.documents.find(item => item.id === fact.documentId);
    if (!doc || !selected) return null;
    const originId = "source-" + fact.id + (compact ? "-compact" : "");
    return <a id={originId} className="source-link" href={`${basePath}${basePath.includes("?") ? "&" : "?"}patient=${selected.id}&document=${doc.id}&page=${fact.page}&evidence=${encodeURIComponent(fact.id)}`} onClick={event => { event.preventDefault(); openDocument(doc, fact.page, fact, originId); }}><Icon name="document" width="13" height="13" />{compact ? "Beleg anzeigen" : doc.title} · S. {fact.page}<span>{compact ? "" : " · " + fact.section}</span><Icon name="arrow" width="12" height="12" /></a>;
  };
  const matchingDocuments = selected?.documents.filter(doc => (doc.title + " " + doc.kind).toLocaleLowerCase("de").includes(documentQuery.toLocaleLowerCase("de"))) ?? [];
  const renderDocuments = (compact = false) => {
    if (!selected) return null;
    const docs = matchingDocuments;
    return <div className="table-scroll"><table className="document-table"><thead><tr><th>Status</th><th>Dokument / Typ</th><th>Dokumentdatum</th>{!compact && <th>Geltungsbereich</th>}<th>In Akte seit</th><th>Quelle</th></tr></thead><tbody>{docs.map(doc => <tr key={doc.id}><td><span className="document-state"><i className={readDocuments.includes(doc.id) ? "read-indicator" : "new-indicator"} />{readDocuments.includes(doc.id) ? "Geöffnet" : doc.status}</span></td><td><a id={"document-" + doc.id} href={`${basePath}${basePath.includes("?") ? "&" : "?"}patient=${selected.id}&document=${doc.id}&page=1`} className="patient-link" onClick={event => { event.preventDefault(); openDocument(doc); }}>{doc.title}</a><small>{doc.kind} · {doc.pages.length} Seiten</small></td><td>{formatDate(doc.date)}</td>{!compact && <td>{selected.facts.filter(fact => fact.documentId === doc.id).map(fact => <div key={fact.id}><strong>{categoryNames[fact.category]}</strong><small>{fact.condition}</small><small>Ausgenommen: {fact.exclusions.join("; ")}</small>{fact.person && <small>Benannte Person: {fact.person}</small>}</div>)}</td>}<td>{formatDate(doc.received)}</td><td><span className={"source-cell provenance-" + (doc.provenance?.kind ?? "synthetic")}>{doc.provenance?.label ?? "Synthetischer Demotext"}</span><small>{doc.provenance?.version || "PDF · Dokumenttext einsehbar"}</small>{doc.provenance?.url && <a className="template-link" href={doc.provenance.url} target="_blank" rel="noopener noreferrer">Vorlage ansehen ↗</a>}</td></tr>)}</tbody></table>{!docs.length && <p className="empty-table">Keine Dokumente für diesen Suchbegriff.</p>}</div>;
  };
  const renderFacts = () => selected?.facts.map(fact => <div className={"scope-row " + fact.category} key={fact.id}><div><button className="scope-link" onClick={() => openFact(fact)}>{fact.label}</button><strong>{fact.value}</strong><small>{fact.condition}</small>{fact.exclusions.length > 0 && <small className="scope-exclusions">Grenzen: {fact.exclusions.join("; ")}</small>}</div>{sourceLink(fact, true)}</div>);
  const renderCarePreferences = () => selected?.carePreferences?.length ? <Panel title="Behandlungswünsche im Versorgungskontext" headingRef={carePreferencesHeading} className="full-width treatment-preferences" action={<span>Aus der Patientenverfügung</span>}><p className="treatment-context">Situationsgebundene Aussagen aus dem Dokument. Die Anwendbarkeit auf den aktuellen Fall ist nicht bestätigt.</p><div className="care-preference-grid">{selected.carePreferences.map(fact => <article className="care-preference" key={fact.id}><div className="care-preference-heading"><strong>{fact.target ?? fact.label}</strong><span>Dokumentierter Wunsch</span></div><p className="care-preference-value">{fact.value}</p><p className="care-preference-condition"><b>Gilt nur:</b> {fact.condition}</p>{fact.exclusions.length > 0 && <p className="care-preference-limits"><b>Grenzen:</b> {fact.exclusions.join("; ")}</p>}<div className="care-preference-source">{sourceLink(fact, true)}{fact.templateSection && <small>Vorlagenbaustein {fact.templateSection}</small>}</div></article>)}</div></Panel> : null;
  const renderVitalsTable = () => selected && <div className="table-scroll"><table className="vitals-table"><thead><tr><th>Vitalparameter</th>{selected.vitals.map(v => <th key={v.time}>{v.time} Uhr</th>)}</tr></thead><tbody>
    <tr><th>Blutdruck [mmHg]</th>{selected.vitals.map(v => <td key={v.time}>{v.bpSys} / {v.bpDia}</td>)}</tr>
    <tr><th>Puls [/min]</th>{selected.vitals.map(v => <td key={v.time}>{v.pulse}</td>)}</tr>
    <tr><th>Temperatur [°C]</th>{selected.vitals.map(v => <td key={v.time}>{v.temperature.toFixed(1)}</td>)}</tr>
    <tr><th>SpO₂ [%]</th>{selected.vitals.map(v => <td key={v.time}>{v.spo2}</td>)}</tr>
    <tr><th>Atemfrequenz [/min]</th>{selected.vitals.map(v => <td key={v.time}>{v.resp}</td>)}</tr>
  </tbody></table></div>;

  return <div className="hospital-shell">
    <header className="application-title"><span><b className="hospital-logo">+</b>Klinikum Nord <span className="application-subtitle">Klinischer Arbeitsplatz</span></span><span className="demo-label">Synthetische Demo</span><span className="session-user">{careState?.actor.name ?? "Dr. M. Weber · Ärztlicher Dienst"}</span>{!careState && <a href="/vorsorge" className="text-button">Persönliche Vorsorge</a>}</header>
    <div className="application-tabs"><button className={!selected && !inbox ? "active" : ""} onClick={closeChart}><Icon name="hospital" width="15" height="15" />Station 2A <small>Innere Medizin</small></button>{selected && <button className="active patient-workspace-tab" onClick={closeDocument}><Icon name="users" width="15" height="15" />{selected.name}, {selected.first}<small>Fall {selected.id}</small></button>}<span className="system-date">05.11.2026 · Stand 16:30</span></div>
    <div className="application-body">
      <nav className="module-rail" aria-label="Hauptmodule"><button className={!inbox && !selected ? "active" : ""} aria-label="Stationsübersicht" title="Stationsübersicht" onClick={closeChart}><Icon name="hospital" /></button><button className={inbox ? "active" : ""} aria-label="Dokumenteneingang" title="Dokumenteneingang" onClick={() => { setSelected(null); setOpened(null); setInbox(true); updateAddress(null); }}><Icon name="inbox" /></button>{selected && sections.map(item => <button key={item.id} className={section === item.id && !opened ? "active" : ""} aria-label={item.label} title={item.label} onClick={() => selectSection(item.id)}><Icon name={item.icon} /></button>)}<span className="rail-spacer" /><span className="rail-status" title="Lokale Demonstration"><Icon name="shield" /></span></nav>
      <aside className="case-navigation">
        <div className="tree-heading">{selected ? "Aktueller Fall" : "Organisation"}</div>
        {selected ? <><div className="tree-case"><b>{selected.id}</b><small>{selected.admission} · Station 2A</small></div><nav aria-label="Fallnavigation">{sections.map(item => <button key={item.id} className={"tree-item " + (section === item.id && !opened ? "active" : "")} onClick={() => selectSection(item.id)}><Icon name={item.icon} width="14" height="14" />{item.label}{item.id === "documents" && <span>{selected.documents.length}</span>}</button>)}</nav><div className="tree-subsection">Vorsorge & Vertretung</div>{selected.facts.map(fact => <button key={fact.id} className={"tree-fact " + (activeFact === fact.id ? "active" : "")} onClick={() => openFact(fact)}><i className={"category-dot " + fact.category} />{categoryNames[fact.category] ?? fact.category}</button>)}<div className="tree-heading secondary-heading">Station 2A</div></> : <><button className="tree-item active" onClick={closeChart}><Icon name="hospital" width="14" height="14" />Stationsliste</button><div className="tree-subsection">Innere Medizin</div></>}
        <div className="rooms-tree">{["201", "202", "203", "204"].map(number => <button key={number} className={room === number ? "active" : ""} onClick={() => { closeChart(); setRoom(room === number ? "" : number); setQuery(""); }}><Icon name="bed" width="14" height="14" /><span>Zimmer {number}</span><small>2 / 2</small></button>)}</div>
        {selected && <><div className="tree-heading secondary-heading">Patienten auf Station</div><div className="patient-shortlist">{patients.map(patient => <button key={patient.id} className={selected.id === patient.id ? "active" : ""} onClick={() => openPatient(patient)}><span>{patient.room}{patient.bed}</span>{patient.name}, {patient.first[0]}.</button>)}</div></>}
        <div className="tree-footer"><span className="status-dot" />Arbeitsplatz Station 2A<small>{careState ? careState.mode === "demo" ? "Gemeinsamer Demozustand" : "Dokumenteneingang über Supabase" : "Demodaten · keine Live-Verbindung"}</small></div>
      </aside>
      <div className="clinical-workspace">
        <div className="clinical-toolbar"><div className="toolbar-path"><Icon name={selected ? "users" : "hospital"} width="16" height="16" />{selected ? "Fall" : "Station"} <span>›</span> {opened ? "Dokumentenansicht" : selected ? sections.find(item => item.id === section)?.label : inbox ? "Dokumenteneingang" : "Belegungsliste"}</div><div className="toolbar-actions">{selected && <button className="toolbar-button" onClick={closeChart}><Icon name="back" width="14" height="14" />Akte schließen</button>}<span className="toolbar-divider" /><span>Innere Medizin / 2A</span></div></div>
        <main id="main">
          {integrationPanel}
          {!selected ? <>
            <div className="view-heading"><h1>{inbox ? "Dokumenteneingang" : "Stationsübersicht"}</h1><span>Station 2A · 8 Patienten · 4 Zimmer · 8 belegte Betten</span></div>
            {inbox ? <Panel title="Externe Vorsorgedokumente · Patientenbezogene Eingänge"><div className="table-scroll"><table><thead><tr><th>Eingang</th><th>Patient / Fall</th><th>Dokument</th><th>Status</th><th>Aktion</th></tr></thead><tbody>{patients.flatMap(patient => patient.documents.map(doc => <tr key={doc.id}><td>{formatDate(doc.received)}</td><td><button className="patient-link" onClick={() => openPatient(patient, "documents")}>{patient.name}, {patient.first}</button><small>{patient.id} · {patient.room}/{patient.bed}</small></td><td>{doc.title}</td><td><span className="document-state"><i className="new-indicator" />{doc.status}</span></td><td><button className="text-button" onClick={() => openPatient(patient, "documents")}>Akte öffnen</button></td></tr>))}</tbody></table></div></Panel> : <>
              <div className="station-filters"><label><span>Patientensuche</span><input ref={stationSearchInput} type="search" name="patient-query" autoComplete="off" placeholder="Name, Fallnummer, Diagnose" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span>Zimmer</span><select value={room} onChange={event => setRoom(event.target.value)}><option value="">Alle Zimmer</option>{["201","202","203","204"].map(number => <option key={number} value={number}>Zimmer {number}</option>)}</select></label><span className="filter-count" role="status" aria-live="polite" aria-atomic="true">{visiblePatients.length} von 8 Fällen</span>{(room || query) && <button className="text-button" onClick={() => { setRoom(""); setQuery(""); }}>Filter aufheben</button>}</div>
              <div className="table-scroll"><table className="ward-table patient-table"><thead><tr><th>Zimmer/Bett</th><th>Patient / Patientin</th><th>Fall / Aufnahme</th><th>Hauptdiagnose</th><th>RR / Puls</th><th>Vorsorge</th><th>Fallstatus</th><th /></tr></thead><tbody>{visiblePatients.map(patient => { const latest = patient.vitals[patient.vitals.length - 1]; return <tr key={patient.id}><td className="bed-cell"><strong>{patient.room}</strong> / {patient.bed}</td><td><button id={"station-patient-" + patient.id} className="patient-link" onClick={() => openPatient(patient)}>{patient.name}, {patient.first}</button><small>{patient.birth} · {patient.sex}</small></td><td className="numeric">{patient.id}<small>{patient.admission}</small></td><td><span>{patient.diagnoses[0]?.title}</span><small>{patient.diagnoses[0]?.code}</small></td><td className="numeric">{latest.bpSys}/{latest.bpDia}<small>{latest.pulse} /min · {latest.time}</small></td><td><button className="ward-document-button" onClick={() => openPatient(patient, "documents")}><Icon name="document" width="14" height="14" />{patient.documents.length} Dokumente</button><small>{patient.facts.length} Hinweise</small></td><td><span className="status-pill">{patient.status}</span></td><td><button className="icon-button" aria-label={"Akte von " + patient.first + " " + patient.name + " öffnen"} onClick={() => openPatient(patient)}><Icon name="arrow" width="15" height="15" /></button></td></tr>; })}</tbody></table>{!visiblePatients.length && <div className="empty-state"><h2>Keine passenden Patienten</h2><p>Suchbegriff oder Zimmerfilter anpassen.</p></div>}</div>
              <div className="station-lower"><Panel title="Letzte Einträge auf Station"><table><thead><tr><th>Zeit</th><th>Patient</th><th>Ereignis</th></tr></thead><tbody>{patients.slice(0,4).map(patient => <tr key={patient.id}><td>{patient.events[0]?.time}</td><td><button className="patient-link" onClick={() => openPatient(patient, "history")}>{patient.name}</button></td><td>{patient.events[0]?.title}</td></tr>)}</tbody></table></Panel><Panel title="Vorsorgedokumentation"><table><tbody><tr><th>Vorsorgevollmachten</th><td>{patients.length} hinterlegt</td></tr><tr><th>Patientenverfügungen</th><td>{patients.length} hinterlegt</td></tr><tr><th>Betreuungswünsche / Auskunft</th><td>In den jeweiligen Akten</td></tr></tbody></table><p className="panel-footnote">Befugnisse und Einschränkungen werden dokumentbezogen dargestellt.</p></Panel></div>
            </>}
          </> : <>
            <section ref={patientBanner} className="patient-banner" aria-label="Patientenkontext"><div className="patient-strip"><h1 ref={heading} tabIndex={-1}><Icon name="users" width="16" height="16" />{selected.name}, {selected.first}</h1><span>Fall-Nr. {selected.id}</span><span className="patient-strip-status">{selected.status}</span></div><div className="patient-demographics"><dl><div><dt>Geburtsdatum</dt><dd>{selected.birth} · {selected.sex}</dd></div><div><dt>Fallnummer</dt><dd>{selected.id}</dd></div></dl><dl><div><dt>Aufnahme</dt><dd>{selected.admission}</dd></div><div><dt>Station / Zimmer / Bett</dt><dd>2A / {selected.room} / {selected.bed}</dd></div></dl><dl><div><dt>Behandlungsteam</dt><dd>{selected.team}</dd></div><div><dt>Kostenträger</dt><dd>{selected.insurance}</dd></div></dl></div></section>
            <div className="clinical-flags"><span className="flags-label">Vorsorge</span>{selected.facts.map(fact => <button key={fact.id} id={"hint-toggle-" + fact.id} aria-expanded={activeFact === fact.id && !opened} aria-controls={activeFact === fact.id && !opened ? "care-scope-details" : undefined} className={"hot-tag " + fact.category} onClick={() => openFact(fact)}><i className={"category-dot " + fact.category} />{fact.label}<Icon name="chevron" width="11" height="11" /></button>)}<span className={"allergy-flag" + (hasDocumentedAllergy ? "" : " neutral")}>{hasDocumentedAllergy && <Icon name="alert" width="13" height="13" />}{selected.allergies.join(", ")}</span></div>
            {activeScope && !opened && <div id="care-scope-details" className="scope-detail" ref={sourcePanel} role="region" aria-label="Vorsorgehinweis"><div className="scope-detail-heading"><strong>{activeScope.label}: {activeScope.value}</strong><button className="icon-button" aria-label="Hinweisdetails schließen" onClick={closeFact}><Icon name="close" width="14" height="14" /></button></div><div className="scope-detail-columns"><div><p><b>Bedingung:</b> {activeScope.condition}</p><p><b>Nicht umfasst:</b> {activeScope.exclusions.join("; ") || "Keine weitere Einschränkung im synthetischen Text genannt."}</p>{activeScope.person && <p><b>Benannte Person:</b> <button className="text-button" onClick={() => { setSection("contacts"); setActiveFact(null); }}>{activeScope.person}</button></p>}</div><div><blockquote>{activeScope.quote}</blockquote>{sourceLink(activeScope)}</div></div><p className="scope-disclaimer">Dokumentierter Inhalt · keine automatische rechtliche oder medizinische Freigabe</p></div>}
            {opened ? <section className="embedded-viewer"><div className="viewer-heading"><div><h2 ref={viewerHeading} tabIndex={-1}>{opened.document.title}</h2><p>{formatDate(opened.document.date)} · {opened.document.kind} · {opened.document.status}</p>{opened.document.provenance && <p className={"viewer-provenance provenance-" + opened.document.provenance.kind}>{opened.document.provenance.label}</p>}</div><button className="button secondary" onClick={closeDocument}><Icon name="close" width="14" height="14" />Dokument schließen</button></div><PdfViewer key={selected.id + opened.document.id + opened.page + (opened.fact?.id ?? opened.section ?? "")} doc={{title:opened.document.title,url:opened.document.url}} initialPage={opened.page} sourceSection={opened.section} sourceQuote={opened.quote} sourcePerson={opened.fact?.person ?? selected.facts.find(fact => fact.documentId === opened.document.id)?.person} sourceCondition={opened.fact?.condition ?? selected.facts.find(fact => fact.documentId === opened.document.id)?.condition} sourceExclusions={opened.fact?.exclusions ?? selected.facts.find(fact => fact.documentId === opened.document.id)?.exclusions} evidenceId={opened.fact?.id} sourceTemplatePage={opened.fact?.templatePage} provenance={opened.document.provenance} /></section> :
              <Tabs.Root value={section} onValueChange={value => setSection(value as Section)} className="clinical-tabs"><Tabs.List className="clinical-tab-list" aria-label="Bereiche der Patientenakte">{sections.map(item => <Tabs.Trigger key={item.id} value={item.id}>{item.label}{item.id === "documents" && <span>{selected.documents.length}</span>}</Tabs.Trigger>)}</Tabs.List>
                <Tabs.Content value="overview">{!!selected.carePreferences?.length && <div className="care-preferences-shortcut"><button type="button" className="care-preferences-jump" onClick={showCarePreferences}><Icon name="document" width="15" height="15" />Behandlungswünsche im Detail<Icon name="arrow" width="15" height="15" /></button><span>Bedingungen, Grenzen und Originalbelege</span></div>}<div className="overview-grid case-overview">
                  <Panel title="Aktuelle Anamnese" className="case-anamnesis"><p className="clinical-text">{selected.notes}</p><dl className="compact-details"><div><dt>Allergien / Unverträglichkeiten</dt><dd>{selected.allergies.join("; ")}</dd></div><div><dt>Blutgruppe</dt><dd>{selected.bloodGroup}</dd></div></dl></Panel>
                  <Panel title="Vorsorge & Vertretungsregelung" className="scope-panel" action={<button className="panel-action" onClick={() => setSection("documents")}>Dokumente</button>}>{renderFacts()}</Panel>
                  <Panel title="Diagnosen" className="case-diagnoses"><table><thead><tr><th>ICD-10</th><th>Bezeichnung</th><th>Art</th></tr></thead><tbody>{selected.diagnoses.map((diagnosis,index) => <tr key={diagnosis.code}><td className="numeric">{diagnosis.code}</td><td>{diagnosis.title}</td><td>{index === 0 ? "Hauptdiagnose" : "Nebendiagnose"}</td></tr>)}</tbody></table></Panel>
                  <Panel title="Aktuelle Vitalwerte" className="case-vitals" action={<button className="panel-action" onClick={() => setSection("vitals")}>Kurve öffnen</button>}><PulseMonitor sample={selected.vitals[selected.vitals.length - 1]} /><VitalChart patient={selected} /></Panel>
                  {renderCarePreferences()}
                  <Panel title="Befunde und Dokumente chronologisch" className="full-width">{renderDocuments(true)}</Panel>
                  <Panel title="Aktuelle Medikation"><div className="table-scroll"><table><thead><tr><th>Präparat</th><th>Dosis</th><th>Schema</th><th>Appl.</th></tr></thead><tbody>{selected.medication.map(med => <tr key={med.name}><td>{med.name}</td><td>{med.dose}</td><td className="numeric">{med.schedule}</td><td>{med.route}</td></tr>)}</tbody></table></div><p className="panel-footnote">Synthetischer Medikationsplan · keine Therapieanweisung</p></Panel>
                  <Panel title="Laborbefunde"><table><thead><tr><th>Parameter</th><th>Wert</th><th>Referenz</th></tr></thead><tbody>{selected.labs.map(lab => <tr key={lab.name}><td>{lab.name}</td><td className={lab.flag ? "flagged-result" : ""}>{lab.value} {lab.unit} {lab.flag && <span>{lab.flag}</span>}</td><td>{lab.reference}</td></tr>)}</tbody></table></Panel>
                </div></Tabs.Content>
                <Tabs.Content value="vitals"><Panel title="Kurvenblatt · 05.11.2026" action={<span>Station 2A · Pflege / Vitalparameter</span>}><PulseMonitor sample={selected.vitals[selected.vitals.length - 1]} /><VitalChart patient={selected} />{renderVitalsTable()}</Panel><div className="overview-grid lower-grid"><Panel title="Pflegedokumentation"><p className="clinical-text">{selected.notes}</p><dl className="compact-details"><div><dt>Beobachtungszeitraum</dt><dd>06:00–16:00 Uhr · 05.11.2026</dd></div><div><dt>Dokumentation</dt><dd>Vollständig synthetische Messreihe</dd></div></dl></Panel><Panel title="Relevante Vorsorgehinweise">{renderFacts()}</Panel></div></Tabs.Content>
                <Tabs.Content value="documents"><div className="document-filter"><label>Dokument suchen <input ref={documentSearchInput} type="search" name="document-query" autoComplete="off" value={documentQuery} onChange={event => setDocumentQuery(event.target.value)} placeholder="Titel oder Dokumentart" /></label>{documentQuery && <button className="text-button document-search-clear" onClick={() => { setDocumentQuery(""); documentSearchInput.current?.focus(); }}>Suche leeren</button>}<span role="status" aria-live="polite" aria-atomic="true">{matchingDocuments.length} von {selected.documents.length} Dokumenten</span></div><Panel title="Vorsorgedokumente und medizinische Willenserklärungen">{renderDocuments()}<p className="panel-footnote">„Dokumentiert“ bezeichnet den Akteneingang. Umfang und Bedingungen ergeben sich aus dem jeweiligen Dokument.</p></Panel><Panel title="Geltungsbereiche und Quellenverzeichnis" className="lower-panel">{renderFacts()}</Panel></Tabs.Content>
                <Tabs.Content value="contacts"><div className="overview-grid"><Panel title="Kontaktperson"><dl className="compact-details"><div><dt>Name</dt><dd>{selected.contact.name}</dd></div><div><dt>Beziehung</dt><dd>{selected.contact.relationship}</dd></div><div><dt>Telefon</dt><dd>{selected.contact.phone}</dd></div><div><dt>Hinweis</dt><dd>Kontaktdaten allein begründen keine Vertretungsbefugnis.</dd></div></dl></Panel><Panel title="Befugnisse der benannten Personen">{renderFacts()}</Panel></div></Tabs.Content>
                <Tabs.Content value="history"><Panel title="Fallbezogener Dokumentationsverlauf"><table><thead><tr><th>Zeit</th><th>Eintrag</th><th>Inhalt / Quelle</th></tr></thead><tbody>{selected.events.map((event,index) => <tr key={index}><td className="numeric">{event.time}</td><td><strong>{event.title}</strong></td><td>{event.text}</td></tr>)}{selected.documents.map(doc => <tr key={doc.id}><td>{formatDate(doc.received)}</td><td>Vorsorgedokument hinterlegt</td><td><a href={`${basePath}${basePath.includes("?") ? "&" : "?"}patient=${selected.id}&document=${doc.id}&page=1`} className="patient-link" onClick={event => {event.preventDefault();openDocument(doc);}}>{doc.title}</a><small>Externe Vorsorgedokumentation · {doc.status}</small></td></tr>)}</tbody></table></Panel></Tabs.Content>
              </Tabs.Root>}
            <IdleDialog onFinish={closeChart} />
          </>}
        </main>
        <footer className="clinical-statusbar"><span><i className="status-dot" />Lokale Demonstration · synthetische Patienten und Dokumente</span><span>05.11.2026 · Station 2A</span></footer>
      </div>
    </div>
  </div>;
}
