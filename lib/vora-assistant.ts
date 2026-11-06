import { buildVoraAgentInstructions, getVoraAgentContext } from "./vora-agent-context";

export type VoraMessage = { role: "user" | "assistant"; content: string };
export type VoraAssistantRequest = {
  messages: VoraMessage[];
  context: { area: string; documentTitle?: string; moduleTitle?: string };
  locale: "de" | "en";
  consent: true;
  provider?: "chatgpt" | "apiKey";
};
export type VoraAssistantAnswer = {
  message: string;
  mode: "live";
  sources: { title: string; url: string }[];
};

export class VoraAssistantError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = "VoraAssistantError";
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const hasOnly = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every(key => keys.includes(key));
const MESSAGE_CHARACTER_LIMIT = 6000;
// Keep ordinary paragraphs while rejecting hidden control characters in prompts.
const plainText = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= maxLength &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

export function parseVoraAssistantRequest(value: unknown): VoraAssistantRequest {
  if (!isObject(value) || !hasOnly(value, ["messages", "context", "locale", "consent", "provider"]) ||
      (value.provider !== undefined && value.provider !== "chatgpt" && value.provider !== "apiKey")) {
    throw new VoraAssistantError(400, "INVALID_REQUEST", "Die Gesprächsanfrage ist ungültig.");
  }
  if (value.consent !== true) {
    throw new VoraAssistantError(400, "CONSENT_REQUIRED", "Bitte die Weitergabe dieses Gesprächs an die KI bewusst freigeben.");
  }
  if (value.locale !== "de" && value.locale !== "en") {
    throw new VoraAssistantError(400, "INVALID_LOCALE", "Bitte eine unterstützte Gesprächssprache wählen.");
  }
  if (!Array.isArray(value.messages) || !value.messages.length || value.messages.length > 24) {
    throw new VoraAssistantError(400, "HISTORY_LIMIT", "Bitte ein neues Gespräch beginnen; maximal 24 Nachrichten sind möglich.");
  }
  const messages: VoraMessage[] = value.messages.map(item => {
    if (!isObject(item) || !hasOnly(item, ["role", "content"]) ||
        (item.role !== "user" && item.role !== "assistant") || !plainText(item.content, MESSAGE_CHARACTER_LIMIT)) {
      throw new VoraAssistantError(400, "INVALID_MESSAGE", "Bitte eine Nachricht mit maximal 6.000 Zeichen eingeben.");
    }
    return { role: item.role, content: item.content.trim() };
  });
  if (messages.at(-1)?.role !== "user") {
    throw new VoraAssistantError(400, "USER_MESSAGE_REQUIRED", "Das Gespräch braucht eine neue Nachricht von dir.");
  }
  if (messages.reduce((total, item) => total + item.content.length, 0) > 18_000) {
    throw new VoraAssistantError(400, "HISTORY_LIMIT", "Dieses Gespräch ist zu lang. Bitte ein neues Gespräch beginnen.");
  }
  const context = value.context;
  if (!isObject(context) || !hasOnly(context, ["area", "documentTitle", "moduleTitle"]) ||
      !plainText(context.area, 80) ||
      (context.documentTitle !== undefined && !plainText(context.documentTitle, 160)) ||
      (context.moduleTitle !== undefined && !plainText(context.moduleTitle, 160))) {
    throw new VoraAssistantError(400, "INVALID_CONTEXT", "Der ausgewählte Gesprächsbereich ist ungültig.");
  }
  return {
    messages, locale: value.locale, consent: true,
    ...(value.provider === undefined ? {} : { provider: value.provider }),
    context: {
      area: context.area.trim(),
      ...(context.documentTitle === undefined ? {} : { documentTitle: (context.documentTitle as string).trim() }),
      ...(context.moduleTitle === undefined ? {} : { moduleTitle: (context.moduleTitle as string).trim() }),
    },
  };
}

type ProviderConfiguration = { provider?: "apiKey"; apiKey?: string; model?: string } |
  { provider: "chatgpt"; accessToken: string; model: string; sessionSignal?: AbortSignal };
type ProviderDependencies = { fetch?: typeof fetch; timeoutMs?: number };

