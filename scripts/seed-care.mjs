// Explicit, resumable provisioning of synthetic fixtures; never invoked by the application.
// Dry run: node scripts/seed-care.mjs
// Apply after schema.sql and two manually provisioned Auth users:
// node --env-file=.env.local scripts/seed-care.mjs --apply
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const fixture = JSON.parse(await fs.readFile(path.join(root, "lib/demo-patients.json"), "utf8"));
const revision = JSON.parse(await fs.readFile(path.join(root, "lib/demo-care-revision.json"), "utf8"));
const patient = fixture.patients.find(item => item.id === revision.personId);
if (!patient) throw new Error("Synthetic person missing.");
const person = { id: patient.id, name: patient.first + " " + patient.name, birth: patient.birth, contact_name: patient.contact.name };
const clinic = { id: "klinikum-nord", name: "Klinikum Nord" };
const facts = [...patient.facts, ...(patient.carePreferences ?? [])];
const documents = patient.documents.map(doc => ({
  id: doc.id + "-v1", source_id: doc.id, person_id: patient.id, title: doc.title, kind: doc.kind, version: 1,
  document_date: doc.date, storage_path: patient.id + "/" + doc.id + "-v1.pdf",
  page_count: doc.pages.length, is_current: doc.id !== revision.sourceId,
  evidence: facts.filter(fact => fact.documentId === doc.id).map(fact => ({
    id: fact.id, label: fact.label, value: fact.value, page: fact.page, section: fact.section, quote: fact.quote,
    condition: fact.condition, exclusions: fact.exclusions, ...(fact.person ? { person: fact.person } : {}), category: fact.category,
  })),
  provenance: doc.provenance, fileUrl: doc.url,
}));
const previous = documents.find(doc => doc.source_id === revision.sourceId);
if (!previous) throw new Error("Revision source missing.");
documents.push({
  ...previous, id: revision.sourceId + "-v2", version: revision.version, document_date: revision.date,
  storage_path: patient.id + "/" + revision.sourceId + "-v2.pdf", page_count: revision.pageCount,
  is_current: true, fileUrl: revision.fileUrl, evidence: [...previous.evidence, revision.evidence],
  provenance: { ...previous.provenance, note: previous.provenance.note + " Fassung 2 ergänzt eine synthetische Gesprächsbegleitung; keine zusätzliche Vertretungsbefugnis." },
});
const files = new Map();
for (const doc of documents) {
  const localPath = path.resolve(root, "public", "." + doc.fileUrl);
  const publicRoot = path.resolve(root, "public") + path.sep;
  if (!localPath.startsWith(publicRoot)) throw new Error("Fixture path escapes public directory.");
  const bytes = await fs.readFile(localPath);
  if (bytes.subarray(0,5).toString() !== "%PDF-") throw new Error("Fixture is not a PDF: " + doc.id);
  files.set(doc.id, bytes);
}
if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify({ mode: "dry-run", synthetic: true, people: 1, clinics: 1, memberships: 2, documents: documents.length, baselineRecordDocuments: documents.filter(doc => doc.version === 1).length, cardGrantDocuments: documents.filter(doc => doc.is_current).length, writes: 0 }, null, 2));
  process.exit(0);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerUser = process.env.CARE_OWNER_USER_ID;
