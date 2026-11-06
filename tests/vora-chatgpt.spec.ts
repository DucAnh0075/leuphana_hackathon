import { expect, test } from "@playwright/test";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { CHATGPT_COOKIE, chatGptSessionCookie, chatGptSessionId, createChatGptService, requireChatGptLocalRequest } from "../lib/vora-chatgpt";

const issuer = "https://auth.openai.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "synthetic-key", use: "sig", alg: "RS256" };
const scope = "openid email profile resource.invoke chatgpt.tokens.use.direct offline_access";
const origin = "http://localhost:3110";
function fixture(options: { claims?: Record<string, unknown>; scope?: string; header?: Record<string, unknown>; badSignature?: boolean; identityOnly?: boolean; modelGate?: Promise<void>; revokeStatus?: number; refreshError?: string; exchangeError?: string; clientId?: string; tokenType?: string; expiresIn?: number } = {}) {
  let time = Date.now();
  let authorize: URL;
  let tokenCalls = 0, refreshCalls = 0;
  const calls: { url: string; body?: URLSearchParams; headers: Headers }[] = [];
  const transport: typeof fetch = async (input, init) => {
    const url = String(input);
    expect(init?.redirect).toBe("error");
    expect(init?.cache).toBe("no-store");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = init?.body instanceof URLSearchParams ? init.body : undefined;
    calls.push({ url, body, headers: new Headers(init?.headers) });
    if (url.endsWith("/.well-known/openid-configuration")) return Response.json({ issuer, authorization_endpoint: issuer + "/api/accounts/authorize", token_endpoint: issuer + "/api/accounts/oauth/token", jwks_uri: issuer + "/.well-known/jwks.json", revocation_endpoint: issuer + "/oauth/revoke" });
    if (url.endsWith("/.well-known/jwks.json")) return Response.json({ keys: [jwk] });
    if (url.endsWith("/oauth/revoke")) return new Response(null, { status: options.revokeStatus ?? 200 });
    if (url.endsWith("/oauth/token")) {
      if (body?.get("grant_type") === "refresh_token") {
        refreshCalls++;
        if (options.refreshError) return Response.json({ error: options.refreshError }, { status: 400 });
        return Response.json({ token_type: "Bearer", expires_in: 3600, access_token: "synthetic-renewed", refresh_token: "synthetic-rotated" });
      }
      tokenCalls++;
      if (options.exchangeError) return Response.json({ error: options.exchangeError }, { status: 400 });
      const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: jwk.kid, ...options.header })).toString("base64url");
      const claims = Buffer.from(JSON.stringify({ iss: issuer, sub: "synthetic-subject", aud: options.clientId ?? "oaiapp_synthetic", iat: time / 1000, exp: time / 1000 + 3600, nonce: authorize.searchParams.get("nonce"), email: "synthetic@example.test", ...options.claims })).toString("base64url");
      const content = header + "." + claims;
      const signature = options.badSignature ? "invalid" : sign("RSA-SHA256", Buffer.from(content), privateKey).toString("base64url");
      return Response.json({ id_token: content + "." + signature, ...(options.identityOnly ? {} : { access_token: "synthetic-access", refresh_token: "synthetic-refresh", token_type: options.tokenType ?? "Bearer", expires_in: options.expiresIn ?? 3600, scope: options.scope ?? scope }) });
    }
    if (url.endsWith("/models")) {
      await options.modelGate;
      return Response.json({ models: [{ slug: "hidden-model", display_name: "Hidden", visibility: "hide" }, { slug: "available-model", display_name: "Available Model", visibility: "list" }] });
    }
    throw new Error("Unexpected synthetic endpoint");
  };
  const service = createChatGptService({ fetch: transport, hostId: async () => "urn:uuid:00000000-0000-4000-8000-000000000000", now: () => time });
  async function start(id?: string) {
    const started = await service.start(origin, id);
    authorize = new URL(started.authorizationUrl);
    return { ...started, authorize, callback: new URL(authorize.searchParams.get("redirect_uri")! + "?" + new URLSearchParams({ state: authorize.searchParams.get("state")!, code: "synthetic-code", client_id: options.clientId ?? "oaiapp_synthetic" })) };
  }
  return { service, start, calls, advance: (ms: number) => { time += ms; }, counts: () => ({ tokenCalls, refreshCalls }) };
}

