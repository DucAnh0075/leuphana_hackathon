import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Doc } from "@/components/PdfViewer";
import { supabase } from "@/lib/supabase";

function documentTitle(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/_/g, " ");
}

function localDocuments(): Doc[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "pdfs"), {
        withFileTypes: true,
      })
      .filter((file) => file.isFile() && /\.pdf$/i.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name, "de"))
      .map(({ name }) => ({
        title: documentTitle(name),
        url: "/pdfs/" + encodeURIComponent(name),
      }));
  } catch {
    return [];
  }
}

export async function getDocuments(): Promise<{ docs: Doc[]; offline: boolean }> {
  try {
    if (supabase) {
      const bucket = supabase.storage.from("documents");
      const { data, error } = await bucket.list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

      if (!error) {
        const docs: Doc[] = (data ?? [])
          .filter((file) => file.id && /\.pdf$/i.test(file.name))
          .map((file) => ({
            title: documentTitle(file.name),
            url: bucket.getPublicUrl(file.name).data.publicUrl,
          }));

        if (docs.length > 0) return { docs, offline: false };
      }
    }
  } catch {
    // Bei Netzwerkfehlern bleiben die lokalen Dokumente verfügbar.
  }

  return { docs: localDocuments(), offline: true };
}
