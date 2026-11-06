import { healthText } from "./vora-health-language";

/** Health pass v1: local drafts and explicitly opted-in fictional ePA data. */
export const HEALTH_PASS_KEY = "vora.health-pass.v1";
/** Scope is issued by the authenticated server response, never derived from form fields. */
function scopeSuffix(scope?: string): string {
  if (scope === undefined) return ""; // Preserve the separate legacy standalone store.
  if (!/^(account|demo)-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(scope)) throw new Error("The Health pass account scope is unavailable. Reload your profile before editing.");
  return `.${scope.toLowerCase()}`;
}
export function healthPassStorageKey(scope?: string): string { return HEALTH_PASS_KEY + scopeSuffix(scope); }
export function healthPassDatabaseName(scope?: string): string { return "vora-health-pass-files" + scopeSuffix(scope); }
export const HEALTH_PASS_SOURCES = {
  card: "https://www.organspende-info.de/organspendeausweis-download-und-bestellen/",
  guide: "https://www.organspende-info.de/organspendeausweis-infos-zum-ausfuellen/",
  age: "https://www.bundesgesundheitsministerium.de/themen/praevention/organspende/faqs",
};
export const DONOR_CHOICES = [
  { value: "all", label: "Yes, donate all organs and tissues" },
  { value: "except", label: "Yes, except the organs and tissues I list" },
  { value: "only", label: "Yes, only the organs and tissues I list" },
  { value: "no", label: "No, I do not consent to donation" },
  { value: "delegate", label: "Let a person I name decide" },
] as const;
export type DonorChoice = typeof DONOR_CHOICES[number]["value"] | "";
export type DonorDraft = {
  name: string; birthDate: string; address: string; date: string;
  choice: DonorChoice; organs: string; delegateName: string; delegateContact: string; notes: string;
};
export type HealthPassState = {
  version: 1; donor: DonorDraft; demo: null | { consentAt: string; syncedAt: string };
};
export const DEMO_VACCINATIONS = [
  { id: "demo-tdap", name: "Tetanus, diphtheria & pertussis", date: "2024-05-08", product: "Fictional Tdap vaccine", batch: "DEMO-001" },
  { id: "demo-mmr", name: "Measles, mumps & rubella", date: "2022-09-19", product: "Fictional MMR vaccine", batch: "DEMO-002" },
] as const;
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function emptyHealthPass(): HealthPassState {
  return { version: 1, demo: null, donor: { name: "", birthDate: "", address: "", date: localDate(), choice: "", organs: "", delegateName: "", delegateContact: "", notes: "" } };
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: string[]) { return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)); }
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; }
export function parseHealthPass(raw: string): HealthPassState {
  if (raw.length > 16000) throw new Error("Saved Health pass is too large. It has been left unchanged.");
  const value: unknown = JSON.parse(raw);
  if (!record(value) || !exactKeys(value, ["version", "donor", "demo"]) || value.version !== 1 || !record(value.donor)) throw new Error("This saved Health pass cannot be read. It has been left unchanged.");
  const limits: Record<keyof DonorDraft, number> = { name: 200, birthDate: 10, address: 500, date: 10, choice: 10, organs: 500, delegateName: 200, delegateContact: 500, notes: 1000 };
  const savedDonor = value.donor;
  if (!exactKeys(savedDonor, Object.keys(limits)) || Object.entries(limits).some(([key, max]) => typeof savedDonor[key] !== "string" || String(savedDonor[key]).length > max)) throw new Error("The saved card has invalid fields. It has been left unchanged.");
  const donor = value.donor as DonorDraft;
  if (!["", ...DONOR_CHOICES.map(choice => choice.value)].includes(donor.choice) || [donor.birthDate, donor.date].some(date => date !== "" && !validDate(date))) throw new Error("The saved card has an invalid decision or date. It has been left unchanged.");
  if (value.demo !== null && (!record(value.demo) || !exactKeys(value.demo, ["consentAt", "syncedAt"]) || [value.demo.consentAt, value.demo.syncedAt].some(date => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(date) || !Number.isFinite(Date.parse(date))) || String(value.demo.consentAt) > String(value.demo.syncedAt))) throw new Error("The saved demo connection is invalid. It has been left unchanged.");
  return value as HealthPassState;
}
export function donorIssues(draft: DonorDraft, today = localDate()): string[] {
  const issues: string[] = [];
  if (!draft.name.trim()) issues.push("Add your full name.");
  if (!validDate(draft.birthDate) || draft.birthDate > today) issues.push("Add a valid date of birth.");
  if (!draft.address.trim()) issues.push("Add your address.");
  if (!validDate(draft.date) || draft.date > today) issues.push("Add a declaration date that is not in the future.");
  if (!draft.choice) issues.push("Your donation decision is still open. You can keep this draft without choosing.");
  if ((draft.choice === "except" || draft.choice === "only") && !draft.organs.trim()) issues.push("List the organs and tissues for your chosen option.");
  if (draft.choice === "delegate" && (!draft.delegateName.trim() || !draft.delegateContact.trim())) issues.push("Add your trusted person’s name and contact details.");
  if (validDate(draft.birthDate) && validDate(draft.date) && draft.birthDate <= draft.date && draft.choice) {
    const age = Number(draft.date.slice(0, 4)) - Number(draft.birthDate.slice(0, 4)) - (draft.date.slice(5) < draft.birthDate.slice(5) ? 1 : 0);
    if (age < (draft.choice === "no" ? 14 : 16)) issues.push(draft.choice === "no" ? "A refusal can be declared from age 14. Keep this as an unsigned draft." : "Consent or delegation can be declared from age 16. Keep this as an unsigned draft.");
  } else if (validDate(draft.birthDate) && validDate(draft.date) && draft.birthDate > draft.date) issues.push("The declaration date must be on or after your date of birth.");
  return issues;
}
export function germanDecision(draft: DonorDraft): string {
  switch (draft.choice) {
    case "all": return "Nach der ärztlichen Feststellung meines Todes gestatte ich die Entnahme meiner Organe und Gewebe zur Transplantation.";
    case "except": return `Nach der ärztlichen Feststellung meines Todes gestatte ich die Entnahme meiner Organe und Gewebe zur Transplantation mit folgender Ausnahme: ${draft.organs}`;
    case "only": return `Nach der ärztlichen Feststellung meines Todes gestatte ich ausschließlich die Entnahme folgender Organe und Gewebe zur Transplantation: ${draft.organs}`;
    case "no": return "Ich widerspreche der Entnahme meiner Organe und Gewebe zur Transplantation nach meinem Tod.";
    case "delegate": return `Über die Entnahme meiner Organe und Gewebe zur Transplantation nach meinem Tod soll folgende Person entscheiden: ${draft.delegateName}. Kontakt: ${draft.delegateContact}`;
    default: return "ENTSCHEIDUNG OFFEN – keine Erklärung abgegeben.";
  }
}
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export function donorDocument(draft: DonorDraft): string {
  const issues = donorIssues(draft);
  const field = (label: string, value: string) => `<p><strong>${label}</strong><br>${escapeHtml(value || "Noch offen")}</p>`;
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Organspendeausweis – persönlicher Entwurf</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#172e42;max-width:740px;margin:40px auto;padding:24px}h1{font-size:25px}p{white-space:pre-wrap;overflow-wrap:anywhere}.status{border:1px solid #8798a8;padding:12px}article{border:2px solid #172e42;padding:24px}small{font-size:12px}.signature{margin-top:50px;border-top:1px solid #172e42;padding-top:8px}@media print{body{margin:0;padding:12mm}article{break-inside:avoid}a{color:inherit}}</style><h1>Organspendeausweis</h1><p class="status">UNTERSCHRIFTSLOSER ENTWURF · Persönliche Erklärung, erstellt mit VORAcard. Erst nach Prüfung ausdrucken, Datum ergänzen und eigenhändig unterschreiben. Kein Eintrag im Organspende-Register.</p>${issues.length ? `<p><strong>Unvollständiger Entwurf – noch nicht zur Unterschrift bereit.</strong></p><ul>${issues.map(issue => `<li>${escapeHtml(healthText(issue, "de"))}</li>`).join("")}</ul>` : ""}<article><h2>Erklärung zur Organ- und Gewebespende</h2>${field("Name, Vorname", draft.name)}${field("Geburtsdatum", draft.birthDate)}${field("Anschrift", draft.address)}<p>${escapeHtml(germanDecision(draft))}</p>${draft.notes.trim() ? field("Zusätzliche Hinweise", draft.notes) : ""}${field("Datum der Erklärung", draft.date)}<p class="signature">Ort, Datum und eigenhändige Unterschrift</p></article><p><small>Bitte die Erklärung prüfen, unterschreiben, bei sich tragen und die Angehörigen informieren. Bei einer Änderung eine neue Erklärung erstellen.</small></p><p><small>Offizielle Vorlage und Ausfüllhilfe: <a href="${HEALTH_PASS_SOURCES.card}">BIÖG Organspendeausweis</a>. Dieses Dokument ist eine eigene VORAcard-Vorlage, kein amtliches Formular.</small></p></html>`;
}
export const MAX_CARD_BYTES = 5 * 1024 * 1024;
export type StoredCard = { id: "organ-card"; revision: string; name: string; kind: "image/png" | "image/jpeg" | "application/pdf"; blob: Blob; savedAt: string };
export async function inspectCard(file: Blob): Promise<StoredCard["kind"]> {
  if (!file.size || file.size > MAX_CARD_BYTES) throw new Error("Choose one non-empty PNG, JPEG or PDF up to 5 MB.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if ([37, 80, 68, 70, 45].every((value, index) => bytes[index] === value)) return "application/pdf";
  throw new Error("The file contents are not PNG, JPEG or PDF. The previous card is unchanged.");
}
function cardDatabase(scope?: string): Promise<IDBDatabase> {
  const name = healthPassDatabaseName(scope);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("cards", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Local file storage is unavailable. Your file was not saved."));
    request.onblocked = () => reject(new Error("Close the other VORAcard tab and retry local file storage."));
  });
}
export async function readStoredCard(scope?: string): Promise<StoredCard | null> {
  const db = await cardDatabase(scope);
  try {
    const card = await new Promise<StoredCard | undefined>((resolve, reject) => {
      const request = db.transaction("cards", "readonly").objectStore("cards").get("organ-card");
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error("The saved file could not be read."));
    });
    if (!card) return null;
    if (card.id !== "organ-card" || typeof card.revision !== "string" || !/^[a-f0-9-]{36}$/.test(card.revision) || typeof card.name !== "string" || card.name.length > 255 || !(card.blob instanceof Blob) || typeof card.savedAt !== "string" || !Number.isFinite(Date.parse(card.savedAt)) || await inspectCard(card.blob) !== card.kind) throw new Error("The saved file is invalid. It has been left unchanged.");
    return card;
  } finally { db.close(); }
}
/** Compare-and-write within one IndexedDB transaction; never replace a newer tab's file. */
export async function writeStoredCard(card: StoredCard | null, expectedRevision: string | null, scope?: string): Promise<void> {
  const db = await cardDatabase(scope);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("cards", "readwrite"); const store = tx.objectStore("cards");
      let conflict = false;
      const request = store.get("organ-card");
      request.onsuccess = () => {
        if ((request.result?.revision ?? null) !== expectedRevision) { conflict = true; tx.abort(); return; }
        if (card) store.put(card); else store.delete("organ-card");
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new Error(conflict ? "The saved file changed in another tab. Reload before replacing it." : "The file could not be saved locally. The previous file is unchanged."));
    });
  } finally { db.close(); }
}