/** No database access or writes. The route supplies server-only credentials. */
export async function answerVoraQuestion(
  input: VoraAssistantRequest,
  configuration: ProviderConfiguration,
  requestSignal?: AbortSignal,
  dependencies: ProviderDependencies = {},
): Promise<VoraAssistantAnswer> {
  // Validate at the provider boundary too, so future callers cannot bypass consent.
  const safeInput = parseVoraAssistantRequest(input);
  const publicContext = getVoraAgentContext(safeInput.context);
  const chatGpt = configuration.provider === "chatgpt";
  if ((safeInput.provider ?? "apiKey") !== (configuration.provider ?? "apiKey")) {
    throw new VoraAssistantError(400, "PROVIDER_MISMATCH", "Bitte die gewünschte KI-Verbindung ausdrücklich wählen.");
  }
  const credential = configuration.provider === "chatgpt" ? configuration.accessToken : configuration.apiKey;
  if (!credential?.trim()) {
    throw new VoraAssistantError(503, "AI_NOT_CONFIGURED", "Die KI ist hier noch nicht verbunden. Deine Eingabe wurde nicht weitergegeben.");
  }
  const model = configuration.model?.trim() || "gpt-4.1-mini";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(model)) {
    throw new VoraAssistantError(503, "AI_NOT_CONFIGURED", "Die KI-Verbindung ist noch nicht vollständig eingerichtet.");
  }
  const sessionSignal = configuration.provider === "chatgpt" ? configuration.sessionSignal : undefined;
  if (requestSignal?.aborted || sessionSignal?.aborted) throw new VoraAssistantError(499, "CANCELLED", "Die Anfrage wurde abgebrochen.");
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  requestSignal?.addEventListener("abort", onAbort, { once: true });
  sessionSignal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, dependencies.timeoutMs ?? 25_000);
  try {
    const response = await (dependencies.fetch ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + credential, "Content-Type": "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      body: JSON.stringify({
        model, store: false, ...(chatGpt ? { stream: true } : { max_output_tokens: 1200 }),
        instructions: buildVoraAgentInstructions(publicContext, safeInput.locale),
        input: safeInput.messages,
      }),
    });
    if (!response.ok) {
      // Never return provider bodies: they can contain request or account details.
      if (chatGpt) {
        const planError = await readVoraPlanError(response);
        if (planError) throw planError;
      }
      if (response.status === 429) throw new VoraAssistantError(429, "AI_BUSY", "Die KI ist gerade ausgelastet. Bitte später erneut versuchen.");
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        throw new VoraAssistantError(503, "AI_CONFIGURATION", "Die KI-Verbindung ist derzeit nicht verfügbar. Bitte später erneut versuchen.");
      }
      throw new VoraAssistantError(502, "AI_UNAVAILABLE", "Die KI antwortet gerade nicht. Deine Nachricht bleibt im Gespräch; du kannst es erneut versuchen.");
    }
    const result: unknown = chatGpt ? await readVoraCompletedStream(response) : await response.json();
    if (!isObject(result) || result.status !== "completed" || result.error || !Array.isArray(result.output)) {
      throw new VoraAssistantError(502, "AI_INCOMPLETE", "Die KI-Antwort war unvollständig. Bitte erneut versuchen.");
    }
    const message = result.output.flatMap(item => {
      if (!isObject(item) || item.type !== "message" || item.role !== "assistant" || !Array.isArray(item.content)) return [];
      return item.content.flatMap(part => isObject(part) && part.type === "output_text" && typeof part.text === "string" ? [part.text] : []);
    }).join("\n\n").trim();
    if (message.length > MESSAGE_CHARACTER_LIMIT) throw new VoraAssistantError(502, "AI_OUTPUT_LIMIT", "Die KI-Antwort ist zu lang. Bitte die Frage enger eingrenzen.");
    if (!plainText(message, MESSAGE_CHARACTER_LIMIT)) throw new VoraAssistantError(502, "AI_INCOMPLETE", "Die KI hat keine vollständige Textantwort geliefert. Bitte erneut versuchen.");
    // Curated context references, not retrieved evidence or model-generated URLs.
    return { message, mode: "live", sources: publicContext.sources };
  } catch (error) {
    if (requestSignal?.aborted || sessionSignal?.aborted) throw new VoraAssistantError(499, "CANCELLED", "Die Anfrage wurde abgebrochen.");
    if (timedOut) throw new VoraAssistantError(504, "AI_TIMEOUT", "Die KI braucht zu lange. Bitte erneut versuchen.");
    if (error instanceof VoraAssistantError) throw error;
    throw new VoraAssistantError(502, "AI_UNAVAILABLE", "Die KI ist gerade nicht erreichbar. Bitte erneut versuchen.");
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", onAbort);
    sessionSignal?.removeEventListener("abort", onAbort);
  }
}

