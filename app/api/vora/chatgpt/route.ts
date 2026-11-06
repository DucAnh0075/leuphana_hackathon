import "server-only";
import { readBoundedJson, RequestBoundaryError } from "@/lib/auth/request";
import { ChatGptError, chatGptSessionCookie, chatGptSessionId, requireChatGptLocalRequest } from "@/lib/vora-chatgpt";
import { chatGptEnabled, chatGptHeaders as headers, chatGptService } from "@/lib/vora-chatgpt-runtime";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const url = requireChatGptLocalRequest(request, chatGptEnabled());
    return Response.json(chatGptService.status(chatGptSessionId(request), url.origin), { headers });
  } catch {
    return Response.json({ available: false, connected: false, planEnabled: false, pending: false, reason: "ChatGPT ist nur in der ausdrücklich aktivierten lokalen Demo verfügbar." }, { headers });
  }
}
export async function POST(request: Request) {
  try {
    const url = requireChatGptLocalRequest(request, chatGptEnabled(), true);
    const body = await readBoundedJson(request, 256);
    if (Object.keys(body).length !== 1 || !["start", "cancel", "disconnect"].includes(body.action as string)) {
      throw new ChatGptError(400, "INVALID_ACTION", "Bitte eine gültige Verbindungsaktion wählen.");
    }
    const sessionId = chatGptSessionId(request);
    if (body.action === "start") {
      const result = await chatGptService.start(url.origin, sessionId);
      return Response.json({ authorizationUrl: result.authorizationUrl }, { headers: { ...headers, "Set-Cookie": chatGptSessionCookie(result.sessionId) } });
    }
    if (body.action === "disconnect") return Response.json(await chatGptService.disconnect(sessionId, url.origin), { headers });
    chatGptService.cancel(sessionId, url.origin);
    return Response.json(chatGptService.status(sessionId, url.origin), { headers });
  } catch (error) {
    const known = error instanceof ChatGptError || error instanceof RequestBoundaryError;
    return Response.json({ error: known ? error.message : "Die ChatGPT-Verbindung konnte nicht verarbeitet werden.", code: error instanceof ChatGptError ? error.code : "CHATGPT_UNAVAILABLE" }, { status: known ? error.status : 502, headers });
  }
}
