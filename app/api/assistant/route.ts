import { answerCareQuestion } from "@/lib/care-assistant";
import { CareError, careErrorResponse } from "@/lib/care/errors";
import { readBoundedJson, requireSameOrigin, RequestBoundaryError } from "@/lib/auth/request";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readBoundedJson(request, 4096);
    if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 1000 ||
        (body.documentId !== undefined && (typeof body.documentId !== "string" || body.documentId.length > 120)))
      throw new CareError(400, "QUESTION", "Bitte eine kurze Frage zur Vorsorge eingeben.");
    const answer = await answerCareQuestion(request, body.question.trim(), body.documentId as string | undefined);
    return Response.json(answer, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RequestBoundaryError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return careErrorResponse(error);
  }
}
