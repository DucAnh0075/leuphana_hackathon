import { getDocuments } from "@/lib/documents";
import KisWorkspace from "@/components/KisWorkspace";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { docs } = await getDocuments();
  const params = await searchParams;
  const patient = typeof params.patient === "string" ? params.patient : undefined;
  const document = typeof params.document === "string" ? params.document : undefined;
  const page = typeof params.page === "string" ? Number(params.page) : 1;
  return <KisWorkspace cardDocuments={docs} initialPatientId={patient} initialDocumentId={document} initialPage={Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1} />;
}
