"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import dataset from "@/lib/demo-patients.json";
import { useCardReader } from "@/hooks/useCardReader";
import ScanToast from "./ScanToast";
import PdfViewer from "./PdfViewer";
import IdleDialog from "./IdleDialog";
import { Icon } from "./Icons";

type Patient = (typeof dataset.patients)[number];
type ClinicalDocument = Patient["documents"][number];
type Fact = Patient["facts"][number];
type Section = "overview" | "vitals" | "documents" | "contacts" | "history";
type OpenDocument = { document: ClinicalDocument; page: number; section?: string; quote?: string };
const patients = dataset.patients;
const cardPatients: Record<string, string> = { demo: "26004179" };
const SCAN_FALLBACK_PATIENT = "26004179";
const sections: { id: Section; label: string; icon: "pages" | "pulse" | "document" | "users" | "history" }[] = [
  { id: "overview", label: "Fallübersicht", icon: "pages" },
  { id: "vitals", label: "Kurve / Vitaldaten", icon: "pulse" },
  { id: "documents", label: "Dokumente", icon: "document" },
  { id: "contacts", label: "Kontakte / Vertretung", icon: "users" },
  { id: "history", label: "Verlauf", icon: "history" },
];
const categoryNames: Record<string, string> = { representation: "Vertretung", wishes: "Behandlungswünsche", care: "Betreuungswunsch", information: "Auskunft" };
const formatDate = (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(value).toLocaleDateString("de-DE") : value;

function Panel({ title, children, action, className = "" }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={"clinical-panel " + className}><header><h2>{title}</h2>{action}</header><div className="panel-content">{children}</div></section>;
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

export default function KisWorkspace({ initialPatientId, initialDocumentId, initialPage = 1 }: { initialPatientId?: string; initialDocumentId?: string; initialPage?: number }) {
  const initialPatient = patients.find(patient => patient.id === initialPatientId) ?? null;
  const initialDoc = initialPatient?.documents.find(doc => doc.id === initialDocumentId);
  const [selected, setSelected] = useState<Patient | null>(initialPatient);
  const [section, setSection] = useState<Section>(initialDoc ? "documents" : "overview");
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [opened, setOpened] = useState<OpenDocument | null>(initialDoc ? { document: initialDoc, page: Math.max(1, Math.min(initialPage, initialDoc.pages.length)) } : null);
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const [readDocuments, setReadDocuments] = useState<string[]>([]);
  const [documentQuery, setDocumentQuery] = useState("");
  const [toast, setToast] = useState<{ patient: Patient; at: number } | null>(null);
  const [inbox, setInbox] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<string | null>(null);
  const sourcePanel = useRef<HTMLDivElement>(null);

  const updateAddress = (patient: Patient | null, doc?: ClinicalDocument, page = 1) => {
    const params = new URLSearchParams();
    if (patient) params.set("patient", patient.id);
    if (doc) { params.set("document", doc.id); params.set("page", String(page)); }
    window.history.replaceState(null, "", params.size ? "/?" + params.toString() : "/");
  };
  const openPatient = (patient: Patient, nextSection: Section = "overview") => {
    setSelected(patient); setSection(nextSection); setOpened(null); setActiveFact(null); setDocumentQuery(""); setInbox(false);
    updateAddress(patient);
  };
  const onCard = (id: string) => {
    const patient = patients.find(patient => patient.id === (cardPatients[id] ?? SCAN_FALLBACK_PATIENT));
    if (patient) { openPatient(patient, "documents"); setToast({ patient, at: Date.now() }); }
  };
  useCardReader({ onCard });
  const closeChart = () => {
    setSelected(null); setOpened(null); setActiveFact(null); setInbox(false); updateAddress(null);
  };
  const selectSection = (next: Section) => { setSection(next); setOpened(null); if (selected) updateAddress(selected); };
  const openDocument = (doc: ClinicalDocument, page = 1, fact?: Fact, originId?: string) => {
    returnFocus.current = originId ?? "document-" + doc.id;
    setOpened({ document: doc, page, section: fact?.section, quote: fact?.quote });
    setReadDocuments(current => Array.from(new Set([...current, doc.id])));
    if (selected) updateAddress(selected, doc, page);
  };
  const closeDocument = () => { setOpened(null); if (selected) updateAddress(selected); };
  useEffect(() => { if (selected) heading.current?.focus(); }, [selected]);
  useEffect(() => {
    if (!opened && returnFocus.current) { document.getElementById(returnFocus.current)?.focus(); returnFocus.current = null; }
  }, [opened]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      if (opened) { setOpened(null); if (selected) updateAddress(selected); }
      else if (activeFact) setActiveFact(null);
      else if (selected) { setSelected(null); setInbox(false); updateAddress(null); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [opened, activeFact, selected]);

  const visiblePatients = patients.filter(patient => (!room || patient.room === room) && [patient.name, patient.first, patient.id, patient.room, ...patient.diagnoses.map(d => d.title)].join(" ").toLocaleLowerCase("de").includes(query.toLocaleLowerCase("de")));
  const activeScope = selected?.facts.find(fact => fact.id === activeFact);
  const hasDocumentedAllergy = selected?.allergies.some(allergy => allergy !== "Keine Allergie dokumentiert") ?? false;
  const openFact = (fact: Fact) => {
    setActiveFact(fact.id);
    setOpened(null);
    requestAnimationFrame(() => sourcePanel.current?.scrollIntoView({ block: "nearest", behavior: "auto" }));
  };
  const sourceLink = (fact: Fact, compact = false) => {
    const doc = selected?.documents.find(item => item.id === fact.documentId);
    if (!doc || !selected) return null;
    const originId = "source-" + fact.id + (compact ? "-compact" : "");
    return <a id={originId} className="source-link" href={`/?patient=${selected.id}&document=${doc.id}&page=${fact.page}`} onClick={event => { event.preventDefault(); openDocument(doc, fact.page, fact, originId); }}><Icon name="document" width="13" height="13" />{compact ? "Beleg anzeigen" : doc.title} · S. {fact.page}<span>{compact ? "" : " · " + fact.section}</span><Icon name="arrow" width="12" height="12" /></a>;
  };
  const renderDocuments = (compact = false) => {
    if (!selected) return null;
    const docs = selected.documents.filter(doc => (doc.title + " " + doc.kind).toLocaleLowerCase("de").includes(documentQuery.toLocaleLowerCase("de")));
    return <div className="table-scroll"><table className="document-table"><thead><tr><th>Status</th><th>Dokument / Typ</th><th>Dokumentdatum</th>{!compact && <th>Geltungsbereich</th>}<th>In Akte seit</th><th>Quelle</th></tr></thead><tbody>{docs.map(doc => <tr key={doc.id}><td><span className="document-state"><i className={readDocuments.includes(doc.id) ? "read-indicator" : "new-indicator"} />{readDocuments.includes(doc.id) ? "Geöffnet" : doc.status}</span></td><td><a id={"document-" + doc.id} href={`/?patient=${selected.id}&document=${doc.id}&page=1`} className="patient-link" onClick={event => { event.preventDefault(); openDocument(doc); }}>{doc.title}</a><small>{doc.kind} · {doc.pages.length} Seiten</small></td><td>{formatDate(doc.date)}</td>{!compact && <td>{selected.facts.filter(fact => fact.documentId === doc.id).map(fact => <div key={fact.id}><strong>{categoryNames[fact.category]}</strong><small>{fact.condition}</small><small>Ausgenommen: {fact.exclusions.join("; ")}</small>{fact.person && <small>Benannte Person: {fact.person}</small>}</div>)}</td>}<td>{formatDate(doc.received)}</td><td><span className="source-cell">Externe Vorsorgedokumentation</span><small>PDF · Originaltext einsehbar</small></td></tr>)}</tbody></table>{!docs.length && <p className="empty-table">Keine Dokumente für diesen Suchbegriff.</p>}</div>;
  };
  const renderFacts = () => selected?.facts.map(fact => <div className="scope-row" key={fact.id}><div><button className="scope-link" onClick={() => openFact(fact)}>{fact.label}</button><strong>{fact.value}</strong><small>{fact.condition}</small>{fact.exclusions.length > 0 && <small className="scope-exclusions">Grenzen: {fact.exclusions.join("; ")}</small>}</div>{sourceLink(fact, true)}</div>);
  const renderVitalsTable = () => selected && <div className="table-scroll"><table className="vitals-table"><thead><tr><th>Vitalparameter</th>{selected.vitals.map(v => <th key={v.time}>{v.time} Uhr</th>)}</tr></thead><tbody>
    <tr><th>Blutdruck [mmHg]</th>{selected.vitals.map(v => <td key={v.time}>{v.bpSys} / {v.bpDia}</td>)}</tr>
    <tr><th>Puls [/min]</th>{selected.vitals.map(v => <td key={v.time}>{v.pulse}</td>)}</tr>
    <tr><th>Temperatur [°C]</th>{selected.vitals.map(v => <td key={v.time}>{v.temperature.toFixed(1)}</td>)}</tr>
    <tr><th>SpO₂ [%]</th>{selected.vitals.map(v => <td key={v.time}>{v.spo2}</td>)}</tr>
    <tr><th>Atemfrequenz [/min]</th>{selected.vitals.map(v => <td key={v.time}>{v.resp}</td>)}</tr>
  </tbody></table></div>;

  return <div className="hospital-shell">
    <header className="application-title"><span><b className="hospital-logo">+</b>Klinikum Nord <span className="application-subtitle">Klinischer Arbeitsplatz</span></span><span className="demo-label">Synthetische Demo</span><span className="session-user">Dr. M. Weber · Ärztlicher Dienst</span></header>
    <div className="application-tabs"><button className={!selected && !inbox ? "active" : ""} onClick={closeChart}><Icon name="hospital" width="15" height="15" />Station 2A <small>Innere Medizin</small></button>{selected && <button className="active patient-workspace-tab" onClick={() => setOpened(null)}><Icon name="users" width="15" height="15" />{selected.name}, {selected.first}<small>Fall {selected.id}</small></button>}<span className="system-date">05.11.2026 · Stand 16:30</span></div>
    <div className="application-body">
      <nav className="module-rail" aria-label="Hauptmodule"><button className={!inbox && !selected ? "active" : ""} aria-label="Stationsübersicht" title="Stationsübersicht" onClick={closeChart}><Icon name="hospital" /></button><button className={inbox ? "active" : ""} aria-label="Dokumenteneingang" title="Dokumenteneingang" onClick={() => { setSelected(null); setOpened(null); setInbox(true); updateAddress(null); }}><Icon name="inbox" /></button>{selected && sections.map(item => <button key={item.id} className={section === item.id && !opened ? "active" : ""} aria-label={item.label} title={item.label} onClick={() => selectSection(item.id)}><Icon name={item.icon} /></button>)}<span className="rail-spacer" /><span className="rail-status" title="Lokale Demonstration"><Icon name="shield" /></span></nav>
      <aside className="case-navigation">
        <div className="tree-heading">{selected ? "Aktueller Fall" : "Organisation"}</div>
        {selected ? <><div className="tree-case"><b>{selected.id}</b><small>{selected.admission} · Station 2A</small></div><nav aria-label="Fallnavigation">{sections.map(item => <button key={item.id} className={"tree-item " + (section === item.id && !opened ? "active" : "")} onClick={() => selectSection(item.id)}><Icon name={item.icon} width="14" height="14" />{item.label}{item.id === "documents" && <span>{selected.documents.length}</span>}</button>)}</nav><div className="tree-subsection">Vorsorge & Vertretung</div>{selected.facts.map(fact => <button key={fact.id} className={"tree-fact " + (activeFact === fact.id ? "active" : "")} onClick={() => openFact(fact)}><i className={"category-dot " + fact.category} />{categoryNames[fact.category] ?? fact.category}</button>)}<div className="tree-heading secondary-heading">Station 2A</div></> : <><button className="tree-item active" onClick={closeChart}><Icon name="hospital" width="14" height="14" />Stationsliste</button><div className="tree-subsection">Innere Medizin</div></>}
        <div className="rooms-tree">{["201", "202", "203", "204"].map(number => <button key={number} className={room === number ? "active" : ""} onClick={() => { closeChart(); setRoom(room === number ? "" : number); setQuery(""); }}><Icon name="bed" width="14" height="14" /><span>Zimmer {number}</span><small>2 / 2</small></button>)}</div>
        {selected && <><div className="tree-heading secondary-heading">Patienten auf Station</div><div className="patient-shortlist">{patients.map(patient => <button key={patient.id} className={selected.id === patient.id ? "active" : ""} onClick={() => openPatient(patient)}><span>{patient.room}{patient.bed}</span>{patient.name}, {patient.first[0]}.</button>)}</div></>}
        <div className="tree-footer"><span className="status-dot" />Arbeitsplatz Station 2A<small>Demodaten · keine Live-Verbindung</small></div>
      </aside>
      <div className="clinical-workspace">
        <div className="clinical-toolbar"><div className="toolbar-path"><Icon name={selected ? "users" : "hospital"} width="16" height="16" />{selected ? "Fall" : "Station"} <span>›</span> {opened ? "Dokumentenansicht" : selected ? sections.find(item => item.id === section)?.label : inbox ? "Dokumenteneingang" : "Belegungsliste"}</div><div className="toolbar-actions">{selected && <button className="toolbar-button" onClick={closeChart}><Icon name="back" width="14" height="14" />Akte schließen</button>}<span className="toolbar-divider" /><span>Innere Medizin / 2A</span></div></div>
        <main id="main">
          {!selected ? <>
            <div className="view-heading"><h1>{inbox ? "Dokumenteneingang" : "Stationsübersicht"}</h1><span>Station 2A · 8 Patienten · 4 Zimmer · 8 belegte Betten</span></div>
            {inbox ? <Panel title="Externe Vorsorgedokumente · Patientenbezogene Eingänge"><div className="table-scroll"><table><thead><tr><th>Eingang</th><th>Patient / Fall</th><th>Dokument</th><th>Status</th><th>Aktion</th></tr></thead><tbody>{patients.flatMap(patient => patient.documents.map(doc => <tr key={doc.id}><td>{formatDate(doc.received)}</td><td><button className="patient-link" onClick={() => openPatient(patient, "documents")}>{patient.name}, {patient.first}</button><small>{patient.id} · {patient.room}/{patient.bed}</small></td><td>{doc.title}</td><td><span className="document-state"><i className="new-indicator" />{doc.status}</span></td><td><button className="text-button" onClick={() => openPatient(patient, "documents")}>Akte öffnen</button></td></tr>))}</tbody></table></div></Panel> : <>
              <div className="station-filters"><label><span>Patientensuche</span><input type="search" placeholder="Name, Fallnummer, Diagnose" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span>Zimmer</span><select value={room} onChange={event => setRoom(event.target.value)}><option value="">Alle Zimmer</option>{["201","202","203","204"].map(number => <option key={number} value={number}>Zimmer {number}</option>)}</select></label><span className="filter-count">{visiblePatients.length} von 8 Fällen</span>{(room || query) && <button className="text-button" onClick={() => { setRoom(""); setQuery(""); }}>Filter aufheben</button>}</div>
              <div className="table-scroll"><table className="ward-table patient-table"><thead><tr><th>Zimmer/Bett</th><th>Patient / Patientin</th><th>Fall / Aufnahme</th><th>Hauptdiagnose</th><th>RR / Puls</th><th>Vorsorge</th><th>Fallstatus</th><th /></tr></thead><tbody>{visiblePatients.map(patient => { const latest = patient.vitals[patient.vitals.length - 1]; return <tr key={patient.id}><td className="bed-cell"><strong>{patient.room}</strong> / {patient.bed}</td><td><button className="patient-link" onClick={() => openPatient(patient)}>{patient.name}, {patient.first}</button><small>{patient.birth} · {patient.sex}</small></td><td className="numeric">{patient.id}<small>{patient.admission}</small></td><td><span>{patient.diagnoses[0]?.title}</span><small>{patient.diagnoses[0]?.code}</small></td><td className="numeric">{latest.bpSys}/{latest.bpDia}<small>{latest.pulse} /min · {latest.time}</small></td><td><button className="ward-document-button" onClick={() => openPatient(patient, "documents")}><Icon name="document" width="14" height="14" />{patient.documents.length} Dokumente</button><small>{patient.facts.length} Hinweise</small></td><td><span className="status-pill">{patient.status}</span></td><td><button className="icon-button" aria-label={"Akte von " + patient.first + " " + patient.name + " öffnen"} onClick={() => openPatient(patient)}><Icon name="arrow" width="15" height="15" /></button></td></tr>; })}</tbody></table>{!visiblePatients.length && <div className="empty-state"><h2>Keine passenden Patienten</h2><p>Suchbegriff oder Zimmerfilter anpassen.</p></div>}</div>
              <div className="station-lower"><Panel title="Letzte Einträge auf Station"><table><thead><tr><th>Zeit</th><th>Patient</th><th>Ereignis</th></tr></thead><tbody>{patients.slice(0,4).map(patient => <tr key={patient.id}><td>{patient.events[0]?.time}</td><td><button className="patient-link" onClick={() => openPatient(patient, "history")}>{patient.name}</button></td><td>{patient.events[0]?.title}</td></tr>)}</tbody></table></Panel><Panel title="Vorsorgedokumentation"><table><tbody><tr><th>Vorsorgevollmachten</th><td>{patients.length} hinterlegt</td></tr><tr><th>Patientenverfügungen</th><td>{patients.length} hinterlegt</td></tr><tr><th>Betreuungswünsche / Auskunft</th><td>In den jeweiligen Akten</td></tr></tbody></table><p className="panel-footnote">Befugnisse und Einschränkungen werden dokumentbezogen dargestellt.</p></Panel></div>
            </>}
          </> : <>
            <section className="patient-banner" aria-label="Patientenkontext"><div className="patient-strip"><h1 ref={heading} tabIndex={-1}><Icon name="users" width="16" height="16" />{selected.name}, {selected.first}</h1><span>Fall-Nr. {selected.id}</span><span className="patient-strip-status">{selected.status}</span></div><div className="patient-demographics"><dl><div><dt>Geburtsdatum</dt><dd>{selected.birth} · {selected.sex}</dd></div><div><dt>Fallnummer</dt><dd>{selected.id}</dd></div></dl><dl><div><dt>Aufnahme</dt><dd>{selected.admission}</dd></div><div><dt>Station / Zimmer / Bett</dt><dd>2A / {selected.room} / {selected.bed}</dd></div></dl><dl><div><dt>Behandlungsteam</dt><dd>{selected.team}</dd></div><div><dt>Kostenträger</dt><dd>{selected.insurance}</dd></div></dl></div></section>
            <div className="clinical-flags"><span className="flags-label">Vorsorge</span>{selected.facts.map(fact => <button key={fact.id} aria-pressed={activeFact === fact.id} className={"hot-tag " + fact.category} onClick={() => openFact(fact)}><i className={"category-dot " + fact.category} />{fact.label}<Icon name="chevron" width="11" height="11" /></button>)}<span className={"allergy-flag" + (hasDocumentedAllergy ? "" : " neutral")}>{hasDocumentedAllergy && <Icon name="alert" width="13" height="13" />}{selected.allergies.join(", ")}</span></div>
            {activeScope && !opened && <div className="scope-detail" ref={sourcePanel}><div className="scope-detail-heading"><strong>{activeScope.label}: {activeScope.value}</strong><button className="icon-button" aria-label="Hinweisdetails schließen" onClick={() => setActiveFact(null)}><Icon name="close" width="14" height="14" /></button></div><div className="scope-detail-columns"><div><p><b>Bedingung:</b> {activeScope.condition}</p><p><b>Nicht umfasst:</b> {activeScope.exclusions.join("; ") || "Keine weitere Einschränkung im synthetischen Text genannt."}</p>{activeScope.person && <p><b>Benannte Person:</b> <button className="text-button" onClick={() => { setSection("contacts"); setActiveFact(null); }}>{activeScope.person}</button></p>}</div><div><blockquote>{activeScope.quote}</blockquote>{sourceLink(activeScope)}</div></div><p className="scope-disclaimer">Dokumentierter Inhalt · keine automatische rechtliche oder medizinische Freigabe</p></div>}
            {opened ? <section className="embedded-viewer"><div className="viewer-heading"><div><h2>{opened.document.title}</h2><p>{formatDate(opened.document.date)} · {opened.document.kind} · {opened.document.status}</p></div><button className="button secondary" onClick={closeDocument}><Icon name="close" width="14" height="14" />Dokument schließen</button></div><PdfViewer key={selected.id + opened.document.id + opened.page + (opened.section ?? "")} doc={{title:opened.document.title,url:opened.document.url}} initialPage={opened.page} sourceSection={opened.section} sourceQuote={opened.quote} sourceCondition={selected.facts.find(fact => fact.documentId === opened.document.id)?.condition} sourceExclusions={selected.facts.find(fact => fact.documentId === opened.document.id)?.exclusions} /></section> :
              <Tabs.Root value={section} onValueChange={value => setSection(value as Section)} className="clinical-tabs"><Tabs.List className="clinical-tab-list" aria-label="Bereiche der Patientenakte">{sections.map(item => <Tabs.Trigger key={item.id} value={item.id}>{item.label}{item.id === "documents" && <span>{selected.documents.length}</span>}</Tabs.Trigger>)}</Tabs.List>
                <Tabs.Content value="overview"><div className="overview-grid case-overview">
                  <Panel title="Aktuelle Anamnese" className="case-anamnesis"><p className="clinical-text">{selected.notes}</p><dl className="compact-details"><div><dt>Allergien / Unverträglichkeiten</dt><dd>{selected.allergies.join("; ")}</dd></div><div><dt>Blutgruppe</dt><dd>{selected.bloodGroup}</dd></div></dl></Panel>
                  <Panel title="Vorsorge & Vertretungsregelung" className="scope-panel" action={<button className="panel-action" onClick={() => setSection("documents")}>Dokumente</button>}>{renderFacts()}</Panel>
                  <Panel title="Diagnosen" className="case-diagnoses"><table><thead><tr><th>ICD-10</th><th>Bezeichnung</th><th>Art</th></tr></thead><tbody>{selected.diagnoses.map((diagnosis,index) => <tr key={diagnosis.code}><td className="numeric">{diagnosis.code}</td><td>{diagnosis.title}</td><td>{index === 0 ? "Hauptdiagnose" : "Nebendiagnose"}</td></tr>)}</tbody></table></Panel>
                  <Panel title="Aktuelle Vitalwerte" className="case-vitals" action={<button className="panel-action" onClick={() => setSection("vitals")}>Kurve öffnen</button>}><VitalChart patient={selected} /></Panel>
                  <Panel title="Befunde und Dokumente chronologisch" className="full-width">{renderDocuments(true)}</Panel>
                  <Panel title="Aktuelle Medikation"><div className="table-scroll"><table><thead><tr><th>Präparat</th><th>Dosis</th><th>Schema</th><th>Appl.</th></tr></thead><tbody>{selected.medication.map(med => <tr key={med.name}><td>{med.name}</td><td>{med.dose}</td><td className="numeric">{med.schedule}</td><td>{med.route}</td></tr>)}</tbody></table></div><p className="panel-footnote">Synthetischer Medikationsplan · keine Therapieanweisung</p></Panel>
                  <Panel title="Laborbefunde"><table><thead><tr><th>Parameter</th><th>Wert</th><th>Referenz</th></tr></thead><tbody>{selected.labs.map(lab => <tr key={lab.name}><td>{lab.name}</td><td className={lab.flag ? "flagged-result" : ""}>{lab.value} {lab.unit} {lab.flag && <span>{lab.flag}</span>}</td><td>{lab.reference}</td></tr>)}</tbody></table></Panel>
                </div></Tabs.Content>
                <Tabs.Content value="vitals"><Panel title="Kurvenblatt · 05.11.2026" action={<span>Station 2A · Pflege / Vitalparameter</span>}><VitalChart patient={selected} />{renderVitalsTable()}</Panel><div className="overview-grid lower-grid"><Panel title="Pflegedokumentation"><p className="clinical-text">{selected.notes}</p><dl className="compact-details"><div><dt>Beobachtungszeitraum</dt><dd>06:00–16:00 Uhr · 05.11.2026</dd></div><div><dt>Dokumentation</dt><dd>Vollständig synthetische Messreihe</dd></div></dl></Panel><Panel title="Relevante Vorsorgehinweise">{renderFacts()}</Panel></div></Tabs.Content>
                <Tabs.Content value="documents"><div className="document-filter"><label>Dokument suchen <input type="search" value={documentQuery} onChange={event => setDocumentQuery(event.target.value)} placeholder="Titel oder Dokumentart" /></label><span>{selected.documents.length} hinterlegte Dokumente</span></div><Panel title="Vorsorgedokumente und medizinische Willenserklärungen">{renderDocuments()}<p className="panel-footnote">„Dokumentiert“ bezeichnet den Akteneingang. Umfang und Bedingungen ergeben sich aus dem jeweiligen Dokument.</p></Panel><Panel title="Geltungsbereiche und Quellenverzeichnis" className="lower-panel">{renderFacts()}</Panel></Tabs.Content>
                <Tabs.Content value="contacts"><div className="overview-grid"><Panel title="Kontaktperson"><dl className="compact-details"><div><dt>Name</dt><dd>{selected.contact.name}</dd></div><div><dt>Beziehung</dt><dd>{selected.contact.relationship}</dd></div><div><dt>Telefon</dt><dd>{selected.contact.phone}</dd></div><div><dt>Hinweis</dt><dd>Kontaktdaten allein begründen keine Vertretungsbefugnis.</dd></div></dl></Panel><Panel title="Befugnisse der benannten Personen">{renderFacts()}</Panel></div></Tabs.Content>
                <Tabs.Content value="history"><Panel title="Fallbezogener Dokumentationsverlauf"><table><thead><tr><th>Zeit</th><th>Eintrag</th><th>Inhalt / Quelle</th></tr></thead><tbody>{selected.events.map((event,index) => <tr key={index}><td className="numeric">{event.time}</td><td><strong>{event.title}</strong></td><td>{event.text}</td></tr>)}{selected.documents.map(doc => <tr key={doc.id}><td>{formatDate(doc.received)}</td><td>Vorsorgedokument hinterlegt</td><td><a href={`/?patient=${selected.id}&document=${doc.id}&page=1`} className="patient-link" onClick={event => {event.preventDefault();openDocument(doc);}}>{doc.title}</a><small>Externe Vorsorgedokumentation · {doc.status}</small></td></tr>)}</tbody></table></Panel></Tabs.Content>
              </Tabs.Root>}
            <IdleDialog onFinish={closeChart} />
          </>}
        </main>
        <footer className="clinical-statusbar"><span><i className="status-dot" />Lokale Demonstration · synthetische Patienten und Dokumente</span><span>05.11.2026 · Station 2A</span></footer>
      </div>
    </div>
    <ScanToast scan={toast} onShowDocuments={() => { if (toast) openPatient(toast.patient, "documents"); }} onClose={() => setToast(null)} />
  </div>;
}
