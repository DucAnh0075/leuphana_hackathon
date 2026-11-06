import { test, expect } from "@playwright/test";
import { DOCUMENTS, STORAGE_KEY, emptyWorkspace } from "../lib/vora";

test("document continuation restores the URL cursor and the avatar uses only the current public block", async ({ page }) => {
  const workspace = emptyWorkspace(); workspace.selected = ["power"];
  workspace.answers["power:person"] = { value: "", note: "SYNTHETIC_PRIVATE_TRUSTED_PERSON", reviewed: true };
  const sent: Array<{ context: { area: string; documentTitle?: string; moduleTitle?: string } }> = [];
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.route("**/api/vora/chatgpt", route => route.fulfill({ json: { available: true, connected: true, planEnabled: true, pending: false, accountLabel: "Synthetic account", models: [{ slug: "test-model", displayName: "Test model" }] } }));
  await page.route("**/api/vora/assistant", route => { sent.push(route.request().postDataJSON()); return route.fulfill({ json: { mode: "live", sources: [], message: "Synthetic public context answer." } }); });
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await page.goto("/vorsorge");
  await page.getByRole("button", { name: "Continue document", exact: false }).click();
  await expect(page.getByRole("heading", { name: "Health & care decisions", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Document blocks", exact: true }).getByRole("button", { name: /Medical records & confidentiality/ }).click();
  await expect(page).toHaveURL(url => url.searchParams.get("phase") === "blocks" && url.searchParams.get("block") === "records");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Medical records & confidentiality", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ask VORA", exact: true }).click();
  const assistant = page.getByRole("region", { name: "VORA assistant", exact: true });
  await assistant.getByRole("checkbox").check();
  await assistant.getByRole("textbox", { name: "Your question", exact: true }).fill("Explain the current block.");
  await assistant.getByRole("button", { name: "Send", exact: true }).click();
  await expect(assistant.getByText("Synthetic public context answer.", { exact: true })).toBeVisible();
  expect(sent[0].context).toEqual({ area: "documents", documentTitle: "Vorsorgevollmacht", moduleTitle: "Medical records & confidentiality" });
  expect(JSON.stringify(sent)).not.toContain("SYNTHETIC_PRIVATE_TRUSTED_PERSON");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Review your notes", exact: false }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Prepare official document", exact: false })).toBeVisible();
  await expect(page).toHaveURL(url => url.searchParams.get("phase") === "review" && !url.searchParams.has("block"));
  await page.getByRole("button", { name: "Prepare & keep", exact: false }).click();
  await page.reload();
  await expect(page.getByRole("link", { name: "Open official form", exact: false })).toBeVisible();
  await navigation.getByRole("button", { name: "Health pass", exact: true }).click();
  await expect(page).toHaveURL(url => url.searchParams.get("area") === "vaccinations" && !url.searchParams.has("doc") && !url.searchParams.has("phase") && !url.searchParams.has("block"));
  await navigation.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Continue document", exact: false }).click();
  await expect(page.getByRole("heading", { name: "Health & care decisions", exact: true })).toBeVisible();
});

test("the overview review action opens review and invalid cursor parameters are bounded", async ({ page }) => {
  const workspace = emptyWorkspace(); workspace.selected = ["guardian"]; workspace.profile.birthYear = "1990";
  for (const block of DOCUMENTS.find(doc => doc.id === "guardian")!.modules) workspace.answers[`guardian:${block.id}`] = { value: "", note: "Synthetic reviewed preparation", reviewed: true };
  await page.addInitScript(({ key, value }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: STORAGE_KEY, value: JSON.stringify(workspace) });
  await page.goto("/vorsorge");
  await page.getByRole("button", { name: "Review documents", exact: false }).click();
  await expect(page.getByRole("button", { name: "Prepare official document", exact: false })).toBeVisible();
  await expect(page).toHaveURL(url => url.searchParams.get("phase") === "review" && url.searchParams.get("doc") === "guardian");
  await page.goto("/vorsorge?area=documents&doc=guardian&phase=unknown&block=not-a-real-block");
  await expect(page.getByRole("heading", { name: "Your preferred guardian", exact: true })).toBeVisible();
  await expect(page).toHaveURL(url => url.searchParams.get("phase") === "blocks" && url.searchParams.get("block") === "preferred");
});

