import { expect, test } from "@playwright/test";

// Opt in against an already running, enabled, loopback-bound production preview.
// Native fetch avoids retaining OAuth state/cookies in Playwright request traces.
const target = process.env.VORA_CHATGPT_INTEGRATION_ORIGIN;
test("real Next routes consume denied 127 callbacks for both loopback page origins", async () => {
  test.skip(!target, "Set VORA_CHATGPT_INTEGRATION_ORIGIN to the enabled local production preview.");
  const base = new URL(target!);
  expect(base.protocol).toBe("http:");
  expect(["localhost", "127.0.0.1"].includes(base.hostname)).toBe(true);
  for (const hostname of ["localhost", "127.0.0.1"]) {
    base.hostname = hostname;
    const origin = base.origin;
    const statusUrl = origin + "/api/vora/chatgpt";
    const available = await fetch(statusUrl, { redirect: "error" });
    expect((await available.json()).available).toBe(true);
    const start = await fetch(statusUrl, { method: "POST", redirect: "error", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ action: "start" }) });
    expect(start.status).toBe(200);
    const cookie = start.headers.get("set-cookie")?.split(";")[0];
    expect(Boolean(cookie)).toBe(true);
    const auth = new URL((await start.json()).authorizationUrl);
    const callback = new URL(auth.searchParams.get("redirect_uri")!);
    expect(callback.hostname).toBe("127.0.0.1");
    callback.searchParams.set("state", auth.searchParams.get("state")!);
    callback.searchParams.set("error", "access_denied");
    const pending = await fetch(statusUrl, { headers: { Cookie: cookie! }, redirect: "error" });
    expect((await pending.json()).pending).toBe(true);
    // No authorization code is supplied and no OpenAI endpoint is contacted.
    const denied = await fetch(callback, { redirect: "error" });
    expect(denied.status).toBe(400);
    const finished = await fetch(statusUrl, { headers: { Cookie: cookie! }, redirect: "error" });
    const result = await finished.json();
    expect(result.pending).toBe(false);
    expect(result.connected).toBe(false);
    expect(result.reason).toContain("abgebrochen");
    const replay = await fetch(callback, { redirect: "error" });
    expect(replay.status).toBe(400);
    const inference = await fetch(origin + "/api/vora/assistant", { method: "POST", redirect: "error", headers: { Origin: origin, Cookie: cookie!, "Content-Type": "application/json" }, body: JSON.stringify({ provider: "chatgpt", consent: true, locale: "de", context: { area: "documents" }, messages: [{ role: "user", content: "Synthetic boundary check" }] }) });
    // A denied sign-in must reach the missing-session check, never a false-origin
    // rejection or any upstream inference/API-key fallback.
    expect(inference.status).toBe(401);
    expect((await inference.json()).code).toBe("CHATGPT_SIGN_IN");
  }
});