test("local admission requires explicit enablement, exact host/origin and no untrusted proxy inputs", () => {
  const url = origin + "/api/vora/chatgpt";
  const valid = { Host: "localhost:3110", Origin: origin, "Sec-Fetch-Site": "same-origin" };
  expect(() => requireChatGptLocalRequest(new Request(url, { headers: valid }), true, true)).not.toThrow();
  const invalid: [string, Record<string, string>, boolean][] = [
    [url, valid, false], ["https://localhost:3110/api", valid, true], ["http://evil.test/api", { Host: "evil.test", Origin: "http://evil.test" }, true],
    [url, { ...valid, Host: "evil.test" }, true], [url, { ...valid, Origin: "https://evil.test" }, true], [url, { Host: valid.Host }, true],
    [url, { ...valid, "X-Forwarded-Host": "evil.test" }, true], [url, { ...valid, Forwarded: "for=127.0.0.1" }, true],
    [url, { ...valid, "X-Forwarded-For": "198.51.100.1" }, true], [url, { ...valid, "X-Forwarded-For": "127.0.0.1, 127.0.0.1" }, true],
    [url, { ...valid, "X-Forwarded-Proto": "https" }, true], [url, { ...valid, "X-Forwarded-Port": "443" }, true],
    [url, { ...valid, "Sec-Fetch-Site": "cross-site" }, true],
    [url, { ...valid, Host: "127.0.0.1:3111", Origin: "http://127.0.0.1:3111" }, true],
    [url, { ...valid, Host: "localhost:3110@evil.test" }, true],
    [url, { ...valid, Host: "127.0.0.1:3110/" }, true],
    [url, { ...valid, Host: "127.1:3110" }, true],
    [url, { ...valid, Host: "localhost.:3110" }, true],
    [url, { ...valid, Host: "127.0.0.1:3110", "X-Forwarded-Host": "localhost:3110" }, true],
  ];
  for (const [address, headers, enabled] of invalid) expect(() => requireChatGptLocalRequest(new Request(address, { headers }), enabled, true)).toThrow();
  expect(() => requireChatGptLocalRequest(new Request(url, { headers: { ...valid, "X-Forwarded-Host": valid.Host, "X-Forwarded-Proto": "http", "X-Forwarded-For": "127.0.0.1", "X-Forwarded-Port": "3110" } }), true, true)).not.toThrow();
});

test("Next loopback URL normalization preserves the actual external origin and exact callback URI", () => {
  const normalized = "http://localhost:3110/api/vora/chatgpt/callback?state=synthetic-state&error=access_denied";
  const headers = { Host: "127.0.0.1:3110", "X-Forwarded-Host": "127.0.0.1:3110", "X-Forwarded-Port": "3110", "X-Forwarded-Proto": "http", "X-Forwarded-For": "127.0.0.1" };
  expect(requireChatGptLocalRequest(new Request(normalized, { headers }), true).href).toBe(normalized.replace("localhost", "127.0.0.1"));
  expect(requireChatGptLocalRequest(new Request(origin + "/api/vora/chatgpt", { headers: { ...headers, Origin: "http://127.0.0.1:3110" } }), true, true).origin).toBe("http://127.0.0.1:3110");
  expect(() => requireChatGptLocalRequest(new Request(normalized, { headers: { ...headers, Origin: origin } }), true, true)).toThrow();
  expect(() => requireChatGptLocalRequest(new Request("http://evil.test:3110/api", { headers }), true)).toThrow();
});