test("the floating avatar opens an ephemeral chat and never silently chooses API billing", async ({ page }, testInfo) => {
  let checks = 0;
  const requests: Array<{ provider: string; messages: unknown[] }> = [];
  await page.route("**/api/vora/chatgpt", route => { checks++; return route.fulfill({ json: { available: true, connected: true, planEnabled: true, pending: false, accountLabel: "Synthetic account", models: [{ slug: "test-model", displayName: "Test model" }] } }); });
  await page.route("**/api/vora/assistant", route => {
    const input = route.request().postDataJSON(); requests.push(input);
    return route.fulfill({ status: input.provider === "chatgpt" ? 503 : 200, json: input.provider === "chatgpt"
      ? { code: "AI_UNAVAILABLE", mode: "unavailable", error: "Synthetic plan failure" }
      : { message: "Synthetic explicitly selected API response.", mode: "live", sources: [] } });
  });
  await page.goto("/vorsorge");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(checks).toBe(0);
  const avatar = page.getByRole("button", { name: "Ask VORA", exact: true });
  await expect(avatar).toHaveCount(1);
  await expect(avatar.locator("svg")).toBeVisible();
  const bounds = await avatar.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await avatar.focus(); await page.keyboard.press("Enter");
  const chat = page.getByRole("region", { name: "VORA assistant", exact: true });
  await expect(chat.getByText("Temporary chat · clears on close", { exact: true })).toBeVisible();
  await expect(chat.getByText("ChatGPT connected", { exact: true })).toBeVisible();
  await chat.getByRole("textbox", { name: "Your question", exact: true }).fill("SYNTHETIC_TEMPORARY_QUESTION");
  await expect(chat.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  await chat.getByRole("checkbox").check();
  await chat.getByRole("button", { name: "Send", exact: true }).click();
  await expect(chat.getByRole("alert")).toContainText("Synthetic plan failure");
  expect(requests).toHaveLength(1);
  expect(requests[0].provider).toBe("chatgpt");
  await chat.locator("summary").filter({ hasText: "ChatGPT connected" }).click();
  await expect(chat.getByRole("combobox", { name: "Use assistant with", exact: true })).toHaveValue("chatgpt");
  await chat.getByRole("combobox", { name: "Use assistant with", exact: true }).selectOption("apiKey");
  await expect(chat.getByText("separate API billing", { exact: false })).toBeVisible();
  expect(requests).toHaveLength(1);
  await chat.getByRole("button", { name: "Retry question", exact: true }).click();
  await expect(chat.getByText("Synthetic explicitly selected API response.", { exact: true })).toBeVisible();
  expect(requests[1].provider).toBe("apiKey");
  await testInfo.attach("temporary-avatar-chat", { body: await page.screenshot(), contentType: "image/png" });
  await page.keyboard.press("Escape");
  await expect(avatar).toBeFocused();
  await avatar.click();
  await expect(chat.getByRole("textbox", { name: "Your question", exact: true })).toHaveValue("");
  await expect(chat.getByText("SYNTHETIC_TEMPORARY_QUESTION", { exact: true })).toHaveCount(0);
  await expect(chat.getByRole("checkbox")).not.toBeChecked();
  const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage).not.toContain("SYNTHETIC_TEMPORARY_QUESTION");
});

test("ChatGPT reauthorization waits for new consent rather than closing an identity-only session", async ({ page, context }) => {
  let pending = false, enabled = false, starts = 0, pendingChecks = 0;
  await context.route("https://auth.openai.com/api/accounts/authorize**", route => route.fulfill({ contentType: "text/html", body: "<h1>Synthetic OAuth consent window</h1>" }));
  await page.route("**/api/vora/chatgpt", route => {
    if (route.request().method() === "POST") {
      const action = route.request().postDataJSON().action;
      if (action === "start") { starts++; pending = true; return route.fulfill({ json: { authorizationUrl: "https://auth.openai.com/api/accounts/authorize?synthetic_fixture=1" } }); }
      pending = false;
    }
    if (pending) pendingChecks++;
    return route.fulfill({ json: { available: true, connected: true, planEnabled: enabled, pending, accountLabel: "Synthetic identity-only account", models: enabled ? [{ slug: "test-model", displayName: "Test model" }] : [] } });
  });
  await page.goto("/vorsorge");
  await page.getByRole("button", { name: "Ask VORA", exact: true }).click();
  const chat = page.getByRole("region", { name: "VORA assistant", exact: true });
  await expect(chat.getByText("ChatGPT plan unavailable", { exact: true })).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await chat.getByRole("button", { name: "Continue with ChatGPT", exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole("heading", { name: "Synthetic OAuth consent window" })).toBeVisible();
  await expect.poll(() => pendingChecks).toBeGreaterThan(0);
  expect(popup.isClosed()).toBe(false);
  await expect(chat.getByText("Complete sign-in in the opened window.", { exact: true })).toBeVisible();
  await expect(chat.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  pending = false; enabled = true;
  await expect(chat.getByText("ChatGPT connected", { exact: true })).toBeVisible();
  await expect.poll(() => popup.isClosed()).toBe(true);
  expect(starts).toBe(1);
  await expect(chat.getByRole("checkbox")).not.toBeChecked();
});

test("a hosted deployment does not offer a local ChatGPT login or silently use an API key", async ({ page }) => {
  const sends: string[] = [];
  await page.route("**/api/vora/chatgpt", route => route.fulfill({ json: { available: false, connected: false, planEnabled: false, pending: false, reason: "Local ChatGPT connection is unavailable on this deployment." } }));
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/vora/assistant") sends.push(request.url()); });
  await page.goto("/vorsorge");
  await page.getByRole("button", { name: "Ask VORA", exact: true }).click();
  const chat = page.getByRole("region", { name: "VORA assistant", exact: true });
  await expect(chat.getByRole("button", { name: "Continue with ChatGPT", exact: true })).toBeDisabled();
  await expect(chat.getByText("Local ChatGPT connection is unavailable on this deployment.", { exact: true })).toBeVisible();
  await chat.getByRole("checkbox").check();
  await chat.getByRole("textbox", { name: "Your question", exact: true }).fill("Synthetic question while disconnected");
  await expect(chat.getByRole("button", { name: "Send", exact: true })).toBeDisabled();
  expect(sends).toEqual([]);
});
