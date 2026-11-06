import { performCareAction } from "@/lib/care/service";
import { assertSameOrigin, careErrorResponse, readCareBody } from "@/lib/care/errors";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    return Response.json(await performCareAction(request, await readCareBody(request)), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careErrorResponse(error); }
}
