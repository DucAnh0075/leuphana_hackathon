import { DOCUMENTS, PREVENTION, emptyWorkspace, parseWorkspace, progress, type WorkspaceState, type DocumentId } from "./vora";
import type { VoraLocale } from "./vora-language";

export type DiscoveryGoal = "representation" | "treatment" | "guardian";
export type VoraCase = {
  id: string; title: string; subject: "self" | "someone"; goals: DiscoveryGoal[]; discoveryVersion: 1;
  documentLanguage: VoraLocale; selected: DocumentId[]; answers: WorkspaceState["answers"];
  completion: WorkspaceState["completion"]; revision: number; createdAt: string; updatedAt: string;
};
export type VoraAppointment = {
  id: string; kind: "doctor" | "notary"; caseId?: string; purpose: string; providerLabel: string;
  location: string; startsAt: string; endsAt: string; createdAt: string; status: "confirmed" | "cancelled"; mode: "demo";
};
export type PreventionTask = { offerId: string; status: "open" | "done"; createdAt: string };
export type VoraProfileData = {
  version: 1; locale: VoraLocale; profile: WorkspaceState["profile"];
  cases: VoraCase[]; appointments: VoraAppointment[]; tasks: PreventionTask[];
};
export type VoraProfileSnapshot = { mode: "account" | "demo"; localScope: string; revision: number; data: VoraProfileData };
export type ProfileMutation = { requestId: string; expectedRevision: number; expectedLocalScope: string; data: VoraProfileData };
export const PROFILE_LIMIT = 900_000;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isProfileScope(value: unknown): value is string { return typeof value === "string" && /^(account|demo)-/.test(value) && uuidPattern.test(value.replace(/^(account|demo)-/, "")); }
export class ProfileAccountChangedError extends Error {
  readonly code = "ACCOUNT_CHANGED";
  readonly status = 409;
  constructor() { super("Die angemeldete Sitzung hat gewechselt. Diese Eingaben wurden nicht in das andere Konto übertragen. Öffne das aktuelle Konto ausdrücklich neu oder melde dich wieder im ursprünglichen Konto an."); }
}
/** A concurrency guard only: the authenticated server context remains the sole authority. */
export function withExpectedProfileScope<T>(expected: string, authenticated: string, write: () => T): T {
  if (!isProfileScope(expected) || !isProfileScope(authenticated) || expected !== authenticated) throw new ProfileAccountChangedError();
  return write();
}
export function emptyProfile(): VoraProfileData { return { version: 1, locale: "de", profile: emptyWorkspace().profile, cases: [], appointments: [], tasks: [] }; }
/** PostgreSQL jsonb reorders object keys; equality must not depend on transport ordering. */
export function profileFingerprint(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(profileFingerprint).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${profileFingerprint(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function keys(value: Record<string, unknown>, required: string[], optional: string[] = []) { return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key)); }
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const timestamp = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const locale = (value: unknown): value is VoraLocale => value === "de" || value === "en";
const integer = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Reject the whole payload on corruption. Notes on deselected documents are deliberately retained. */
export function parseProfileData(value: unknown): VoraProfileData {
  if (!record(value) || JSON.stringify(value).length > PROFILE_LIMIT || !keys(value, ["version", "locale", "profile", "cases", "appointments", "tasks"]) || value.version !== 1 || !locale(value.locale) || !Array.isArray(value.cases) || value.cases.length > 30 || !Array.isArray(value.appointments) || value.appointments.length > 200 || !Array.isArray(value.tasks) || value.tasks.length > PREVENTION.length) throw new Error("Invalid profile");
  parseWorkspace(JSON.stringify({ ...emptyWorkspace(), profile: value.profile }));
  const caseIds = new Set<string>();
  for (const item of value.cases) {
    if (!record(item) || !keys(item, ["id", "title", "subject", "goals", "discoveryVersion", "documentLanguage", "selected", "answers", "completion", "revision", "createdAt", "updatedAt"]) || typeof item.id !== "string" || !uuidPattern.test(item.id) || caseIds.has(item.id) || !text(item.title, 100) || !item.title.trim() || !["self", "someone"].includes(String(item.subject)) || item.discoveryVersion !== 1 || !Array.isArray(item.goals) || item.goals.length > 3 || new Set(item.goals).size !== item.goals.length || item.goals.some(goal => !["representation", "treatment", "guardian"].includes(goal)) || !locale(item.documentLanguage) || !integer(item.revision) || !timestamp(item.createdAt) || !timestamp(item.updatedAt)) throw new Error("Invalid case");
    parseWorkspace(JSON.stringify({ ...emptyWorkspace(), planningFor: item.subject, selected: item.selected, answers: item.answers, completion: item.completion }));
    caseIds.add(item.id);
  }
  const appointmentIds = new Set<string>();
  for (const item of value.appointments) {
    if (!record(item) || !keys(item, ["id", "kind", "purpose", "providerLabel", "location", "startsAt", "endsAt", "createdAt", "status", "mode"], ["caseId"]) || !text(item.id, 100) || !/^[a-zA-Z0-9_-]+$/.test(item.id) || appointmentIds.has(item.id) || !["doctor", "notary"].includes(String(item.kind)) || item.mode !== "demo" || !["confirmed", "cancelled"].includes(String(item.status)) || !text(item.purpose, 200) || !item.purpose.trim() || !text(item.providerLabel, 160) || !item.providerLabel.trim() || !text(item.location, 200) || !timestamp(item.startsAt) || !timestamp(item.endsAt) || Date.parse(item.endsAt) <= Date.parse(item.startsAt) || !timestamp(item.createdAt) || (item.caseId !== undefined && (typeof item.caseId !== "string" || !caseIds.has(item.caseId)))) throw new Error("Invalid appointment");
    appointmentIds.add(item.id);
  }
  const offerIds = new Set<string>();
  for (const item of value.tasks) {
    if (!record(item) || !keys(item, ["offerId", "status", "createdAt"]) || typeof item.offerId !== "string" || !PREVENTION.some(offer => offer.id === item.offerId) || offerIds.has(item.offerId) || !["open", "done"].includes(String(item.status)) || !timestamp(item.createdAt)) throw new Error("Invalid prevention task");
    offerIds.add(item.offerId);
  }
  return structuredClone(value) as VoraProfileData;
}
export function parseProfileMutation(value: unknown): ProfileMutation {
  if (!record(value) || !keys(value, ["requestId", "expectedRevision", "expectedLocalScope", "data"]) || typeof value.requestId !== "string" || !uuidPattern.test(value.requestId) || !integer(value.expectedRevision) || !isProfileScope(value.expectedLocalScope)) throw new Error("Invalid profile mutation");
  return { requestId: value.requestId, expectedRevision: value.expectedRevision, expectedLocalScope: value.expectedLocalScope, data: parseProfileData(value.data) };
}
export function caseWorkspace(item: VoraCase, profile: VoraProfileData["profile"]): WorkspaceState { return { ...emptyWorkspace(), planningFor: item.subject, selected: item.selected, answers: item.answers, completion: item.completion, profile }; }
export function suggestedDocuments(goals: DiscoveryGoal[]): DocumentId[] { return ([ ["representation", "power"], ["treatment", "directive"], ["guardian", "guardian"] ] as const).filter(([goal]) => goals.includes(goal)).map(([, doc]) => doc); }
export function caseTodos(item: VoraCase) {
  const state = caseWorkspace(item, emptyWorkspace().profile);
  return DOCUMENTS.filter(doc => item.selected.includes(doc.id)).flatMap<{ documentId: DocumentId; phase: number; openBlocks: number; type: "blocks" | "formalities" }>(doc => {
    const open = doc.modules.length - progress(doc, state);
    if (open) return [{ documentId: doc.id, phase: 1, openBlocks: open, type: "blocks" as const }];
    if ((item.completion[doc.id] || []).length < 4) return [{ documentId: doc.id, phase: 3, openBlocks: 0, type: "formalities" as const }];
    return [];
  });
}
