import { expect, test } from "@playwright/test";
import { answerVoraQuestion, readVoraCompletedStream, type VoraAssistantRequest } from "../lib/vora-assistant";
import { getVoraAgentContext } from "../lib/vora-agent-context";

const input: VoraAssistantRequest = { provider: "chatgpt", consent: true, locale: "de", context: { area: "documents" }, messages: [{ role: "user", content: "Wie kann ich beginnen?" }] };
const completed = { type: "response.completed", response: { status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "Sprich über deine Wünsche." }] }] } };
function stream(events: unknown[], fragment = false) {
  const bytes = new TextEncoder().encode(events.map(event => "event: message\r\ndata: " + JSON.stringify(event) + "\r\n\r\n").join(""));
  return new Response(new ReadableStream({ start(controller) {
    if (fragment) for (let i = 0; i < bytes.length; i++) controller.enqueue(bytes.slice(i, i + 1));
    else controller.enqueue(bytes);
    controller.close();
  } }), { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
}
test("plan request uses account model, array history, stream true/store false and no unsupported fields or tools", async () => {
  const transport: typeof fetch = async (url, init) => {
    expect(url).toBe("https://api.openai.com/v1/responses");
    const outgoing = JSON.parse(init!.body as string);
    expect(outgoing).toMatchObject({ model: "account-model", stream: true, store: false });
    expect(outgoing.input).toEqual(input.messages);
    expect(outgoing.instructions).toContain("Server-selected public context");
    for (const key of ["max_output_tokens", "tools", "previous_response_id", "background", "metadata", "temperature"]) expect(outgoing).not.toHaveProperty(key);
    expect(new Headers(init!.headers).get("Authorization")).toBe("Bearer synthetic-plan-token");
    expect(init!.redirect).toBe("error");
    return stream([{ type: "response.output_text.delta", delta: "partial text" }, completed], true);
  };
  expect(await answerVoraQuestion(input, { provider: "chatgpt", accessToken: "synthetic-plan-token", model: "account-model" }, undefined, { fetch: transport })).toEqual({ message: "Sprich über deine Wünsche.", mode: "live", sources: getVoraAgentContext(input.context).sources });
});
test("partial output, malformed events, interrupted streams and incomplete responses never count as success", async () => {
  for (const response of [stream([{ type: "response.output_text.delta", delta: "not final" }]), stream([{ type: "response.incomplete" }]), stream([{ type: "response.failed", response: { error: { code: "unknown", message: "secret provider detail" } } }]), stream([{ type: "response.completed", response: { status: "incomplete" } }]), new Response("data: broken\n\n", { headers: { "Content-Type": "text/event-stream" } }), Response.json(completed)]) {
    await expect(readVoraCompletedStream(response)).rejects.toThrow();
  }
  await expect(readVoraCompletedStream(stream([{ type: "response.output_text.delta", delta: "x".repeat(6001) }, completed]))).rejects.toHaveProperty("code", "AI_OUTPUT_LIMIT");
});
test("a completed6000-character plan response remains valid on follow-up;6001 fails even without deltas", async () => {
  const message = "a".repeat(6000);
  const terminal = (text: string) => ({ type: "response.completed", response: { status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text }] }] } });
  const configuration = { provider: "chatgpt" as const, accessToken: "synthetic", model: "account-model" };
  const answer = await answerVoraQuestion(input, configuration, undefined, { fetch: async () => stream([{ type: "response.output_text.delta", delta: message }, terminal(message)]) });
  expect(answer.message).toBe(message);
  const history = [...input.messages, { role: "assistant" as const, content: answer.message }, { role: "user" as const, content: "Next step?" }];
  let sent: unknown;
  await answerVoraQuestion({ ...input, messages: history }, configuration, undefined, { fetch: async (_url, init) => { sent = JSON.parse(init!.body as string).input; return stream([completed]); } });
  expect(sent).toEqual(history);
  await expect(answerVoraQuestion(input, configuration, undefined, { fetch: async () => stream([terminal("a".repeat(6001))]) })).rejects.toHaveProperty("code", "AI_OUTPUT_LIMIT");
});
test("late plan usage errors surface without using the paid API-key path", async () => {
  for (const [code, expected] of [["subscription_sharing_usage_limit_exceeded", "CHATGPT_USAGE_LIMIT"], ["subscription_sharing_usage_unavailable", "CHATGPT_USAGE_UNAVAILABLE"]]) {
    let calls = 0;
    const transport: typeof fetch = async () => { calls++; return stream([{ type: "response.output_text.delta", delta: "partial" }, { type: "response.failed", response: { error: { code, message: "PRIVATE" } } }]); };
    await expect(answerVoraQuestion(input, { provider: "chatgpt", accessToken: "synthetic", model: "account-model" }, undefined, { fetch: transport })).rejects.toHaveProperty("code", expected);
    expect(calls).toBe(1);
  }
  await expect(answerVoraQuestion(input, { apiKey: "synthetic-paid-key" })).rejects.toHaveProperty("code", "PROVIDER_MISMATCH");
});
test("pre-stream plan limits and eligibility preserve specific recovery without exposing provider details", async () => {
  for (const [code, expected] of [["subscription_sharing_usage_limit_exceeded", "CHATGPT_USAGE_LIMIT"], ["subscription_sharing_user_not_eligible", "CHATGPT_NOT_ELIGIBLE"], ["subscription_sharing_invalid_user", "CHATGPT_REAUTH"]]) {
    const transport: typeof fetch = async () => Response.json({ error: { code, message: "PRIVATE PROVIDER DATA" } }, { status: 403 });
    await expect(answerVoraQuestion(input, { provider: "chatgpt", accessToken: "synthetic", model: "account-model" }, undefined, { fetch: transport })).rejects.toMatchObject({ code: expected, message: expect.not.stringContaining("PRIVATE") });
  }
});
test("disconnect signal cancels actual plan transport and timeout remains bounded", async () => {
  const session = new AbortController();
  let aborted = false;
  const waiting: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init!.signal!.addEventListener("abort", () => { aborted = true; reject(new Error("synthetic abort")); });
  });
  const answer = answerVoraQuestion(input, { provider: "chatgpt", accessToken: "synthetic", model: "account-model", sessionSignal: session.signal }, undefined, { fetch: waiting });
  session.abort();
  await expect(answer).rejects.toHaveProperty("code", "CANCELLED");
  expect(aborted).toBe(true);
  await expect(answerVoraQuestion(input, { provider: "chatgpt", accessToken: "synthetic", model: "account-model" }, undefined, { fetch: waiting, timeoutMs: 10 })).rejects.toHaveProperty("code", "AI_TIMEOUT");
});
