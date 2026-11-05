import KisWorkspace from "@/components/KisWorkspace";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const patient = typeof params.patient === "string" ? params.patient : undefined;
  const document = typeof params.document === "string" ? params.document : undefined;
  const evidence = typeof params.evidence === "string" ? params.evidence : undefined;
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  return <KisWorkspace initialPatientId={patient} initialDocumentId={document} initialEvidenceId={evidence} initialPage={Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1} />;
}
