// Evolves upstream issue #32 / commit 8d891788: iPhone -> scan -> Supabase -> clinical notification.
// Version boundary: a GET no longer writes and scans require a session or an explicit synthetic demo run.
import { performCareScan } from "@/lib/care/service";
import { assertSameOrigin, careErrorResponse, readCareBody } from "@/lib/care/errors";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ error: "Zum Scannen /scan öffnen. Ein Scan wird ausschließlich mit POST bestätigt.", code: "POST_REQUIRED" }, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    return Response.json(await performCareScan(request, await readCareBody(request)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careErrorResponse(error); }
}
