import "server-only";
import { readBoundedJson, requireSameOrigin, RequestBoundaryError } from "@/lib/auth/request";
import { answerVoraQuestion, createVoraRequestBudget, parseVoraAssistantRequest, VoraAssistantError } from "@/lib/vora-assistant";

export const runtime = "nodejs";
export const maxDuration = 30;
const admitRequest = createVoraRequestBudget();
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  return Response.json({ configured: Boolean(process.env.OPENAI_API_KEY?.trim()), provider: "OpenAI" }, { headers });
}

export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    requireSameOrigin(request);
    const input = parseVoraAssistantRequest(await readBoundedJson(request, 80_000));
    release = admitRequest();
    const answer = await answerVoraQuestion(input, {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.VORA_AI_MODEL ?? process.env.OPENAI_MODEL,
    }, request.signal);
    return Response.json(answer, { headers });
  } catch (error) {
    if (error instanceof RequestBoundaryError || error instanceof VoraAssistantError) {
      return Response.json({
        error: error.message, code: error instanceof VoraAssistantError ? error.code : "REQUEST_BOUNDARY", mode: "unavailable",
      }, { status: error.status, headers: { ...headers, ...(error.status === 429 ? { "Retry-After": "60" } : {}) } });
    }
    return Response.json({ error: "Die KI-Anfrage konnte nicht verarbeitet werden.", code: "AI_UNAVAILABLE", mode: "unavailable" }, { status: 500, headers });
  } finally {
    release?.();
  }
}
