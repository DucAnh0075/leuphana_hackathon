import PdfViewer from "@/components/PdfViewer";
import { getDocuments } from "@/lib/documents";

export const dynamic = "force-dynamic";

function Notice({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Ihre Vorsorgedokumente</h1>
      <p className="text-2xl leading-relaxed" role="status">{message}</p>
    </main>
  );
}

export default async function DokumentePage() {
  const { docs, offline } = await getDocuments();

  return (
    <>
      {offline && (
        <div
          role="status"
          className="mx-auto w-full max-w-4xl bg-slate-900 p-6 text-2xl font-bold text-white"
        >
          Offline-Modus – lokale Dokumente
        </div>
      )}
      {docs.length === 0 ? (
        <Notice message="Es sind noch keine PDF-Dokumente hinterlegt. Bitte laden Sie Ihre Vorsorgedokumente in den Supabase-Bucket „documents“ hoch oder legen Sie im Offline-Modus PDFs nach public/pdfs/." />
      ) : (
        <PdfViewer docs={docs} />
      )}
    </>
  );
}
