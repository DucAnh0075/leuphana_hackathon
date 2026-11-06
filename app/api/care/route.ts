import { readCareSnapshot } from "@/lib/care/service";
import { careErrorResponse } from "@/lib/care/errors";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(await readCareSnapshot(request), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return careErrorResponse(error); }
}
