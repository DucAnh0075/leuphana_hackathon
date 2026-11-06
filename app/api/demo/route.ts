import { createDemoSession } from "@/lib/care/demo";
import { assertSameOrigin, careErrorResponse } from "@/lib/care/errors";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    return Response.json({ demoId: createDemoSession() }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careErrorResponse(error); }
}
