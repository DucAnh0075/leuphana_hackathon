import ClinicalCareWorkspace from "@/components/ClinicalCareWorkspace";

export const metadata = { title: "Klinikum Nord | Vorsorgeeingang" };
export default async function ClinicalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined;
  return <ClinicalCareWorkspace demoId={value("demo")} initialPatientId={value("patient")} initialDocumentId={value("document")} initialEvidenceId={value("evidence")} initialPage={Number(value("page")) || 1} />;
}
