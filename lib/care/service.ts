import "server-only";
import { createSupabaseServerClient } from "@/lib/auth/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CareError, requireCard, requireRequestId, uuidPattern } from "./errors";
import { demoContext, mutateDemo, readDemoSnapshot, scanDemo } from "./demo";
import type { CareAction, CareDocument, CareEvidence, CareHandoff, CareRole, CareScanResult, CareSnapshot } from "./types";

type Membership = { user_id: string; display_name: string; role: CareRole; person_id: string; clinic_id: string };
type DbError = { code?: string; message?: string } | null;
function failDatabase(error: DbError): void {
  if (!error) return;
  const map: Record<string, [number, string]> = {
    CARE_FORBIDDEN: [403, "Für diesen Vorgang fehlt der Zugriff."],
    CARE_CARD_UNKNOWN: [404, "Diese Karte ist keinem für Sie freigegebenen Paket zugeordnet."],
    CARE_CARD_REVOKED: [403, "Diese Karte ist gesperrt."],
    CARE_DOCUMENTS: [400, "Die Dokumentauswahl ist ungültig oder nicht freigegeben."],
    CARE_RECIPIENT: [400, "Diese Einrichtung ist nicht für den Vorgang freigegeben."],
    CARE_REQUEST_CONFLICT: [409, "Die Vorgangskennung gehört bereits zu einer anderen Auswahl."],
    CARE_HANDOFF_UNKNOWN: [404, "Dieser Übergabevorgang wurde nicht gefunden."],
    CARE_STALE_REVISION: [409, "Der Vorgang wurde inzwischen geändert. Bitte den aktuellen Stand prüfen."],
    CARE_TERMINAL: [409, "Dieser Vorgang ist bereits abgeschlossen."],
    CARE_NOTE: [400, "Bitte die erforderliche Klärung konkret benennen."],
    CARE_INVALID: [400, "Die Anfrage ist ungültig."],
    CARE_EVENT_LIMIT: [429, "Für diesen Vorgang sind zu viele Änderungen eingegangen."],
  };
  const known = error.message && map[error.message];
  if (known) throw new CareError(known[0], error.message!.replace("CARE_", ""), known[1]);
  if (error.code === "42501") throw new CareError(403, "ACCESS", "Für diesen Vorgang fehlt der Zugriff.");
  console.error("care_database_unavailable", error.code ?? "unknown");
  throw new CareError(503, "CARE_SETUP", "Der Vorsorge-Dienst ist gerade nicht verfügbar. Bitte später erneut versuchen.");
}
async function connection(): Promise<{ client: SupabaseClient; membership: Membership }> {
  const client = await createSupabaseServerClient();
  if (!client) throw new CareError(503, "AUTH_SETUP", "Supabase ist noch nicht eingerichtet. Die gekennzeichnete synthetische Demo ist separat verfügbar.");
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError && (userError.status === undefined || userError.status === 0 || userError.status >= 500)) throw new CareError(503, "AUTH_UNAVAILABLE", "Der Anmeldedienst ist gerade nicht erreichbar. Bitte erneut versuchen.");
  if (userError || !userData.user) throw new CareError(401, "SIGN_IN", "Bitte zuerst anmelden.");
  const { data, error } = await client.from("care_memberships").select("user_id,display_name,role,person_id,clinic_id").eq("user_id", userData.user.id).maybeSingle();
  failDatabase(error);
  if (!data || (data.role !== "owner" && data.role !== "clinic")) throw new CareError(403, "MEMBERSHIP", "Für dieses Konto ist noch kein Vorsorgezugang eingerichtet.");
  return { client, membership: data as Membership };
}
type DocumentRow = {
  id: string; source_id: string; person_id: string; title: string; kind: string; version: number;
  document_date: string; storage_path: string; page_count: number; is_current: boolean;
  evidence: CareEvidence[]; provenance: CareDocument["provenance"];
};
type HandoffRow = {
  id: string; person_id: string; clinic_id: string; document_ids: string[]; status: CareHandoff["status"];
  revision: number; created_at: string; updated_at: string; accepted_at: string | null; note: string | null;
  source: CareHandoff["source"]; events: CareHandoff["events"];
};
export async function readCareSnapshot(request: Request): Promise<CareSnapshot> {
  const demo = demoContext(request);
  if (demo) return readDemoSnapshot(demo.id, demo.role);
  const { client } = await connection();
  const { data, error } = await client.rpc("care_read_workspace");
  failDatabase(error);
  if (!data?.membership) throw new CareError(403, "MEMBERSHIP", "Der Zugriff auf diesen Vorsorgebestand ist nicht mehr verfügbar.");
  const raw = data as {
    membership: Membership;
    person: { id: string; name: string; birth: string; contact_name: string } | null;
    clinic: { id: string; name: string } | null;
    card: { id: string; label: string; active: boolean; updated_at: string } | null;
    documents: DocumentRow[]; handoffs: HandoffRow[];
    records: { document_id: string; accepted_at: string }[];
  };
  const { membership, person, clinic, card } = raw;
  if (!person || !clinic || !card) throw new CareError(503, "CARE_SETUP", "Der persönliche Vorsorgezugang ist noch nicht vollständig eingerichtet.");
  const documents = raw.documents.map(row => ({
    id: row.id, sourceId: row.source_id, personId: row.person_id, title: row.title, kind: row.kind,
    version: row.version, date: row.document_date, fileUrl: "/api/care/documents/" + encodeURIComponent(row.id),
    pageCount: row.page_count, current: row.is_current, evidence: row.evidence, provenance: row.provenance ?? undefined,
  }));
  const handoffs = raw.handoffs.map(row => ({
    id: row.id, personId: row.person_id, personName: person.name, clinicId: row.clinic_id, clinicName: clinic.name,
    documentIds: row.document_ids, status: row.status, revision: row.revision, createdAt: row.created_at,
    updatedAt: row.updated_at, acceptedAt: row.accepted_at ?? undefined, note: row.note ?? undefined,
    source: row.source, events: row.events,
  }));
  const latestChange = Math.max(...[card.updated_at, ...handoffs.map(item => item.updatedAt), ...raw.records.map(item => item.accepted_at)].map(value => new Date(value).getTime()));
  return {
    mode: "supabase", actor: { id: membership.user_id, name: membership.display_name, role: membership.role },
    person: { id: person.id, name: person.name, birth: person.birth, contactName: person.contact_name }, clinic,
    documents, handoffs, recordDocumentIds: raw.records.map(item => item.document_id),
    card: { id: card.id, label: card.label, active: card.active }, updatedAt: new Date(latestChange).toISOString(),
  };
}
export function parseCareAction(body: Record<string, unknown>): CareAction {
  if (body.type === "handoff") {
    if (!Array.isArray(body.documentIds) || !body.documentIds.length || body.documentIds.length > 10 ||
        body.documentIds.some(id => typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) ||
        typeof body.recipientId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(body.recipientId))
      throw new CareError(400, "SELECTION", "Bitte gültige Dokumente und einen Empfänger auswählen.");
    return { type: "handoff", documentIds: body.documentIds as string[], recipientId: body.recipientId, requestId: requireRequestId(body.requestId) };
  }
  if (body.type === "card-status") {
    if (typeof body.active !== "boolean") throw new CareError(400, "CARD_STATUS", "Der Kartenstatus ist ungültig.");
    return { type: "card-status", active: body.active };
  }
  if (body.type === "accept" || body.type === "clarify" || body.type === "withdraw" || body.type === "reply") {
    if (typeof body.handoffId !== "string" || !uuidPattern.test(body.handoffId) ||
        typeof body.expectedRevision !== "number" || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 1 ||
        (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 1000)))
      throw new CareError(400, "TRANSITION", "Vorgang oder Bearbeitungsstand ist ungültig.");
    return { type: body.type, handoffId: body.handoffId, expectedRevision: body.expectedRevision, note: body.note as string | undefined };
  }
  throw new CareError(400, "ACTION", "Diese Aktion ist nicht verfügbar.");
}
export async function performCareAction(request: Request, body: Record<string, unknown>): Promise<CareSnapshot> {
  const action = parseCareAction(body);
  const demo = demoContext(request);
  if (demo) return mutateDemo(demo.id, demo.role, action);
  const { client } = await connection();
  if (action.type === "handoff") {
    const { error } = await client.rpc("care_submit_handoff", { p_document_ids: action.documentIds, p_recipient_id: action.recipientId, p_request_id: action.requestId, p_card_id: null });
    failDatabase(error);
  } else if (action.type === "card-status") {
    const { error } = await client.rpc("care_set_card_status", { p_active: action.active });
    failDatabase(error);
  } else {
    const { error } = await client.rpc("care_transition_handoff", { p_handoff_id: action.handoffId, p_expected_revision: action.expectedRevision, p_action: action.type, p_note: action.note ?? null });
    failDatabase(error);
  }
  return readCareSnapshot(request);
}
export async function performCareScan(request: Request, body: Record<string, unknown>): Promise<CareScanResult> {
  const card = requireCard(body.card);
  const requestId = requireRequestId(body.requestId);
  const demo = demoContext(request);
  if (demo) return scanDemo(demo.id, demo.role, card, requestId);
  const { client } = await connection();
  const { data, error } = await client.rpc("care_submit_handoff", { p_document_ids: [], p_recipient_id: null, p_request_id: requestId, p_card_id: card });
  failDatabase(error);
  if (!data || typeof data.handoffId !== "string") throw new CareError(503, "SCAN_RESULT", "Der Scan wurde nicht eindeutig bestätigt.");
  return { ok: true, card, handoffId: data.handoffId, duplicate: Boolean(data.duplicate) };
}
export async function readCareDocument(documentId: string): Promise<Response> {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(documentId)) throw new CareError(404, "DOCUMENT_UNKNOWN", "Dokument nicht gefunden.");
  const { client } = await connection();
  const { data, error } = await client.from("care_documents").select("storage_path,title").eq("id", documentId).maybeSingle();
  failDatabase(error);
  if (!data) throw new CareError(404, "DOCUMENT_UNKNOWN", "Dieses Dokument ist für das Konto nicht verfügbar.");
  const { data: file, error: downloadError } = await client.storage.from("care-documents").download(data.storage_path);
  if (downloadError || !file) throw new CareError(404, "DOCUMENT_UNAVAILABLE", "Die Datei ist nicht verfügbar oder der Zugriff wurde entzogen.");
  return new Response(file, { headers: {
    "Content-Type": "application/pdf", "Cache-Control": "private, no-store",
    "Content-Disposition": 'inline; filename="' + documentId + '.pdf"',
    "X-Content-Type-Options": "nosniff",
  } });
}
