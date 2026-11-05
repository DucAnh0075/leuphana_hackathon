"use client";

export type Doc = { title: string; url: string };

// Platzhalter – wird vom nfc-ui-Agent (Issue #17) durch den react-pdf-Viewer ersetzt.
export default function PdfViewer({ docs }: { docs: Doc[] }) {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Ihre Vorsorgedokumente</h1>
      <ul className="space-y-6 text-2xl">
        {docs.map((doc) => (
          <li key={doc.url}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {doc.title}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
