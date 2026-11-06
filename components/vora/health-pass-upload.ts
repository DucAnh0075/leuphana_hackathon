"use client";
import { inspectCard, type StoredCard } from "@/lib/vora-health-pass";

/** Decode locally before a replacement can displace the user's readable original. */
export async function validateCardReadability(file: Blob): Promise<StoredCard["kind"]> {
  const kind = await inspectCard(file);
  if (kind !== "application/pdf") {
    try { const bitmap = await createImageBitmap(file); bitmap.close(); }
    catch { throw new Error("This image could not be opened. Choose a readable PNG or JPEG. The previous card is unchanged."); }
    return kind;
  }
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), stopAtErrors: true, useWorkerFetch: false, disableFontFace: true, useSystemFonts: false, enableXfa: false });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        const document = await task.promise;
        if (document.numPages < 1) throw new Error("No readable pages");
        // Parse drawing commands only: no text extraction, rendering, links or scripts.
        for (let number = 1; number <= document.numPages; number++) {
          const page = await document.getPage(number); await page.getOperatorList(); page.cleanup();
        }
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("PDF validation timed out")), 15_000); }),
    ]);
  } catch { throw new Error("This PDF could not be opened. Choose an unlocked, readable PDF. The previous card is unchanged."); }
  finally { clearTimeout(timer); await task.destroy(); }
  return kind;
}