test("PKCE registration uses official scopes, stable host, exact 127 callback and issued exchange client", async () => {
  const f = fixture();
  const attempt = await f.start();
  expect(attempt.authorize.origin).toBe(issuer);
  expect(attempt.authorize.searchParams.get("client_id")).toBe("dynamic_agent_client");
  expect(attempt.authorize.searchParams.get("agent_name_hint")).toBe("VORA");
  expect(attempt.authorize.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:3110/api/vora/chatgpt/callback");
  expect(attempt.authorize.searchParams.get("code_challenge_method")).toBe("S256");
  expect(attempt.authorize.searchParams.get("scope")).toContain("chatgpt.tokens.use.direct");
  expect(await f.service.callback(attempt.callback)).toEqual({ ok: true, origin });
  const exchanged = f.calls.find(call => call.url.endsWith("/oauth/token"))!.body!;
  expect(exchanged.get("client_id")).toBe("oaiapp_synthetic");
  expect(exchanged.get("redirect_uri")).toBe(attempt.authorize.searchParams.get("redirect_uri"));
  expect(createHash("sha256").update(exchanged.get("code_verifier")!).digest("base64url")).toBe(attempt.authorize.searchParams.get("code_challenge"));
  expect(exchanged.get("resource")).toBe("https://api.openai.com/v1");
  expect(exchanged.has("client_secret")).toBe(false);
  expect(f.service.status(attempt.sessionId, origin)).toMatchObject({ connected: true, planEnabled: true, accountLabel: "synthetic@example.test", models: [{ slug: "available-model", displayName: "Available Model" }] });
  const status = JSON.stringify(f.service.status(attempt.sessionId));
  for (const secret of ["synthetic-access", "synthetic-refresh", "id_token", "nonce"]) expect(status).not.toContain(secret);
  const next = await f.start(attempt.sessionId);
  expect(next.authorize.searchParams.get("client_id")).toBe("oaiapp_synthetic");
  expect(next.authorize.searchParams.has("agent_name_hint")).toBe(false);
  expect(next.authorize.searchParams.get("state")).not.toBe(attempt.authorize.searchParams.get("state"));
  expect(next.authorize.searchParams.get("ext_agent_host_id")).toBe(attempt.authorize.searchParams.get("ext_agent_host_id"));
  next.callback.searchParams.delete("client_id");
  expect(await f.service.callback(next.callback)).toMatchObject({ ok: true });
});

test("state is one-time, session-isolated, expires, and cannot be replaced by forged cookies or callbacks", async () => {
  const f = fixture(); const first = await f.start();
  const wrong = new URL(first.callback); wrong.searchParams.set("state", "unknown");
  expect(await f.service.callback(wrong)).toMatchObject({ ok: false, diagnostic: { phase: "callback", code: "STATE_UNKNOWN_OR_EXPIRED" } });
  const wrongHost = new URL(first.callback); wrongHost.hostname = "localhost";
  expect(await f.service.callback(wrongHost)).toMatchObject({ ok: false, diagnostic: { phase: "callback", code: "REDIRECT_MISMATCH" } });
  expect(await f.service.callback(first.callback)).toMatchObject({ ok: true });
  expect(await f.service.callback(first.callback)).toMatchObject({ ok: false });
  expect(f.counts().tokenCalls).toBe(1);
  expect(f.service.status(undefined, origin).connected).toBe(false);
  expect(f.service.status(first.sessionId, "http://127.0.0.1:3110").connected).toBe(false);
  const other = await f.start();
  expect(other.sessionId).not.toBe(first.sessionId);
  expect(f.service.status(other.sessionId, origin).connected).toBe(false);
  await expect(f.service.inference(other.sessionId, origin)).rejects.toHaveProperty("code", "CHATGPT_SIGN_IN");
  f.advance(300_001);
  expect(await f.service.callback(other.callback)).toMatchObject({ ok: false });
  expect(f.service.status(other.sessionId).reason).toContain("abgelaufen");
  const cookie = chatGptSessionCookie(first.sessionId);
  expect(cookie).toContain("HttpOnly; SameSite=Strict");
  expect(chatGptSessionId(new Request(origin, { headers: { Cookie: cookie } }))).toBe(first.sessionId);
  expect(chatGptSessionId(new Request(origin, { headers: { Cookie: `${CHATGPT_COOKIE}=forged` } }))).toBeUndefined();
  expect(chatGptSessionId(new Request(origin, { headers: { Cookie: `${cookie}; ${cookie}` } }))).toBeUndefined();
});

test("denial, missing issued client and client mismatch stop exchange without overwriting an account", async () => {
  const f = fixture(); let attempt = await f.start();
  attempt.callback.searchParams.set("error", "access_denied");
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
  expect(f.counts().tokenCalls).toBe(0);
  attempt = await f.start(attempt.sessionId); attempt.callback.searchParams.delete("client_id");
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
  expect(f.counts().tokenCalls).toBe(0);
  attempt = await f.start(attempt.sessionId); await f.service.callback(attempt.callback);
  attempt = await f.start(attempt.sessionId); attempt.callback.searchParams.set("client_id", "oaiapp_other");
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
  expect(f.counts().tokenCalls).toBe(1);
  expect(f.service.status(attempt.sessionId).connected).toBe(true);
});

test("JWT signature, algorithm, issuer, audience, expiry, nonce and subject are validated", async () => {
  const invalid = [
    { badSignature: true }, { header: { alg: "none" } }, { header: { kid: "untrusted-key" } }, { header: { crit: ["custom"] } },
    { claims: { iss: "https://evil.test" } }, { claims: { aud: "oaiapp_other" } }, { claims: { aud: ["oaiapp_synthetic", "other"] } },
    { claims: { azp: "other" } }, { claims: { exp: 1 } }, { claims: { iat: Date.now() / 1000 + 3600 } },
    { claims: { nonce: "wrong-nonce" } }, { claims: { sub: "" } }, { claims: { nbf: Date.now() / 1000 + 3600 } },
  ];
  for (const options of invalid) {
    const f = fixture(options); const attempt = await f.start();
    expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
    expect(f.service.status(attempt.sessionId).connected).toBe(false);
    expect(f.calls.some(call => call.url.endsWith("/models"))).toBe(false);
  }
});

test("identity-only and reduced grants retain identity without allowing plan inference", async () => {
  for (const options of [{ identityOnly: true }, { scope: "openid profile email" }, { scope: "openid chatgpt.tokens.use.direct" }]) {
    const f = fixture(options); const attempt = await f.start();
    expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: true });
    expect(f.service.status(attempt.sessionId)).toMatchObject({ connected: true, planEnabled: false });
    expect(f.calls.some(call => call.url.endsWith("/models"))).toBe(false);
    await expect(f.service.inference(attempt.sessionId, origin)).rejects.toHaveProperty("code", "CHATGPT_PLAN_DISABLED");
    const retry = await f.start(attempt.sessionId);
    expect(f.service.status(retry.sessionId)).toMatchObject({ connected: true, pending: true });
    f.service.cancel(retry.sessionId, origin);
    expect(f.service.status(retry.sessionId)).toMatchObject({ connected: true, pending: false });
  }
});

