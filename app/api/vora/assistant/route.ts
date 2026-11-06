import "server-only";
import { readBoundedJson, requireSameOrigin, RequestBoundaryError } from "@/lib/auth/request";
import { answerVoraQuestion, createVoraRequestBudget, parseVoraAssistantRequest, VoraAssistantError } from "@/lib/vora-assistant";
import { ChatGptError, chatGptSessionId, requireChatGptLocalRequest } from "@/lib/vora-chatgpt";
import { chatGptEnabled, chatGptService } from "@/lib/vora-chatgpt-runtime";

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
    const input = parseVoraAssistantRequest(await readBoundedJson(request, 80_000));
    const chatGptOrigin = input.provider === "chatgpt" ? requireChatGptLocalRequest(request, chatGptEnabled(), true).origin : undefined;
    if (!chatGptOrigin) requireSameOrigin(request);
    release = admitRequest();
    const connection = chatGptOrigin
      ? await chatGptService.inference(chatGptSessionId(request), chatGptOrigin)
      : undefined;
    const answer = await answerVoraQuestion(input, connection ? {
      provider: "chatgpt", accessToken: connection.accessToken, model: connection.model, sessionSignal: connection.signal,
    } : {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.VORA_AI_MODEL ?? process.env.OPENAI_MODEL,
    }, request.signal);
    return Response.json(answer, { headers });
  } catch (error) {
    if (error instanceof RequestBoundaryError || error instanceof VoraAssistantError || error instanceof ChatGptError) {
      return Response.json({
        error: error.message, code: error instanceof VoraAssistantError || error instanceof ChatGptError ? error.code : "REQUEST_BOUNDARY", mode: "unavailable",
      }, { status: error.status, headers: { ...headers, ...(error.status === 429 && !(error instanceof VoraAssistantError && error.code === "CHATGPT_USAGE_LIMIT") ? { "Retry-After": "60" } : {}) } });
    }
    return Response.json({ error: "Die KI-Anfrage konnte nicht verarbeitet werden.", code: "AI_UNAVAILABLE", mode: "unavailable" }, { status: 500, headers });
  } finally {
    release?.();
  }
}
