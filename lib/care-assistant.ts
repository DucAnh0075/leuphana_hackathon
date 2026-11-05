import "server-only";
import type { CareSnapshot } from "@/lib/care/types";
import { readCareSnapshot } from "@/lib/care/service";
import { CareError } from "@/lib/care/errors";

export type CareAnswer = {
  answer: string;
  sources: { documentId: string; page: number; quote: string; label: string }[];
  mode: "guided";
  suggestedAction?: "handoff";
};

// Deliberately local and deterministic: no model, external request or automatic action.
// Every answer is derived from the same access-checked source used by the UI.
export function guidedCareAnswer(snapshot: CareSnapshot, question: string, documentId?: string): CareAnswer {
  if (documentId && !snapshot.documents.some(doc => doc.id === documentId))
    throw new CareError(403, "DOCUMENT_ACCESS", "Dieses Dokument ist für die Anfrage nicht verfügbar.");
  const input = question.toLocaleLowerCase("de");
  if (input === "receipt" || /angekommen|übergabe|uebergabe|eingang|empfang|welche fassung|status/.test(input)) {
    const handoff = snapshot.handoffs[0];
    if (!handoff) return { mode: "guided", answer: "Es gibt noch keine neue Übergabe. Du kannst die aktuellen Dokumentfassungen auswählen und eine Vorschau für " + snapshot.clinic.name + " vorbereiten.", sources: [], suggestedAction: "handoff" };
    const names = handoff.documentIds.map(id => snapshot.documents.find(doc => doc.id === id)).filter(doc => !!doc).map(doc => doc.title + " (Fassung " + doc.version + ")").join(", ");
    const state = handoff.status === "accepted" ? "Die Übernahme in die Akte ist bestätigt. Das bestätigt keine ärztliche Sichtung oder Bewertung." :
      handoff.status === "clarification" ? "Die Zuordnung ist noch offen. Rückfrage: " + (handoff.note ?? "Bitte den Übergabeverlauf öffnen.") :
      handoff.status === "withdrawn" ? "Die Übergabe wurde zurückgezogen. Daraus entsteht keine Aktenbestätigung." :
      "Die Dokumente sind eingegangen. Die Klinik hat die Aktenübernahme noch nicht bestätigt.";
    return { mode: "guided", answer: handoff.clinicName + ": " + names + ". " + state, sources: [] };
  }
  if (input === "missing" || /fehlt|fehlen|nächste|nächster|offen|schritt/.test(input)) {
    const pending = snapshot.handoffs.find(item => item.status === "clarification" || item.status === "received");
    if (pending) return { mode: "guided", answer: pending.status === "clarification" ?
      "Die Klinik benötigt eine Klärung: " + pending.note + " Öffne die Übergabe und beantworte die Rückfrage." :
      "Die Klinik muss die eingegangenen Unterlagen noch dem Fall zuordnen und die Übernahme bestätigen. Ein erneuter Scan ist dafür nicht nötig.", sources: [] };
    const outstanding = snapshot.documents.filter(doc => doc.current && !snapshot.recordDocumentIds.includes(doc.id));
    return outstanding.length ? { mode: "guided", answer: outstanding.map(doc => doc.title + " · Fassung " + doc.version).join(", ") + " ist noch nicht in der Klinikakte bestätigt. Prüfe die Auswahl und den Empfänger in der Übergabevorschau.", sources: [], suggestedAction: "handoff" } :
      { mode: "guided", answer: "Die aktuellen hinterlegten Fassungen sind in der Demoakte vorhanden. Daraus folgt keine Aussage zur rechtlichen Wirksamkeit oder zur aktuellen medizinischen Anwendbarkeit.", sources: [] };
  }
  if (input === "evidence" || /steht|wo |beleg|vollmacht|vertret|benannt|darf|begleitung|jana/.test(input)) {
    const entries = snapshot.documents.filter(doc => documentId ? doc.id === documentId : doc.current)
      .flatMap(doc => doc.evidence.map(fact => ({ doc, fact })));
    const representation = /vollmacht|vertret|befug|darf/.test(input);
    const entry = representation ? entries.find(item => item.fact.category === "representation") :
      entries.find(item => item.fact.id === "gespraechsbegleitung") ?? entries[0];
    if (!entry) return { mode: "guided", answer: "Für diese Frage ist in der ausgewählten Dokumentfassung keine passende geprüfte Belegstelle hinterlegt. Bitte das Original beziehungsweise die betreffende Vollmacht öffnen.", sources: [] };
    const { doc, fact } = entry;
    return { mode: "guided",
      answer: fact.quote + "\n\nBedingung: " + fact.condition + (fact.exclusions.length ? "\nGrenzen: " + fact.exclusions.join(" ") : ""),
      sources: [{ documentId: doc.id, page: fact.page, quote: fact.quote, label: doc.title + " · Fassung " + doc.version + " · Seite " + fact.page }],
    };
  }
  return { mode: "guided", answer: "Die geführte Hilfe zeigt Belegstellen, offene Schritte und den Übergabestand. Wähle „Wo steht das?“, „Was fehlt noch?“ oder „Welche Fassung ist angekommen?“. Medizinische oder rechtliche Entscheidungen trifft sie nicht.", sources: [] };
}
export async function answerCareQuestion(request: Request, question: string, documentId?: string): Promise<CareAnswer> {
  return guidedCareAnswer(await readCareSnapshot(request), question, documentId);
}
