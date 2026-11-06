import "server-only";
import { randomBytes } from "node:crypto";
import { requireChatGptLocalRequest, type ChatGptDiagnostic } from "@/lib/vora-chatgpt";
import { chatGptEnabled, chatGptHeaders, chatGptService } from "@/lib/vora-chatgpt-runtime";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  let result: { ok: boolean; origin?: string; diagnostic?: ChatGptDiagnostic } = { ok: false, diagnostic: { phase: "callback", code: "LOCAL_CALLBACK_REJECTED" } };
  try {
    const url = requireChatGptLocalRequest(request, chatGptEnabled());
    if (url.hostname === "127.0.0.1" && url.href.length < 32_000) result = await chatGptService.callback(url);
  } catch { /* OAuth details and provider bodies must not reach HTML or logs. */ }
  const nonce = randomBytes(18).toString("base64url");
  const script = `history.replaceState(null,"",${JSON.stringify("/api/vora/chatgpt/callback")});${result.origin ? `if(window.opener)window.opener.postMessage({type:"vora:chatgpt-auth",ok:${result.ok}},${JSON.stringify(result.origin)});` : ""}`;
  // These are static/allowlisted diagnostic identifiers, never provider values.
  const diagnostic = result.diagnostic ? `<p>Diagnose: ${result.diagnostic.phase} / ${result.diagnostic.code}${result.diagnostic.httpStatus ? " (HTTP " + result.diagnostic.httpStatus + ")" : ""}</p>` : "";
  return new Response(`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VORA · ChatGPT</title><body><main><h1>${result.ok ? "ChatGPT-Anmeldung bestätigt" : "ChatGPT-Anmeldung nicht abgeschlossen"}</h1><p>Du kannst dieses Fenster schließen und zu VORA zurückkehren.</p>${diagnostic}</main><script nonce="${nonce}">${script}</script></body></html>`, {
    status: result.ok ? 200 : 400,
    headers: { ...chatGptHeaders, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` },
  });
}
