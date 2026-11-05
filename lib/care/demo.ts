import "server-only";
import { randomUUID } from "node:crypto";
import { createDemoDocuments, demoClinic, demoPerson } from "./fixtures";
import { CareError, requireCard, requireRequestId, uuidPattern } from "./errors";
import type { CareAction, CareDocument, CareHandoff, CareRole, CareScanResult, CareSnapshot } from "./types";

type DemoState = {
  id: string; expiresAt: number; documents: CareDocument[]; handoffs: CareHandoff[];
  recordDocumentIds: string[]; cardActive: boolean; updatedAt: string;
  requests: Map<string, { fingerprint: string; handoffId: string }>;
};
const key = Symbol.for("vorsorge.synthetic-care-sessions.v1");
const globalState = globalThis as typeof globalThis & { [key]?: Map<string, DemoState> };
const sessions = globalState[key] ??= new Map<string, DemoState>();
const TTL = 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 100;
const MAX_HANDOFFS = 100;
const MAX_REQUESTS = 500;
function cleanup(): void { for (const [id, state] of sessions) if (state.expiresAt <= Date.now()) sessions.delete(id); }

export function createDemoSession(): string {
  cleanup();
  if (sessions.size >= MAX_SESSIONS) throw new CareError(429, "DEMO_CAPACITY", "Die Demo ist ausgelastet. Bitte später erneut starten.");
  const id = randomUUID();
  const documents = createDemoDocuments();
  sessions.set(id, { id, expiresAt: Date.now() + TTL, documents, handoffs: [], recordDocumentIds: documents.filter(doc => doc.version === 1).map(doc => doc.id), cardActive: true, updatedAt: new Date().toISOString(), requests: new Map() });
  return id;
}
function stateFor(id: string): DemoState {
  if (!uuidPattern.test(id)) throw new CareError(400, "DEMO_ID", "Die Demokennung ist ungültig.");
  const state = sessions.get(id);
  if (!state || state.expiresAt <= Date.now()) {
    sessions.delete(id);
    throw new CareError(410, "DEMO_EXPIRED", "Diese synthetische Sitzung ist abgelaufen oder der Server wurde neu gestartet. Bitte eine neue Demo öffnen.");
  }
  return state;
}
export function demoContext(request: Request): { id: string; role: CareRole } | null {
  const params = new URL(request.url).searchParams;
  if (!params.has("demo")) return null;
  const role = params.get("role") ?? "owner";
  if (role !== "owner" && role !== "clinic") throw new CareError(400, "DEMO_ROLE", "Unbekannte Demoperspektive.");
  return { id: params.get("demo") ?? "", role };
}
function snapshot(state: DemoState, role: CareRole): CareSnapshot {
  const visible = new Set(state.recordDocumentIds);
  for (const handoff of state.handoffs) if (handoff.status !== "withdrawn") for (const id of handoff.documentIds) visible.add(id);
  return structuredClone({
    mode: "demo", actor: { id: "synthetic-" + role, name: role === "owner" ? demoPerson.name : "Dr. Mara Weber", role },
    person: demoPerson, clinic: demoClinic,
    documents: role === "owner" ? state.documents : state.documents.filter(doc => visible.has(doc.id)),
    handoffs: state.handoffs, recordDocumentIds: state.recordDocumentIds,
    card: { id: "demo-erika", label: "Erika Berger · Vorsorgekarte", active: state.cardActive },
    updatedAt: state.updatedAt,
  });
}
export function readDemoSnapshot(id: string, role: CareRole): CareSnapshot { return snapshot(stateFor(id), role); }

