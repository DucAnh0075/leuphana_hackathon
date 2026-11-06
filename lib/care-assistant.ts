import "server-only";
import type { CareSnapshot } from "@/lib/care/types";
import { readCareSnapshot } from "@/lib/care/service";
import { CareError } from "@/lib/care/errors";
import { documentTitle } from "@/lib/consumer-language";

export type CareAnswer = {
  answer: string;
  sources: { documentId: string; page: number; quote: string; label: string }[];
  mode: "guided";
  suggestedAction?: "handoff";
};

// Local and deterministic: no model, external request or automatic action.
// Original source text is preserved; English prose describes only the available evidence.
export function guidedCareAnswer(snapshot: CareSnapshot, question: string, documentId?: string): CareAnswer {
  if (documentId && !snapshot.documents.some(doc => doc.id === documentId))
    throw new CareError(403, "DOCUMENT_ACCESS", "Dieses Dokument ist für die Anfrage nicht verfügbar.");
  const input = question.toLocaleLowerCase("de");
  if (input === "receipt" || /angekommen|übergabe|uebergabe|eingang|empfang|welche fassung|status|received|shared|which version/.test(input)) {
    const handoff = [...snapshot.handoffs].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!handoff) return { mode: "guided", answer: "No documents have been shared yet. Review the current versions and the recipient before sending them to " + snapshot.clinic.name + ".", sources: [], suggestedAction: "handoff" };
    const names = handoff.documentIds.map(id => snapshot.documents.find(doc => doc.id === id)).filter(doc => !!doc).map(doc => documentTitle(doc) + " (version " + doc.version + ")").join(", ");
    const state = handoff.status === "accepted" ? "The clinic has confirmed these versions in the record. This does not confirm that a clinician has read or assessed them." :
      handoff.status === "clarification" ? "The clinic needs a reply before it can confirm the record. Open Sharing to read and answer its question." :
      handoff.status === "withdrawn" ? "This handoff was withdrawn. It does not confirm that these documents are in the record." :
      "These documents were received. The clinic has not yet confirmed them in the record.";
    return { mode: "guided", answer: handoff.clinicName + ": " + names + ". " + state, sources: [] };
  }
  if (input === "missing" || /fehlt|fehlen|nächste|nächster|offen|schritt|next|missing/.test(input)) {
    const pending = snapshot.handoffs.find(item => item.status === "clarification" || item.status === "received");
    if (pending) return { mode: "guided", answer: pending.status === "clarification" ?
      "The clinic needs more information. Open Sharing and choose Reply to clinic to read and answer its question." :
      "The clinic still needs to match the received documents to your case and confirm them in the record. You do not need to scan your card again.", sources: [] };
    const outstanding = snapshot.documents.filter(doc => doc.current && !snapshot.recordDocumentIds.includes(doc.id));
    return outstanding.length ? { mode: "guided", answer: "Not yet confirmed in the clinic record: " + outstanding.map(doc => documentTitle(doc) + ", version " + doc.version).join("; ") + ". Review the selected versions and recipient before sharing.", sources: [], suggestedAction: "handoff" } :
      { mode: "guided", answer: "The current stored versions are present in the clinic record. This does not establish legal validity or current medical applicability.", sources: [] };
  }
  if (input === "evidence" || /steht|wo |beleg|vollmacht|vertret|benannt|darf|begleitung|jana|named|who|source|represent/.test(input)) {
    const entries = snapshot.documents.filter(doc => documentId ? doc.id === documentId : doc.current).flatMap(doc => doc.evidence.map(fact => ({ doc, fact })));
    const representation = /vollmacht|vertret|befug|darf|represent/.test(input);
    const entry = representation ? entries.find(item => item.fact.category === "representation") : entries.find(item => item.fact.id === "gespraechsbegleitung") ?? entries[0];
    if (!entry) return { mode: "guided", answer: "No checked source passage is available for this question in the selected version. Open the original document to review it.", sources: [] };
    const { doc, fact } = entry;
    return { mode: "guided",
      answer: "The available source passage is below. Read its condition and exclusions together; being named does not by itself establish unrestricted authority.\n\nOriginal quote (German):\n" + fact.quote + "\n\nCondition (German): " + fact.condition + (fact.exclusions.length ? "\nExclusions (German): " + fact.exclusions.join(" ") : ""),
      sources: [{ documentId: doc.id, page: fact.page, quote: fact.quote, label: documentTitle(doc) + " · Version " + doc.version + " · Page " + fact.page }],
    };
  }
  return { mode: "guided", answer: "Choose one of the three questions to find a source passage, the next step or the sharing status. This help does not make medical or legal decisions.", sources: [] };
}
export async function answerCareQuestion(request: Request, question: string, documentId?: string): Promise<CareAnswer> {
  return guidedCareAnswer(await readCareSnapshot(request), question, documentId);
}