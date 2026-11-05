import PdfViewer, { type Doc } from "@/components/PdfViewer";
import { supabase, supabaseConfigError } from "@/lib/supabase";

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
  if (!supabase) {
    return <Notice message={supabaseConfigError ?? "Die Supabase-Konfiguration fehlt."} />;
  }

  const bucket = supabase.storage.from("documents");
  const { data, error } = await bucket.list("", {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    return <Notice message="Die Dokumente konnten gerade nicht geladen werden. Bitte versuchen Sie es später erneut." />;
  }

  const docs: Doc[] = (data ?? [])
    .filter((file) => file.id && /\.pdf$/i.test(file.name))
    .map((file) => ({
      title: file.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
      url: bucket.getPublicUrl(file.name).data.publicUrl,
    }));

  if (docs.length === 0) {
    return <Notice message="Es sind noch keine PDF-Dokumente hinterlegt. Bitte laden Sie Ihre Vorsorgedokumente in den Supabase-Bucket „documents“ hoch." />;
  }

  return <PdfViewer docs={docs} />;
}