function planError(code: unknown): VoraAssistantError | undefined {
  if (code === "subscription_sharing_usage_limit_exceeded") return new VoraAssistantError(429, "CHATGPT_USAGE_LIMIT", "Das Nutzungslimit für diese ChatGPT-Verbindung wurde erreicht. Prüfe die Nutzung in deinen ChatGPT-Einstellungen.");
  if (code === "subscription_sharing_usage_unavailable" || code === "subscription_sharing_user_unavailable") return new VoraAssistantError(503, "CHATGPT_USAGE_UNAVAILABLE", "Die ChatGPT-Nutzung kann gerade nicht geprüft werden. Bitte später erneut versuchen.");
  if (code === "subscription_sharing_user_not_eligible") return new VoraAssistantError(403, "CHATGPT_NOT_ELIGIBLE", "Die Nutzung des ChatGPT-Plans ist für dieses Konto oder diesen Workspace nicht verfügbar.");
  if (code === "subscription_sharing_invalid_user") return new VoraAssistantError(401, "CHATGPT_REAUTH", "Das ChatGPT-Konto konnte nicht bestätigt werden. Bitte erneut anmelden.");
  if (code === "subscription_sharing_unsupported_capability" || code === "subscription_sharing_route_not_supported" || code === "chatpass_v2_scope_not_authorized" || code === "chatpass_v2_invalid_authorization_context") return new VoraAssistantError(403, "CHATGPT_CONFIGURATION", "Diese ChatGPT-Anfrage wurde nicht freigegeben. Bitte die Verbindung und Kontoberechtigungen prüfen.");
}

async function readVoraPlanError(response: Response): Promise<VoraAssistantError | undefined> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "", bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32_000) return;
      text += decoder.decode(value, { stream: true });
    }
    const result: unknown = JSON.parse(text + decoder.decode());
    return isObject(result) && isObject(result.error) ? planError(result.error.code) : undefined;
  } catch { return; } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** Plan usage is successful only on response.completed, never on partial deltas. */
export async function readVoraCompletedStream(response: Response): Promise<unknown> {
  const incomplete = () => new VoraAssistantError(502, "AI_INCOMPLETE", "Die ChatGPT-Antwort war unvollständig. Bitte erneut versuchen.");
  if (!response.headers.get("content-type")?.toLowerCase().startsWith("text/event-stream") || !response.body) throw incomplete();
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "", data: string[] = [], bytes = 0, textLength = 0;
  function event(): unknown | undefined {
    if (!data.length) return;
    const payload = data.join("\n"); data = [];
    if (payload === "[DONE]") throw incomplete();
    const item: unknown = JSON.parse(payload);
    if (!isObject(item)) throw incomplete();
    if (item.type === "response.output_text.delta" && typeof item.delta === "string") {
      textLength += item.delta.length;
      if (textLength > MESSAGE_CHARACTER_LIMIT) throw new VoraAssistantError(502, "AI_OUTPUT_LIMIT", "Die ChatGPT-Antwort ist zu lang. Bitte die Frage enger eingrenzen.");
    }
    if (item.type === "response.failed" || item.type === "error" || item.type === "response.incomplete") {
      const error = isObject(item.response) && isObject(item.response.error) ? item.response.error : isObject(item.error) ? item.error : item;
      throw planError(error.code) ?? incomplete();
    }
    if (item.type === "response.completed") {
      if (!isObject(item.response) || item.response.status !== "completed" || item.response.error) throw incomplete();
      return item.response;
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512_000) throw incomplete();
      pending += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = pending.indexOf("\n")) !== -1) {
        const line = pending.slice(0, end).replace(/\r$/, ""); pending = pending.slice(end + 1);
        if (line === "") { const completed = event(); if (completed !== undefined) return completed; }
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
    }
    throw incomplete();
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

/** Bounded per-process cost protection; this is not a distributed production quota. */
export function createVoraRequestBudget(now: () => number = Date.now) {
  let active = 0;
  let starts: number[] = [];
  return () => {
    const current = now();
    starts = starts.filter(start => start > current - 60_000);
    if (active >= 3 || starts.length >= 20) {
      throw new VoraAssistantError(429, "AI_BUSY", "Die KI ist gerade ausgelastet. Bitte in einer Minute erneut versuchen.");
    }
    starts.push(current);
    active++;
    let released = false;
    return () => { if (!released) { released = true; active--; } };
  };
}
