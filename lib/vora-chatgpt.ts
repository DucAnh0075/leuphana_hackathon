import { createHash, createPublicKey, randomBytes, verify, type JsonWebKey } from "node:crypto";

const ISSUER = "https://auth.openai.com";
const AUTHORIZE = ISSUER + "/api/accounts/authorize";
const TOKEN = ISSUER + "/api/accounts/oauth/token";
const RESOURCE = "https://api.openai.com/v1";
const CALLBACK = "/api/vora/chatgpt/callback";
const SCOPES = "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
const SESSION_AGE = 12 * 60 * 60 * 1000;
const ATTEMPT_AGE = 5 * 60 * 1000;
export const CHATGPT_COOKIE = "vora_chatgpt_session";
export type ChatGptModel = { slug: string; displayName: string };
export type ChatGptDiagnostic = { phase: "callback" | "exchange" | "identity" | "credentials" | "permissions" | "models"; code: string; httpStatus?: number };
export type ChatGptStatus = { available: boolean; connected: boolean; planEnabled: boolean; pending: boolean; accountLabel?: string; reason?: string; models?: ChatGptModel[]; diagnostic?: ChatGptDiagnostic };
export class ChatGptError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const tokenText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 24_000 && !/[\s\x00-\x1f\x7f]/.test(v);
const random = () => randomBytes(32).toString("base64url");
const failure = () => new ChatGptError(502, "CHATGPT_AUTH_FAILED", "Die ChatGPT-Verbindung konnte nicht bestätigt werden. Bitte erneut anmelden.");
class DiagnosticError extends ChatGptError {
  constructor(readonly diagnostic: ChatGptDiagnostic) { super(502, diagnostic.code, failure().message); }
}
const diagnosticFailure = (phase: ChatGptDiagnostic["phase"], code: string, httpStatus?: number) => new DiagnosticError({ phase, code, ...(httpStatus === undefined ? {} : { httpStatus }) });
function oauthFailureCode(body: Record<string, unknown>): string {
  const code = object(body.error) ? body.error.code : body.error;
  // Never expose arbitrary provider messages, codes, descriptions or field values.
  return ["invalid_grant", "invalid_client", "invalid_request", "invalid_scope", "unauthorized_client", "access_denied", "temporarily_unavailable", "server_error"].includes(code as string)
    ? "OAUTH_" + String(code).toUpperCase() : "OAUTH_EXCHANGE_REJECTED";
}

/** This guard requires the operator to bind the server to 127.0.0.1 as well. */
export function requireChatGptLocalRequest(request: Request, enabled: boolean, mutation = false): URL {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedPort = request.headers.get("x-forwarded-port");
  const forwardedFor = request.headers.get("x-forwarded-for");
  // Next may normalize Request.url's loopback hostname to localhost. Validate
  // the actual Host independently, permitting only that same-port alias pair.
  const hostMatch = host?.match(/^(localhost|127\.0\.0\.1)(?::([1-9][0-9]{0,4}))?$/);
  const externalPort = hostMatch?.[2] ?? "80";
  if (!enabled || url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname) ||
      !hostMatch || Number(externalPort) > 65535 || externalPort !== (url.port || "80") ||
      url.username || url.password || request.headers.has("forwarded") ||
      (forwardedHost !== null && forwardedHost !== host) ||
      (forwardedProto !== null && forwardedProto !== "http") ||
      (forwardedPort !== null && forwardedPort !== externalPort) ||
      (forwardedFor !== null && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor))) {
    throw new ChatGptError(403, "CHATGPT_LOCAL_ONLY", "ChatGPT ist nur in der ausdrücklich aktivierten lokalen Demo verfügbar.");
  }
  url.hostname = hostMatch[1];
  url.port = externalPort;
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if ((mutation && origin !== url.origin) || (origin && origin !== url.origin) ||
      (mutation && site && site !== "same-origin" && site !== "none")) {
    throw new ChatGptError(403, "CHATGPT_ORIGIN", "Diese Anfrage ist nur innerhalb der lokalen Anwendung erlaubt.");
  }
  return url;
}

