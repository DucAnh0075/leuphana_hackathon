import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfiguration } from "@/lib/auth/config";
import dataset from "@/lib/demo-patients.json";
import type { ClinicalDocument, ClinicalFact } from "@/lib/clinical-care";

let client: SupabaseClient | undefined;
export function getKisSupabase() {
  const config = getSupabaseConfiguration();
  if (!config) return null;
  return client ??= createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function publicDocumentUrl(file: string) {
  const config = getSupabaseConfiguration();
  return config ? `${config.url}/storage/v1/object/public/documents/${encodeURIComponent(file)}` : "";
}
export type KisCard = { patientId: string; documents: ClinicalDocument[]; facts: ClinicalFact[]; carePreferences: ClinicalFact[]; source: "supabase" | "lokal" };
export async function loadKisCard(cardId: string): Promise<KisCard | null> {
  const supabase = getKisSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("kis_cards").select("patient_id, documents, facts, care_preferences").eq("id", cardId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { patientId: data.patient_id, documents: data.documents.map(({ file, ...doc }: Omit<ClinicalDocument, "url"> & { file: string }) => ({ ...doc, url: publicDocumentUrl(file) })), facts: data.facts, carePreferences: data.care_preferences, source: "supabase" };
    } catch { /* Offline demo fallback is limited to the known demo card. */ }
  }
  const patient = dataset.patients.find(patient => patient.id === "26004179");
  return cardId === "demo" && patient ? { patientId: patient.id, documents: patient.documents, facts: patient.facts, carePreferences: patient.carePreferences, source: "lokal" } : null;
}
