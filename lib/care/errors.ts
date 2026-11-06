import { readBoundedJson, requireSameOrigin, RequestBoundaryError } from "@/lib/auth/request";

export class CareError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); this.name = "CareError"; }
}
export function careErrorResponse(error: unknown): Response {
  if (error instanceof RequestBoundaryError) return Response.json({ error: error.message, code: "REQUEST_BOUNDARY" }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  if (error instanceof CareError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  console.error("care_request_failed", error instanceof Error ? error.name : "unknown");
  return Response.json({ error: "Der Vorgang konnte nicht abgeschlossen werden. Bitte erneut versuchen.", code: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
export const assertSameOrigin = requireSameOrigin;
export function readCareBody(request: Request): Promise<Record<string, unknown>> { return readBoundedJson(request, 8192); }
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requireRequestId(value: unknown): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new CareError(400, "REQUEST_ID", "Eine eindeutige Vorgangskennung fehlt.");
  return value;
}
export function requireCard(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) throw new CareError(400, "CARD_ID", "Die Kartenkennung ist ungültig.");
  return value;
}
