import "server-only";
import { createSupabaseServerClient } from "./auth/server";
import { readDemoSnapshot } from "./care/demo";
import { CareError } from "./care/errors";
import { emptyProfile, parseProfileData, profileFingerprint, withExpectedProfileScope, type ProfileMutation, type VoraProfileSnapshot } from "./vora-profile";

type DemoProfile = { snapshot: VoraProfileSnapshot; expiresAt: number; requests: Map<string, { fingerprint: string; revision: number }> };
const key = Symbol.for("vora.profile-demo.v1");
const host = globalThis as typeof globalThis & { [key]?: Map<string, DemoProfile> };
const demos = host[key] ??= new Map<string, DemoProfile>();
function demoState(id: string) {
  // The care demo owns the capability and its lifetime. Never accept an arbitrary URL ID.
  readDemoSnapshot(id, "owner");
  for (const [otherId, data] of demos) if (data.expiresAt <= Date.now()) demos.delete(otherId);
  let state = demos.get(id);
  if (!state) { state = { snapshot: { mode: "demo", localScope: `demo-${id}`, revision: 0, data: emptyProfile() }, expiresAt: Date.now() + 24 * 60 * 60 * 1000, requests: new Map() }; demos.set(id, state); }
  return state;
}
function demoId(request: Request) { const url = new URL(request.url); if (url.searchParams.get("role") === "clinic") throw new CareError(403, "OWNER_REQUIRED", "Dieses Profil gehört zur persönlichen Ansicht."); return url.searchParams.has("demo") ? url.searchParams.get("demo")! : undefined; }
async function connection() {
  const client = await createSupabaseServerClient();
  if (!client) throw new CareError(503, "PROFILE_SETUP", "Die Konto-Verbindung ist noch nicht eingerichtet. Erneut versuchen oder die separate Demo öffnen.");
  const { data, error } = await client.auth.getUser();
  if (error && (!error.status || error.status >= 500)) throw new CareError(503, "AUTH_UNAVAILABLE", "Der Anmeldedienst ist gerade nicht erreichbar.");
  if (error || !data.user) throw new CareError(401, "SIGN_IN", "Bitte anmelden, um dein Profil zu öffnen.");
  return { client, localScope: `account-${data.user.id}` };
}
function dbError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  if (error.message === "VORA_STALE_REVISION") throw new CareError(409, "STALE_REVISION", "Dein Profil wurde in einer anderen Sitzung geändert. Deine ungespeicherten Eingaben bleiben hier. Aktuellen Stand laden oder Eingaben sichern.");
  if (error.message === "VORA_REQUEST_CONFLICT") throw new CareError(409, "REQUEST_CONFLICT", "Diese Speicherkennung gehört zu einer anderen Änderung.");
  if (error.code === "42501") throw new CareError(403, "FORBIDDEN", "Für dieses Profil fehlt der Zugriff.");
  throw new CareError(503, "PROFILE_SETUP", "Der Profilspeicher ist noch nicht verfügbar. Die additive VORA-Profilmigration muss eingerichtet sein. Deine Eingaben bleiben in diesem Tab; bitte erneut versuchen.");
}
export async function readVoraProfile(request: Request): Promise<VoraProfileSnapshot> {
  const id = demoId(request);
  if (id !== undefined) return structuredClone(demoState(id).snapshot);
  const { client, localScope } = await connection();
  const { data, error } = await client.rpc("vora_profile_read"); dbError(error);
  if (!data) return { mode: "account", localScope, revision: 0, data: emptyProfile() };
  return { mode: "account", localScope, revision: data.revision, data: parseProfileData(data.payload) };
}
export async function saveVoraProfile(request: Request, mutation: ProfileMutation): Promise<VoraProfileSnapshot> {
  const id = demoId(request);
  if (id !== undefined) {
    readDemoSnapshot(id, "owner");
    return withExpectedProfileScope(mutation.expectedLocalScope, `demo-${id}`, () => {
    const state = demoState(id); const fingerprint = profileFingerprint({ expectedRevision: mutation.expectedRevision, data: mutation.data }); const previous = state.requests.get(mutation.requestId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new CareError(409, "REQUEST_CONFLICT", "Diese Speicherkennung gehört zu einer anderen Änderung.");
      // Return the authoritative current snapshot, never a stale replay over newer data.
      return structuredClone(state.snapshot);
    }
    if (state.snapshot.revision !== mutation.expectedRevision) throw new CareError(409, "STALE_REVISION", "Dieses Demoprofil wurde inzwischen geändert. Die ungespeicherten Eingaben bleiben in diesem Tab.");
    if (state.requests.size >= 1000) throw new CareError(429, "DEMO_CAPACITY", "Bitte eine neue Demo öffnen.");
    state.snapshot = { mode: "demo", localScope: `demo-${id}`, revision: state.snapshot.revision + 1, data: mutation.data };
    state.requests.set(mutation.requestId, { fingerprint, revision: state.snapshot.revision });
    return structuredClone(state.snapshot);
    });
  }
  const { client, localScope } = await connection();
  return withExpectedProfileScope(mutation.expectedLocalScope, localScope, async () => {
  const { data, error } = await client.rpc("vora_profile_save", { p_expected_revision: mutation.expectedRevision, p_request_id: mutation.requestId, p_payload: mutation.data }); dbError(error);
  return { mode: "account", localScope, revision: data.revision, data: parseProfileData(data.payload) };
  });
}