test("cancel and disconnect prevent a late callback from installing credentials", async () => {
  let release!: () => void;
  const modelGate = new Promise<void>(resolve => { release = resolve; });
  const f = fixture({ modelGate }); const attempt = await f.start();
  const callback = f.service.callback(attempt.callback);
  await expect.poll(() => f.calls.some(call => call.url.endsWith("/models"))).toBe(true);
  f.service.cancel(attempt.sessionId, origin);
  release();
  expect(await callback).toMatchObject({ ok: false });
  expect(f.service.status(attempt.sessionId).connected).toBe(false);
  const next = await f.start(attempt.sessionId);
  await f.service.disconnect(next.sessionId, origin);
  expect(await f.service.callback(next.callback)).toMatchObject({ ok: false });
});

test("expired access refreshes once per session, rotates atomically and revokes latest refresh token", async () => {
  const f = fixture(); const attempt = await f.start(); await f.service.callback(attempt.callback);
  const before = await f.service.inference(attempt.sessionId, origin);
  f.advance(3_580_000);
  const results = await Promise.all([f.service.inference(attempt.sessionId, origin), f.service.inference(attempt.sessionId, origin)]);
  expect(f.counts().refreshCalls).toBe(1);
  expect(results.map(result => result.accessToken)).toEqual(["synthetic-renewed", "synthetic-renewed"]);
  const refresh = f.calls.find(call => call.body?.get("grant_type") === "refresh_token")!.body!;
  expect(refresh.get("client_id")).toBe("oaiapp_synthetic"); expect(refresh.has("scope")).toBe(false);
  expect(await f.service.disconnect(attempt.sessionId, origin)).toMatchObject({ connected: false });
  expect(before.signal.aborted).toBe(true);
  expect(f.calls.find(call => call.url.endsWith("/oauth/revoke"))!.body!.get("token")).toBe("synthetic-rotated");
  expect((await f.start(attempt.sessionId)).authorize.searchParams.get("client_id")).toBe("oaiapp_synthetic");
});

