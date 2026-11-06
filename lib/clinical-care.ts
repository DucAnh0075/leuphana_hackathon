import type { CareEvidence, CareSnapshot } from "@/lib/care/types";
import dataset from "@/lib/demo-patients.json";

type BasePatient = (typeof dataset.patients)[number];
export type ClinicalFact = CareEvidence & { documentId: string; target?: string; templatePage?: number; templateSection?: string };
export type ClinicalDocument = Omit<BasePatient["documents"][number], "pages" | "provenance"> & {
  pages: { heading: string; sections: { id: string; title: string; text: string; templatePage?: number; templateSection?: string }[] }[];
  provenance?: { kind: string; label: string; url: string; version: string; note: string };
};
export type ClinicalPatient = Omit<BasePatient, "documents" | "facts" | "carePreferences"> & {
  documents: ClinicalDocument[]; facts: ClinicalFact[]; carePreferences?: ClinicalFact[];
};

export function projectClinicalPatients(snapshot?: CareSnapshot): ClinicalPatient[] {
  if (!snapshot) return dataset.patients;
  return dataset.patients.map(patient => {
    if (patient.id !== snapshot.person.id) return patient;
    const accepted = snapshot.documents.filter(doc => snapshot.recordDocumentIds.includes(doc.id));
    const latest = accepted.filter(doc => !accepted.some(other => other.sourceId === doc.sourceId && other.version > doc.version));
    const originalFactIds = new Set(patient.facts.map(fact => fact.id));
    const originalFacts = [...patient.facts, ...(patient.carePreferences ?? [])];
    const facts: ClinicalFact[] = latest.flatMap(doc => doc.evidence.map(fact => ({
      ...originalFacts.find(original => original.id === fact.id), ...fact, documentId: doc.id, target: fact.label,
    })));
    const documents: ClinicalDocument[] = accepted.flatMap(doc => {
      const original = patient.documents.find(item => item.id === doc.sourceId);
      if (!original) return [];
      const receipt = snapshot.handoffs.find(item => item.status === "accepted" && item.documentIds.includes(doc.id));
      const historical = latest.every(item => item.id !== doc.id);
      return [{
        ...original, id: doc.id, title: doc.title + " · Fassung " + doc.version, date: doc.date,
        received: receipt?.acceptedAt ? new Date(receipt.acceptedAt).toLocaleString("de-DE") : original.received,
        status: historical ? "Frühere Fassung" : "Dokumentiert", url: doc.fileUrl,
        pages: Array.from({ length: doc.pageCount }, (_, index) => original.pages[index] ?? {
          heading: "Ergänzung", sections: doc.evidence.filter(fact => fact.page === index + 1).map(fact => ({ id: fact.id, title: fact.section, text: fact.quote })),
        }),
        provenance: doc.provenance ?? original.provenance,
      }];
    });
    return { ...patient, documents, facts: facts.filter(fact => originalFactIds.has(fact.id)), carePreferences: facts.filter(fact => !originalFactIds.has(fact.id)) };
  });
}