function submit(state: DemoState, role: CareRole, documentIds: string[], recipientId: string, requestId: string, source: "app" | "card"): { handoff: CareHandoff; duplicate: boolean } {
  requireRequestId(requestId);
  if (recipientId !== demoClinic.id) throw new CareError(400, "RECIPIENT", "Diese Einrichtung ist in der Demo nicht angeschlossen.");
  const ids = [...new Set(documentIds)].sort();
  if (!ids.length || ids.length > 10 || ids.some(id => !state.documents.some(doc => doc.id === id))) throw new CareError(400, "DOCUMENTS", "Bitte bekannte Dokumentfassungen auswählen.");
  const fingerprint = JSON.stringify({ ids, recipientId, source, role });
  const requestKey = role + ":" + requestId;
  const previous = state.requests.get(requestKey);
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new CareError(409, "REQUEST_CONFLICT", "Diese Vorgangskennung wurde bereits für eine andere Auswahl verwendet.");
    return { handoff: state.handoffs.find(item => item.id === previous.handoffId)!, duplicate: true };
  }
  if (state.requests.size >= MAX_REQUESTS) throw new CareError(429, "DEMO_CAPACITY", "Bitte eine neue Demositzung starten.");
  const existing = state.handoffs.find(item => item.status !== "withdrawn" && item.clinicId === recipientId && JSON.stringify([...item.documentIds].sort()) === JSON.stringify(ids));
  if (existing) {
    state.requests.set(requestKey, { fingerprint, handoffId: existing.id });
    return { handoff: existing, duplicate: true };
  }
  if (state.handoffs.length >= MAX_HANDOFFS) throw new CareError(429, "DEMO_CAPACITY", "Bitte eine neue Demositzung starten.");
  const now = new Date().toISOString();
  const handoff: CareHandoff = {
    id: randomUUID(), personId: demoPerson.id, personName: demoPerson.name,
    clinicId: demoClinic.id, clinicName: demoClinic.name, documentIds: ids,
    status: "received", revision: 1, createdAt: now, updatedAt: now, source,
    events: [{ id: randomUUID(), at: now, label: source === "card" ? "Kartenscan: freigegebenes Paket eingegangen" : "Dokumentpaket freigegeben und eingegangen", actor: role === "owner" ? demoPerson.name : "Dr. Mara Weber" }],
  };
  state.handoffs.unshift(handoff);
  state.requests.set(requestKey, { fingerprint, handoffId: handoff.id });
  state.updatedAt = now;
  return { handoff, duplicate: false };
}
export function scanDemo(id: string, role: CareRole, card: string, requestId: string): CareScanResult {
  const state = stateFor(id);
  requireCard(card); requireRequestId(requestId);
  if (card !== "demo-erika" && card !== "demo") throw new CareError(404, "CARD_UNKNOWN", "Diese Karte ist keinem freigegebenen Demopaket zugeordnet.");
  if (!state.cardActive) throw new CareError(403, "CARD_REVOKED", "Diese Karte ist gesperrt.");
  // The synthetic card grant is preconfigured for this person, recipient and exact current versions.
  const result = submit(state, role, state.documents.filter(doc => doc.current).map(doc => doc.id), demoClinic.id, requestId, "card");
  return { ok: true, card, handoffId: result.handoff.id, duplicate: result.duplicate };
}
export function mutateDemo(id: string, role: CareRole, action: CareAction): CareSnapshot {
  const state = stateFor(id);
  if (action.type === "handoff") {
    if (role !== "owner") throw new CareError(403, "ROLE", "Nur die persönliche Ansicht kann eine neue Auswahl freigeben.");
    submit(state, role, action.documentIds, action.recipientId, action.requestId, "app");
  } else if (action.type === "card-status") {
    if (role !== "owner") throw new CareError(403, "ROLE", "Nur die persönliche Ansicht kann den Kartenstatus ändern.");
    state.cardActive = action.active;
    state.updatedAt = new Date().toISOString();
  } else {
    const handoff = state.handoffs.find(item => item.id === action.handoffId);
    if (!handoff) throw new CareError(404, "HANDOFF_UNKNOWN", "Dieser Übergabevorgang wurde nicht gefunden.");
    if (((action.type === "withdraw" || action.type === "reply") && role !== "owner") || ((action.type === "accept" || action.type === "clarify") && role !== "clinic")) throw new CareError(403, "ROLE", "Diese Aktion ist für die gewählte Perspektive nicht verfügbar.");
    if (action.expectedRevision !== handoff.revision) throw new CareError(409, "STALE_REVISION", "Der Vorgang wurde inzwischen geändert. Bitte den aktuellen Stand prüfen.");
    if (handoff.status === "accepted" || handoff.status === "withdrawn") throw new CareError(409, "TERMINAL", "Der Vorgang ist bereits abgeschlossen. Frühere Aktenübernahmen bleiben erhalten.");
    if (action.type === "reply" && handoff.status !== "clarification") throw new CareError(409, "TRANSITION", "Dieser Vorgang enthält keine offene Rückfrage.");
    if (handoff.events.length >= 100) throw new CareError(429, "EVENT_LIMIT", "Für diesen Vorgang sind zu viele Änderungen eingegangen.");
    const note = action.note?.trim();
    if (action.type === "reply" && !note) throw new CareError(400, "NOTE", "Bitte eine Antwort eingeben.");
    if (action.type === "clarify" && (!note || note.length < 5)) throw new CareError(400, "NOTE", "Bitte die erforderliche Klärung konkret benennen.");
    const now = new Date().toISOString();
    handoff.status = action.type === "accept" ? "accepted" : action.type === "clarify" ? "clarification" : action.type === "reply" ? "received" : "withdrawn";
    handoff.revision++; handoff.updatedAt = now; handoff.note = note;
    if (action.type === "accept") {
      handoff.acceptedAt = now;
      state.recordDocumentIds = [...new Set([...state.recordDocumentIds, ...handoff.documentIds])];
    }
    handoff.events.push({ id: randomUUID(), at: now, label: action.type === "accept" ? "Dem Fall zugeordnet und in der Akte bestätigt" : action.type === "clarify" ? "Klärung erforderlich: " + note : action.type === "reply" ? "Rückfrage beantwortet: " + note : "Vor Aktenübernahme zurückgezogen", actor: role === "clinic" ? "Dr. Mara Weber" : demoPerson.name });
    state.updatedAt = now;
  }
  return snapshot(state, role);
}
