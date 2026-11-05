import fixture from "@/lib/demo-patients.json";
import revision from "@/lib/demo-care-revision.json";
import type { CareDocument, CareEvidence } from "./types";

const patient = fixture.patients.find(item => item.id === "26004182")!;
export const demoPerson = { id: patient.id, name: patient.first + " " + patient.name, birth: patient.birth, contactName: patient.contact.name };
export const demoClinic = { id: "klinikum-nord", name: "Klinikum Nord" };
export function createDemoDocuments(): CareDocument[] {
  const facts = [...patient.facts, ...(patient.carePreferences ?? [])];
  const documents: CareDocument[] = patient.documents.map(document => ({
    id: document.id + "-v1", sourceId: document.id, personId: patient.id,
    title: document.title, kind: document.kind, version: 1, date: document.date,
    fileUrl: document.url, pageCount: document.pages.length, current: document.id !== revision.sourceId,
    evidence: facts.filter(fact => fact.documentId === document.id).map(fact => ({
      id: fact.id, label: fact.label, value: fact.value, page: fact.page, section: fact.section,
      quote: fact.quote, condition: fact.condition, exclusions: [...fact.exclusions],
      person: fact.person || undefined, category: fact.category,
    } satisfies CareEvidence)),
    provenance: document.provenance,
  }));
  const original = documents.find(document => document.sourceId === revision.sourceId)!;
  documents.push({
    ...original, id: revision.sourceId + "-v2", version: revision.version, date: revision.date,
    fileUrl: revision.fileUrl, pageCount: revision.pageCount, current: true,
    evidence: [...original.evidence, { ...revision.evidence }],
    provenance: original.provenance ? { ...original.provenance, note: original.provenance.note + " Fassung 2 ergänzt eine synthetische Gesprächsbegleitung; keine zusätzliche Vertretungsbefugnis." } : undefined,
  });
  return documents;
}
