export type CareMode = "demo" | "supabase";
export type CareRole = "owner" | "clinic";
export type CareEvidence = {
  id: string; label: string; value: string; page: number; section: string; quote: string;
  condition: string; exclusions: string[]; person?: string; category: string;
};
export type CareDocument = {
  id: string; sourceId: string; personId: string; title: string; kind: string;
  version: number; date: string; fileUrl: string; pageCount: number; current: boolean;
  evidence: CareEvidence[];
  provenance?: { kind: string; label: string; url: string; version: string; note: string };
};
export type CareHandoff = {
  id: string; personId: string; personName: string; clinicId: string; clinicName: string;
  documentIds: string[]; status: "received" | "clarification" | "accepted" | "withdrawn";
  revision: number; createdAt: string; updatedAt: string; acceptedAt?: string; note?: string;
  source: "app" | "card";
  events: { id: string; at: string; label: string; actor: string }[];
};
export type CareSnapshot = {
  mode: CareMode; actor: { id: string; name: string; role: CareRole };
  person: { id: string; name: string; birth: string; contactName: string };
  clinic: { id: string; name: string };
  documents: CareDocument[]; handoffs: CareHandoff[]; recordDocumentIds: string[];
  card: { id: string; label: string; active: boolean }; updatedAt: string;
};
export type CareAction =
  | { type: "handoff"; documentIds: string[]; recipientId: string; requestId: string }
  | { type: "accept" | "clarify" | "withdraw" | "reply"; handoffId: string; expectedRevision: number; note?: string }
  | { type: "card-status"; active: boolean };
export type CareScanResult = { ok: true; card: string; handoffId: string; duplicate: boolean };
