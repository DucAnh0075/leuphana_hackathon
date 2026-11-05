export class RequestBoundaryError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "RequestBoundaryError";
  }
}

export function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new RequestBoundaryError(403, "Diese Anfrage ist nur innerhalb der Anwendung erlaubt.");
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new RequestBoundaryError(403, "Diese Anfrage ist nur innerhalb der Anwendung erlaubt.");
  }
}

export async function readBoundedJson(request: Request, maxBytes = 4096): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestBoundaryError(415, "Bitte JSON als Anfrageformat verwenden.");
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    throw new RequestBoundaryError(413, "Die Anfrage ist zu groß.");
  }
  if (!request.body) throw new RequestBoundaryError(400, "Die Anfrage ist leer.");

  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestBoundaryError(413, "Die Anfrage ist zu groß.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new RequestBoundaryError(400, "Die Anfrage ist kein gültiges JSON-Objekt.");
  }
}