test("terminal refresh clears unusable tokens; failed revocation is explicit", async () => {
  const f = fixture({ refreshError: "invalid_grant" }); const attempt = await f.start(); await f.service.callback(attempt.callback);
  f.advance(3_580_000);
  await expect(f.service.inference(attempt.sessionId, origin)).rejects.toHaveProperty("code", "CHATGPT_REAUTH");
  expect(f.service.status(attempt.sessionId).connected).toBe(false);
  const broken = fixture({ revokeStatus: 503 }); const other = await broken.start(); await broken.service.callback(other.callback);
  expect(await broken.service.disconnect(other.sessionId, origin)).toMatchObject({ connected: false, reason: expect.stringContaining("nicht bestätigt") });
});

test("expired authorization code is never replayed and fresh OAuth retains its issued client", async () => {
  const f = fixture({ exchangeError: "invalid_grant" }); const attempt = await f.start();
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
  expect(f.service.status(attempt.sessionId).connected).toBe(false);
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: false });
  expect(f.counts().tokenCalls).toBe(1);
  const retry = await f.start(attempt.sessionId);
  expect(retry.authorize.searchParams.get("client_id")).toBe("oaiapp_synthetic");
  expect(retry.authorize.searchParams.get("state")).not.toBe(attempt.authorize.searchParams.get("state"));
});

test("opaque issued clients and case-insensitive bearer type retain full audience validation", async () => {
  const f = fixture({ clientId: "issued-client.synthetic:1", tokenType: "bearer" }); const attempt = await f.start();
  expect(await f.service.callback(attempt.callback)).toMatchObject({ ok: true });
  expect(f.service.status(attempt.sessionId)).toMatchObject({ connected: true, planEnabled: true });
  const next = await f.start(attempt.sessionId);
  expect(next.authorize.searchParams.get("client_id")).toBe("issued-client.synthetic:1");
  const wrong = fixture({ clientId: "issued-client.synthetic:1", claims: { aud: "other-client" } }); const rejected = await wrong.start();
  expect(await wrong.service.callback(rejected.callback)).toMatchObject({ ok: false, diagnostic: { phase: "identity", code: "AUDIENCE_MISMATCH" } });
  const placeholder = fixture({ clientId: "dynamic_agent_client" }); const invalid = await placeholder.start();
  expect(await placeholder.service.callback(invalid.callback)).toMatchObject({ ok: false, diagnostic: { phase: "callback", code: "CLIENT_ID_FORMAT" } });
  expect(placeholder.counts().tokenCalls).toBe(0);
});

test("failure diagnostics isolate stages without disclosing credentials, identity or arbitrary provider data", async () => {
  const cases = [
    { options: { exchangeError: "invalid_grant" }, phase: "exchange", code: "OAUTH_INVALID_GRANT" },
    { options: { exchangeError: "secret-provider-value" }, phase: "exchange", code: "OAUTH_EXCHANGE_REJECTED" },
    { options: { claims: { nonce: "private-nonce-value" } }, phase: "identity", code: "NONCE_MISMATCH" },
    { options: { expiresIn: -1 }, phase: "credentials", code: "TOKEN_EXPIRY_INVALID" },
  ];
  for (const { options, phase, code } of cases) {
    const f = fixture(options); const attempt = await f.start();
    const result = await f.service.callback(attempt.callback);
    expect(result).toMatchObject({ ok: false, diagnostic: { phase, code } });
    expect(f.service.status(attempt.sessionId)).toMatchObject({ connected: false, pending: false, diagnostic: { phase, code } });
    const safe = JSON.stringify({ result, status: f.service.status(attempt.sessionId) });
    for (const value of ["synthetic-code", "synthetic-access", "synthetic-refresh", "synthetic@example.test", "secret-provider-value", "private-nonce-value", attempt.authorize.searchParams.get("state")!]) expect(safe).not.toContain(value);
  }
  const f = fixture(); const attempt = await f.start(); f.service.cancel(attempt.sessionId, origin);
  expect(f.service.status(attempt.sessionId).diagnostic).toEqual({ phase: "callback", code: "ATTEMPT_CANCELLED" });
  const retry = await f.start(attempt.sessionId);
  expect(f.service.status(retry.sessionId).diagnostic).toBeUndefined();
});