export function chatGptSessionId(request: Request): string | undefined {
  const matches = (request.headers.get("cookie") ?? "").split(";").map(p => p.trim()).filter(p => p.startsWith(CHATGPT_COOKIE + "="));
  if (matches.length !== 1) return undefined;
  const value = matches[0].slice(CHATGPT_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
}
export function chatGptSessionCookie(id: string): string {
  // Secure cannot be used with the mandated HTTP loopback callback. No Domain.
  return `${CHATGPT_COOKIE}=${id}; Path=/api/vora; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE / 1000}`;
}

type Registration = { clientId: string; subject: string; label: string };
type Credentials = { accessToken: string; refreshToken?: string; expiresAt: number; scopes: string[] };
type Session = { expiresAt: number; origin: string; registration?: Registration; retryClientId?: string; credentials?: Credentials; models: ChatGptModel[]; reason?: string; diagnostic?: ChatGptDiagnostic; pending?: string; refresh?: Promise<void>; abort: AbortController };
type Attempt = { sessionId: string; origin: string; redirectUri: string; nonce: string; verifier: string; expiresAt: number; clientId?: string; subject?: string };
type Dependencies = { fetch?: typeof fetch; now?: () => number; hostId: () => Promise<string>; timeoutMs?: number };

/** Single-process local demo. Credentials never enter browser storage or disk. */
export function createChatGptService(dependencies: Dependencies) {
  const sessions = new Map<string, Session>();
  const attempts = new Map<string, Attempt>();
  const transport = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  let discoveryCache: Record<string, unknown> | undefined;
  let keys: { values: Record<string, unknown>[]; expiresAt: number } | undefined;

  function clean() {
    for (const [state, attempt] of attempts) if (attempt.expiresAt <= now()) {
      attempts.delete(state);
      const session = sessions.get(attempt.sessionId);
      if (session?.pending === state) { session.pending = undefined; session.reason = "Die Anmeldung ist abgelaufen. Bitte erneut starten."; session.diagnostic = { phase: "callback", code: "ATTEMPT_EXPIRED" }; }
    }
    for (const [id, session] of sessions) if (session.expiresAt <= now()) { session.abort.abort(); sessions.delete(id); }
  }
  async function boundedJson(response: Response): Promise<Record<string, unknown>> {
    if (!response.body) throw failure();
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let text = "", size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 256_000) throw failure();
        text += decoder.decode(value, { stream: true });
      }
      const result: unknown = JSON.parse(text + decoder.decode());
      if (!object(result)) throw failure();
      return result;
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
  async function requestJson(url: string, init: RequestInit = {}) {
    const response = await transport(url, { ...init, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(dependencies.timeoutMs ?? 12_000) });
    const body = await boundedJson(response);
    return { response, body };
  }
  async function discovery() {
    if (!discoveryCache) {
      const { response, body } = await requestJson(ISSUER + "/.well-known/openid-configuration");
      if (!response.ok || body.issuer !== ISSUER || body.authorization_endpoint !== AUTHORIZE || body.token_endpoint !== TOKEN ||
          body.jwks_uri !== ISSUER + "/.well-known/jwks.json") throw diagnosticFailure("identity", "DISCOVERY_CONTRACT", response.status);
      discoveryCache = body;
    }
    return discoveryCache;
  }
  async function verifyIdentity(jwt: string, clientId: string, nonce: string) {
    const parts = jwt.split(".");
    if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw diagnosticFailure("identity", "TOKEN_FORMAT");
    const header: unknown = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const claims: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!object(header) || !object(claims)) throw diagnosticFailure("identity", "TOKEN_FORMAT");
    if (header.alg !== "RS256") throw diagnosticFailure("identity", "ALGORITHM_UNSUPPORTED");
    if (!tokenText(header.kid)) throw diagnosticFailure("identity", "KEY_ID_MISSING");
    if (header.crit !== undefined) throw diagnosticFailure("identity", "CRITICAL_HEADER_UNSUPPORTED");
    const metadata = await discovery();
    if (!keys || keys.expiresAt < now() || !keys.values.some(k => k.kid === header.kid)) {
      const { response, body } = await requestJson(metadata.jwks_uri as string);
      if (!response.ok || !Array.isArray(body.keys) || body.keys.length > 100) throw diagnosticFailure("identity", "JWKS_UNAVAILABLE", response.status);
      keys = { values: body.keys.filter(object), expiresAt: now() + 15 * 60_000 };
    }
    const candidates = keys.values.filter(k => k.kid === header.kid && k.kty === "RSA" && (k.use === undefined || k.use === "sig") && (k.alg === undefined || k.alg === "RS256"));
    if (candidates.length !== 1) throw diagnosticFailure("identity", "SIGNING_KEY_NOT_FOUND");
    const key = createPublicKey({ key: candidates[0] as JsonWebKey, format: "jwk" });
    if (!verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, Buffer.from(parts[2], "base64url"))) throw diagnosticFailure("identity", "SIGNATURE_INVALID");
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const seconds = now() / 1000;
    if (claims.iss !== ISSUER) throw diagnosticFailure("identity", "ISSUER_MISMATCH");
    if (!audience.includes(clientId)) throw diagnosticFailure("identity", "AUDIENCE_MISMATCH");
    if ((audience.length > 1 && claims.azp !== clientId) || (claims.azp !== undefined && claims.azp !== clientId)) throw diagnosticFailure("identity", "AUTHORIZED_PARTY_MISMATCH");
    if (typeof claims.exp !== "number" || claims.exp <= seconds - 5) throw diagnosticFailure("identity", "TOKEN_EXPIRED");
    if (typeof claims.iat !== "number" || claims.iat > seconds + 5) throw diagnosticFailure("identity", "ISSUED_AT_INVALID");
    if (claims.nbf !== undefined && (typeof claims.nbf !== "number" || claims.nbf > seconds + 5)) throw diagnosticFailure("identity", "TOKEN_NOT_YET_VALID");
    if (claims.nonce !== nonce) throw diagnosticFailure("identity", "NONCE_MISMATCH");
    if (!tokenText(claims.sub)) throw diagnosticFailure("identity", "SUBJECT_MISSING");
    const label = typeof claims.email === "string" && claims.email.length < 255 && !/[\x00-\x1f\x7f]/.test(claims.email) ? claims.email : "ChatGPT-Konto";
    return { subject: claims.sub, label };
  }
  function credentialRecord(body: Record<string, unknown>, previous?: Credentials): Credentials {
    if (!tokenText(body.access_token)) throw diagnosticFailure("credentials", "ACCESS_TOKEN_MISSING");
    if (typeof body.token_type !== "string" || body.token_type.toLowerCase() !== "bearer") throw diagnosticFailure("credentials", "TOKEN_TYPE_UNSUPPORTED");
    if (typeof body.expires_in !== "number" || !Number.isFinite(body.expires_in) || body.expires_in <= 0 || body.expires_in > 604800) throw diagnosticFailure("credentials", "TOKEN_EXPIRY_INVALID");
    if (body.refresh_token !== undefined && !tokenText(body.refresh_token)) throw diagnosticFailure("credentials", "REFRESH_TOKEN_INVALID");
    if (body.scope !== undefined && (typeof body.scope !== "string" || body.scope.length > 4096)) throw diagnosticFailure("credentials", "SCOPES_INVALID");
    return { accessToken: body.access_token, refreshToken: body.refresh_token as string | undefined ?? previous?.refreshToken,
      expiresAt: now() + body.expires_in * 1000, scopes: typeof body.scope === "string" ? body.scope.split(/\s+/) : previous?.scopes ?? [] };
  }
  const plan = (credentials?: Credentials) => !!credentials?.scopes.includes("chatgpt.tokens.use.direct") && credentials.scopes.includes("resource.invoke");
  function sessionFor(id: string | undefined, origin?: string) {
    clean();
    const session = id ? sessions.get(id) : undefined;
    return session && (!origin || origin === session.origin) ? session : undefined;
  }
  function status(id?: string, origin?: string): ChatGptStatus {
    const session = sessionFor(id, origin);
    return { available: true, connected: !!session?.credentials, planEnabled: plan(session?.credentials), pending: !!session?.pending,
      ...(session?.registration ? { accountLabel: session.registration.label } : {}),
      ...(session?.diagnostic ? { diagnostic: session.diagnostic } : {}),
      ...(session?.reason ? { reason: session.reason } : {}), models: session?.models ?? [] };
  }
  function cancel(id?: string, origin?: string) {
    const session = sessionFor(id, origin);
    if (session?.pending) { attempts.delete(session.pending); session.pending = undefined; session.diagnostic = { phase: "callback", code: "ATTEMPT_CANCELLED" }; }
  }
  async function start(origin: string, existingId?: string) {
    const url = new URL(origin);
    if (url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(url.hostname)) throw failure();
    let sessionId = existingId;
    let session = sessionFor(sessionId, origin);
    if (!session) {
      if (sessions.size >= 100) throw new ChatGptError(429, "CHATGPT_BUSY", "Zu viele lokale Anmeldungen. Bitte später erneut versuchen.");
      sessionId = random();
      session = { origin, expiresAt: now() + SESSION_AGE, models: [], abort: new AbortController() };
      sessions.set(sessionId, session);
    }
    cancel(sessionId, origin);
    const hostId = await dependencies.hostId();
    if (!/^urn:uuid:[0-9a-f-]{36}$/i.test(hostId)) throw failure();
    const state = random(), nonce = random(), verifier = random();
    const redirectUri = `http://127.0.0.1${url.port ? ":" + url.port : ""}${CALLBACK}`;
    const attempt: Attempt = { sessionId: sessionId!, origin, redirectUri, nonce, verifier, expiresAt: now() + ATTEMPT_AGE,
      clientId: session.registration?.clientId ?? session.retryClientId, subject: session.registration?.subject };
    attempts.set(state, attempt); session.pending = state; session.reason = undefined; session.diagnostic = undefined;
    const query = new URLSearchParams({ client_id: attempt.clientId ?? "dynamic_agent_client", ext_agent_host_id: hostId,
      response_type: "code", redirect_uri: redirectUri, scope: SCOPES, resource: RESOURCE, state, nonce,
      code_challenge_method: "S256", code_challenge: createHash("sha256").update(verifier).digest("base64url") });
    if (!attempt.clientId) query.set("agent_name_hint", "VORA");
    if (session.credentials && !plan(session.credentials)) query.set("prompt", "consent");
    return { sessionId: sessionId!, authorizationUrl: AUTHORIZE + "?" + query.toString() };
  }
  async function modelCatalog(credentials: Credentials): Promise<ChatGptModel[]> {
    const { response, body } = await requestJson(RESOURCE + "/models", { headers: { Authorization: "Bearer " + credentials.accessToken } });
    if (!response.ok || !Array.isArray(body.models)) throw diagnosticFailure("models", "CATALOG_UNAVAILABLE", response.status);
    return body.models.filter(object).filter(m => m.visibility === "list" && typeof m.slug === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(m.slug) && typeof m.display_name === "string" && m.display_name.length <= 160)
      .slice(0, 100).map(m => ({ slug: m.slug as string, displayName: m.display_name as string }));
  }
  async function callback(url: URL): Promise<{ ok: boolean; origin?: string; diagnostic?: ChatGptDiagnostic }> {
    clean();
    const state = url.searchParams.get("state");
    const attempt = state ? attempts.get(state) : undefined;
    if (!attempt || url.searchParams.getAll("state").length !== 1) return { ok: false, diagnostic: { phase: "callback", code: "STATE_UNKNOWN_OR_EXPIRED" } };
    if (url.origin + url.pathname !== attempt.redirectUri) return { ok: false, diagnostic: { phase: "callback", code: "REDIRECT_MISMATCH" } };
    attempts.delete(state!); // Consume before all network effects; replay cannot exchange twice.
    const session = sessions.get(attempt.sessionId);
    if (!session || session.pending !== state) return { ok: false, diagnostic: { phase: "callback", code: "SESSION_UNAVAILABLE" } };
    const live = () => sessions.get(attempt.sessionId) === session && session.pending === state && session.expiresAt > now() && attempt.expiresAt > now();
    let phase: ChatGptDiagnostic["phase"] = "callback";
    try {
      if (url.searchParams.has("error")) throw new ChatGptError(400, "CHATGPT_DENIED", "Die ChatGPT-Anmeldung wurde abgebrochen oder nicht freigegeben.");
      const code = url.searchParams.get("code"), returnedClient = url.searchParams.get("client_id");
      const clientId = returnedClient ?? attempt.clientId;
      if (url.searchParams.getAll("code").length !== 1 || !tokenText(code)) throw diagnosticFailure("callback", "CODE_MISSING_OR_INVALID");
      if (url.searchParams.getAll("client_id").length > 1 || !clientId) throw diagnosticFailure("callback", "CLIENT_ID_MISSING");
      // Issued client IDs are opaque; example prefixes are not a protocol contract.
      // The token exchange and verified JWT audience bind this exact issued ID.
      if (clientId === "dynamic_agent_client" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(clientId)) throw diagnosticFailure("callback", "CLIENT_ID_FORMAT");
      if (attempt.clientId && clientId !== attempt.clientId) throw diagnosticFailure("callback", "CLIENT_ID_MISMATCH");
      phase = "exchange";
      const { response, body } = await requestJson(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, code, code_verifier: attempt.verifier, redirect_uri: attempt.redirectUri, resource: RESOURCE }) });
      if (!response.ok) {
        // A consumed/expired code must never be retried. Preserve only its issued
        // client for a fresh authorization; identity remains unverified.
        if (oauthFailureCode(body) === "OAUTH_INVALID_GRANT" && live() && !session.registration) session.retryClientId = clientId;
        throw diagnosticFailure("exchange", oauthFailureCode(body), response.status);
      }
      if (!tokenText(body.id_token)) throw diagnosticFailure("exchange", "ID_TOKEN_MISSING");
      phase = "identity";
      const identity = await verifyIdentity(body.id_token, clientId, attempt.nonce);
      if (attempt.subject && identity.subject !== attempt.subject) throw diagnosticFailure("identity", "RETURNING_SUBJECT_MISMATCH");
      phase = "credentials";
      // Identity-only grants may omit plan tokens. Keep sign-in, disable inference.
      const credentials = body.access_token === undefined && !(typeof body.scope === "string" && body.scope.split(/\s+/).includes("chatgpt.tokens.use.direct"))
        ? { accessToken: "", expiresAt: now() + SESSION_AGE, scopes: [] } : credentialRecord(body);
      let models: ChatGptModel[] = [], reason: string | undefined, diagnostic: ChatGptDiagnostic | undefined;
      if (plan(credentials)) {
        try { models = await modelCatalog(credentials); } catch (error) { reason = "Angemeldet; die verfügbaren ChatGPT-Modelle konnten noch nicht geladen werden."; diagnostic = error instanceof DiagnosticError ? error.diagnostic : { phase: "models", code: "CATALOG_NETWORK_OR_FORMAT" }; }
        if (!models.length) { reason ??= "Für dieses ChatGPT-Konto ist derzeit kein Modell verfügbar."; diagnostic ??= { phase: "models", code: "CATALOG_EMPTY" }; }
      } else { reason = "Angemeldet, aber die Nutzung deines ChatGPT-Plans wurde nicht freigegeben."; diagnostic = { phase: "permissions", code: "PLAN_SCOPE_NOT_GRANTED" }; }
      if (!live()) return { ok: false, origin: attempt.origin, diagnostic: { phase: "callback", code: "ATTEMPT_CANCELLED_OR_EXPIRED" } };
      session.abort.abort(); session.abort = new AbortController();
      session.registration = { clientId, ...identity }; session.retryClientId = undefined; session.credentials = credentials; session.models = models; session.reason = reason; session.diagnostic = diagnostic;
      return { ok: true, origin: attempt.origin };
    } catch (error) {
      const diagnostic: ChatGptDiagnostic = error instanceof DiagnosticError ? error.diagnostic : { phase, code: error instanceof ChatGptError && error.code === "CHATGPT_DENIED" ? "AUTHORIZATION_DENIED" : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "REQUEST_TIMEOUT" : "NETWORK_OR_RESPONSE_FORMAT" };
      if (live()) { session.reason = error instanceof ChatGptError ? error.message : failure().message; session.diagnostic = diagnostic; }
      return { ok: false, origin: attempt.origin, diagnostic };
    } finally { if (session.pending === state) session.pending = undefined; }
  }
  async function refresh(session: Session) {
    const old = session.credentials, registration = session.registration;
    if (!old || !registration) throw failure();
    if (old.expiresAt > now() + 30_000) return;
    if (!old.refreshToken) { session.credentials = undefined; throw new ChatGptError(401, "CHATGPT_REAUTH", "Bitte erneut mit ChatGPT anmelden."); }
    if (!session.refresh) session.refresh = (async () => {
      const { response, body } = await requestJson(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", client_id: registration.clientId, refresh_token: old.refreshToken!, resource: RESOURCE }) });
      if (!response.ok) {
        const code = object(body.error) ? body.error.code : body.error;
        if (["invalid_grant", "invalid_refresh_token", "token_expired", "refresh_token_expired", "refresh_token_invalidated", "refresh_token_reused"].includes(code as string)) {
          if (session.credentials === old) { session.credentials = undefined; session.abort.abort(); }
          throw new ChatGptError(401, "CHATGPT_REAUTH", "Die ChatGPT-Verbindung ist abgelaufen. Bitte erneut anmelden.");
        }
        throw failure();
      }
      const next = credentialRecord(body, old);
      if (session.credentials !== old) throw failure();
      session.credentials = next;
    })().finally(() => { session.refresh = undefined; });
    await session.refresh;
  }
  async function inference(id: string | undefined, origin: string) {
    const session = sessionFor(id, origin);
    if (!session?.credentials) throw new ChatGptError(401, "CHATGPT_SIGN_IN", "Bitte zuerst mit ChatGPT anmelden.");
    await refresh(session);
    if (!plan(session.credentials)) throw new ChatGptError(403, "CHATGPT_PLAN_DISABLED", "Die Nutzung deines ChatGPT-Plans wurde nicht freigegeben.");
    if (!session.models.length) session.models = await modelCatalog(session.credentials!);
    if (!session.models.length) throw new ChatGptError(503, "CHATGPT_NO_MODELS", "Für dieses ChatGPT-Konto ist derzeit kein Modell verfügbar.");
    if (!session.credentials || session.abort.signal.aborted) throw failure();
    return { accessToken: session.credentials.accessToken, model: session.models[0].slug, signal: session.abort.signal };
  }
  async function disconnect(id: string | undefined, origin: string) {
    const session = sessionFor(id, origin);
    if (!session) return status();
    cancel(id, origin);
    session.abort.abort();
    // Wait for an already rotating token so revocation uses its latest replacement.
    await session.refresh?.catch(() => {});
    const old = session.credentials, registration = session.registration;
    session.credentials = undefined; session.models = []; session.abort.abort(); session.abort = new AbortController();
    session.diagnostic = undefined;
    session.reason = "Die lokale ChatGPT-Verbindung wurde getrennt.";
    if (old?.refreshToken && registration) {
      try {
        const metadata = await discovery();
        const endpoint = new URL(String(metadata.revocation_endpoint));
        if (endpoint.origin !== ISSUER || endpoint.username || endpoint.password) throw failure();
        const response = await transport(endpoint.href, { method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(dependencies.timeoutMs ?? 12_000), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: old.refreshToken, token_type_hint: "refresh_token", client_id: registration.clientId }) });
        await response.body?.cancel();
        if (response.status !== 200) throw failure();
      } catch { session.reason = "Lokal getrennt. Der Widerruf bei OpenAI wurde nicht bestätigt; trenne VORA bei Bedarf auch in den ChatGPT-Einstellungen."; }
    }
    return status(id, origin);
  }
  return { start, callback, status, cancel, inference, disconnect };
}