const clinicUser = process.env.CARE_CLINIC_USER_ID;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!url || !key || !uuid.test(ownerUser ?? "") || !uuid.test(clinicUser ?? "") || ownerUser === clinicUser) throw new Error("Set project URL, server-only service key and two distinct CARE_OWNER_USER_ID / CARE_CLINIC_USER_ID values. No account is created by this script.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const memberships = [
  { user_id: ownerUser, display_name: person.name, role: "owner", person_id: person.id, clinic_id: clinic.id },
  { user_id: clinicUser, display_name: "Dr. Mara Weber", role: "clinic", person_id: person.id, clinic_id: clinic.id },
];
function checked(result, stage) { if (result.error) throw new Error("Seed failed at " + stage + " (" + (result.error.code ?? result.error.statusCode ?? "request") + "). No credentials or response payload logged."); return result.data; }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const equal = (a,b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
function metadataOf(document) { const metadata = { ...document }; delete metadata.fileUrl; return metadata; }
const existing = {};
// Preflight identity, immutable metadata and memberships before the first write.
for (const [table, rows, idKey] of [
  ["care_people", [person], "id"], ["care_clinics", [clinic], "id"],
  ["care_memberships", memberships, "user_id"],
  ["care_documents", documents.map(metadataOf), "id"],
]) {
  existing[table] = checked(await client.from(table).select("*").in(idKey, rows.map(row => row[idKey])), table + " preflight");
  for (const row of rows) {
    const found = existing[table].find(item => item[idKey] === row[idKey]);
    if (found && !Object.keys(row).every(key => equal(found[key], row[key]))) throw new Error("Existing " + table + " differs from this synthetic fixture; refusing to overwrite.");
  }
}
for (const userId of [ownerUser, clinicUser]) checked(await client.auth.admin.getUserById(userId), "existing Auth user");
const cards = checked(await client.from("care_cards").select("*").eq("person_id", person.id).eq("clinic_id", clinic.id), "card preflight");
const grant = documents.filter(doc => doc.is_current).map(doc => doc.id).sort();
if (cards.length > 1 || (cards[0] && !equal([...cards[0].document_ids].sort(), grant))) throw new Error("Existing card grant differs; refusing to replace it.");
const storedFiles = checked(await client.storage.from("care-documents").list(person.id, { limit: 1000 }), "storage preflight");
for (const doc of documents) {
  const basename = doc.storage_path.split("/").at(-1);
  if (storedFiles.some(file => file.name === basename)) {
    const stored = checked(await client.storage.from("care-documents").download(doc.storage_path), "immutable PDF preflight");
    const digest = value => createHash("sha256").update(value).digest("hex");
    if (digest(Buffer.from(await stored.arrayBuffer())) !== digest(files.get(doc.id))) throw new Error("Existing PDF differs; refusing to alter this project.");
  }
}
for (const [table, rows, idKey] of [
  ["care_people", [person], "id"], ["care_clinics", [clinic], "id"], ["care_memberships", memberships, "user_id"],
]) {
  const missing = rows.filter(row => !existing[table].some(item => item[idKey] === row[idKey]));
  if (missing.length) checked(await client.from(table).insert(missing), table + " insert");
}
for (const doc of documents) {
  const bytes = files.get(doc.id);
  const uploaded = await client.storage.from("care-documents").upload(doc.storage_path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploaded.error) {
    if (![400,409].includes(Number(uploaded.error.statusCode)) || !/exist|duplicate/i.test(uploaded.error.message)) checked(uploaded, "document upload");
    const existingFile = checked(await client.storage.from("care-documents").download(doc.storage_path), "existing document download");
    const prior = Buffer.from(await existingFile.arrayBuffer());
    if (createHash("sha256").update(prior).digest("hex") !== createHash("sha256").update(bytes).digest("hex")) throw new Error("Existing PDF differs; immutable file will not be overwritten.");
  }
  if (!existing.care_documents.some(item => item.id === doc.id)) {
    const metadata = metadataOf(doc);
    checked(await client.from("care_documents").insert(metadata), "document metadata");
  }
}
if (!cards.length) checked(await client.from("care_cards").insert({ id: "card-" + randomUUID(), person_id: person.id, clinic_id: clinic.id, label: "Erika Berger · Vorsorgekarte", active: true, document_ids: grant }), "card insert");
checked(await client.from("care_records").upsert(documents.filter(doc => doc.version === 1).map(doc => ({ person_id: person.id, clinic_id: clinic.id, document_id: doc.id })), { onConflict: "person_id,clinic_id,document_id", ignoreDuplicates: true }), "baseline records");
console.log(JSON.stringify({ mode: "applied", synthetic: true, documents: documents.length, memberships: memberships.length, existingHandoffsPreserved: true, existingCardStatusPreserved: true }, null, 2));
