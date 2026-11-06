import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type TestInfo } from "@playwright/test";
import type { CareAction, CareRole, CareSnapshot } from "../lib/care/types";

// These exercise the running Next server and its explicitly public synthetic
// sessions. They do not establish Supabase RLS, real identities or hardware behavior.
function origin(testInfo: TestInfo): string {
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string") throw new Error("A configured Playwright baseURL is required.");
  return new URL(baseURL).origin;
}

function endpoint(path: string, demoId: string, role: CareRole = "owner"): string {
  return path + "?" + new URLSearchParams({ demo: demoId, role }).toString();
}

async function newRun(request: APIRequestContext, testInfo: TestInfo): Promise<string> {
  const response = await request.post("/api/demo", { headers: { Origin: origin(testInfo) }, data: {} });
  expect(response.status()).toBe(201);
  const body: { demoId: string } = await response.json();
  expect(body.demoId).toMatch(/^[0-9a-f-]{36}$/);
  return body.demoId;
}

async function snapshot(request: APIRequestContext, demoId: string, role: CareRole = "owner"): Promise<CareSnapshot> {
  const response = await request.get(endpoint("/api/care", demoId, role));
  expect(response.status()).toBe(200);
  const body: CareSnapshot = await response.json();
  expect(body.mode).toBe("demo");
  expect(body.actor.role).toBe(role);
  return body;
}

function action(request: APIRequestContext, testInfo: TestInfo, demoId: string, body: CareAction, role: CareRole = "owner") {
  return request.post(endpoint("/api/care/actions", demoId, role), {
    headers: { Origin: origin(testInfo) }, data: body,
  });
}

function scan(request: APIRequestContext, testInfo: TestInfo, demoId: string, card: string, requestId = randomUUID(), role: CareRole = "owner") {
  return request.post(endpoint("/api/scan", demoId, role), {
    headers: { Origin: origin(testInfo) }, data: { card, requestId },
  });
}

test("scan keeps unknown cards unmapped and deduplicates an actor's repeated request", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const before = await snapshot(request, demoId);
  const clinicBefore = await snapshot(request, demoId, "clinic");
  const nextDocument = before.documents.find(document => document.current && document.version === 2);
  expect(nextDocument).toBeDefined();
  expect(clinicBefore.documents.map(document => document.id)).not.toContain(nextDocument!.id);

  const getScan = await request.get(endpoint("/api/scan", demoId) + "&card=" + before.card.id);
  expect(getScan.status()).toBe(405);
  expect(getScan.headers().allow).toBe("POST");
  const unknown = await scan(request, testInfo, demoId, "unknown-card");
  expect(unknown.status()).toBe(404);
  expect(await snapshot(request, demoId)).toEqual(before);

  const requestId = randomUUID();
  const first = await scan(request, testInfo, demoId, before.card.id, requestId);
  expect(first.status()).toBe(200);
  const firstResult: { handoffId: string; duplicate: boolean } = await first.json();
  expect(firstResult.duplicate).toBe(false);
  const repeated = await scan(request, testInfo, demoId, before.card.id, requestId);
  expect(repeated.status()).toBe(200);
  expect(await repeated.json()).toMatchObject({ handoffId: firstResult.handoffId, duplicate: true });

  const conflicting = await action(request, testInfo, demoId, {
    type: "handoff", documentIds: [nextDocument!.id], recipientId: before.clinic.id, requestId,
  });
  expect(conflicting.status()).toBe(409);
  expect(await conflicting.json()).toMatchObject({ code: "REQUEST_CONFLICT" });

  const ownerAfter = await snapshot(request, demoId);
  const clinicAfter = await snapshot(request, demoId, "clinic");
  expect(ownerAfter.handoffs).toHaveLength(1);
  expect(clinicAfter.handoffs).toEqual(ownerAfter.handoffs);
  expect(clinicAfter.documents.map(document => document.id)).toContain(nextDocument!.id);
  expect(clinicAfter.recordDocumentIds).not.toContain(nextDocument!.id);
  expect(ownerAfter.handoffs[0]).toMatchObject({ id: firstResult.handoffId, status: "received", source: "card", revision: 1 });
});

test("only the clinic confirms the record, and card revocation preserves an accepted version", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const before = await snapshot(request, demoId);
  const nextDocument = before.documents.find(document => document.current && document.version === 2)!;
  expect(nextDocument).toBeDefined();
  const submitted = await action(request, testInfo, demoId, {
    type: "handoff", documentIds: [nextDocument.id], recipientId: before.clinic.id, requestId: randomUUID(),
  });
  expect(submitted.status()).toBe(200);
  const handoff = (await submitted.json() as CareSnapshot).handoffs[0];

  const ownerAccept = await action(request, testInfo, demoId, {
    type: "accept", handoffId: handoff.id, expectedRevision: handoff.revision,
  });
  expect(ownerAccept.status()).toBe(403);
  expect((await snapshot(request, demoId)).recordDocumentIds).toEqual(before.recordDocumentIds);

  const accepted = await action(request, testInfo, demoId, {
    type: "accept", handoffId: handoff.id, expectedRevision: handoff.revision,
  }, "clinic");
  expect(accepted.status()).toBe(200);
  const clinicState = await accepted.json() as CareSnapshot;
  expect(clinicState.handoffs[0]).toMatchObject({ id: handoff.id, status: "accepted", revision: 2 });
  expect(clinicState.handoffs[0].acceptedAt).toBeTruthy();
  expect(clinicState.recordDocumentIds).toContain(nextDocument.id);
  expect(clinicState.recordDocumentIds).toEqual(expect.arrayContaining(before.recordDocumentIds));
  expect(new Set(clinicState.recordDocumentIds).size).toBe(clinicState.recordDocumentIds.length);

  const lateWithdraw = await action(request, testInfo, demoId, {
    type: "withdraw", handoffId: handoff.id, expectedRevision: 2,
  });
  expect(lateWithdraw.status()).toBe(409);
  const revoked = await action(request, testInfo, demoId, { type: "card-status", active: false });
  expect(revoked.status()).toBe(200);
  const rejectedScan = await scan(request, testInfo, demoId, before.card.id);
  expect(rejectedScan.status()).toBe(403);
  expect(await rejectedScan.json()).toMatchObject({ code: "CARD_REVOKED" });
  const after = await snapshot(request, demoId, "clinic");
  expect(after.card.active).toBe(false);
  expect(after.recordDocumentIds).toEqual(clinicState.recordDocumentIds);
  expect(after.handoffs).toHaveLength(1);
  expect(after.handoffs[0].status).toBe("accepted");
});

test("clarification and owner reply preserve both texts and reject a stale revision", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const initial = await snapshot(request, demoId);
  const scanned = await scan(request, testInfo, demoId, initial.card.id);
  expect(scanned.status()).toBe(200);
  const { handoffId } = await scanned.json() as { handoffId: string };
  const question = "Bitte die neue Fassung für diesen Aufenthalt bestätigen.";
  const answer = "Die neue Fassung soll für den geplanten Aufenthalt bereitgestellt werden.";

  const clarified = await action(request, testInfo, demoId, {
    type: "clarify", handoffId, expectedRevision: 1, note: question,
  }, "clinic");
  expect(clarified.status()).toBe(200);
  const clarification = await clarified.json() as CareSnapshot;
  expect(clarification.handoffs[0]).toMatchObject({ status: "clarification", revision: 2, note: question });
  expect(clarification.recordDocumentIds).toEqual(initial.recordDocumentIds);

  const staleReply = await action(request, testInfo, demoId, {
    type: "reply", handoffId, expectedRevision: 1, note: answer,
  });
  expect(staleReply.status()).toBe(409);
  const reply = await action(request, testInfo, demoId, {
    type: "reply", handoffId, expectedRevision: 2, note: answer,
  });
  expect(reply.status()).toBe(200);
  const replied = await reply.json() as CareSnapshot;
  expect(replied.handoffs[0]).toMatchObject({ status: "received", revision: 3, note: answer });
  expect(replied.handoffs[0].events.map(event => event.label).join("\n")).toContain(question);
  expect(replied.handoffs[0].events.map(event => event.label).join("\n")).toContain(answer);

  const staleAccept = await action(request, testInfo, demoId, {
    type: "accept", handoffId, expectedRevision: 2,
  }, "clinic");
  expect(staleAccept.status()).toBe(409);
  expect(await staleAccept.json()).toMatchObject({ code: "STALE_REVISION" });
  const accepted = await action(request, testInfo, demoId, {
    type: "accept", handoffId, expectedRevision: 3,
  }, "clinic");
  expect(accepted.status()).toBe(200);
  const completed = await accepted.json() as CareSnapshot;
  expect(completed.handoffs[0].status).toBe("accepted");
  const history = completed.handoffs[0].events.map(event => event.label).join("\n");
  expect(history).toContain(question);
  expect(history).toContain(answer);
});

test("withdrawal removes pending visibility and request replay cannot silently recreate the handoff", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const initial = await snapshot(request, demoId);
  const nextDocument = initial.documents.find(document => document.current && document.version === 2)!;
  const submission: CareAction = {
    type: "handoff", documentIds: [nextDocument.id], recipientId: initial.clinic.id, requestId: randomUUID(),
  };
  const sent = await action(request, testInfo, demoId, submission);
  expect(sent.status()).toBe(200);
  const original = (await sent.json() as CareSnapshot).handoffs[0];
  expect((await snapshot(request, demoId, "clinic")).documents.map(document => document.id)).toContain(nextDocument.id);

  const withdrawn = await action(request, testInfo, demoId, {
    type: "withdraw", handoffId: original.id, expectedRevision: original.revision,
  });
  expect(withdrawn.status()).toBe(200);
  const replay = await action(request, testInfo, demoId, submission);
  expect(replay.status()).toBe(200);
  const afterReplay = await snapshot(request, demoId, "clinic");
  expect(afterReplay.handoffs).toHaveLength(1);
  expect(afterReplay.handoffs[0]).toMatchObject({ id: original.id, status: "withdrawn", revision: 2 });
  expect(afterReplay.documents.map(document => document.id)).not.toContain(nextDocument.id);
  expect(afterReplay.recordDocumentIds).toEqual(initial.recordDocumentIds);

  const deliberateNew = await action(request, testInfo, demoId, { ...submission, requestId: randomUUID() });
  expect(deliberateNew.status()).toBe(200);
  const afterNew = await deliberateNew.json() as CareSnapshot;
  expect(afterNew.handoffs).toHaveLength(2);
  expect(afterNew.handoffs[0].id).not.toBe(original.id);
  expect(afterNew.handoffs[0].status).toBe("received");
});

test("request boundaries reject cross-site writes and malformed demo contexts without a cloud fallback", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const before = await snapshot(request, demoId);
  const crossSite = await request.post(endpoint("/api/scan", demoId), {
    headers: { Origin: "https://unrelated.example" },
    data: { card: before.card.id, requestId: randomUUID() },
  });
  expect(crossSite.status()).toBe(403);
  const oversized = await request.post(endpoint("/api/scan", demoId), {
    headers: { Origin: origin(testInfo), "Content-Type": "application/json" },
    data: JSON.stringify({ padding: "ä".repeat(5000) }),
  });
  expect(oversized.status()).toBe(413);
  const badJson = await request.post(endpoint("/api/scan", demoId), {
    headers: { Origin: origin(testInfo), "Content-Type": "application/json" }, data: "{broken",
  });
  expect(badJson.status()).toBe(400);
  expect((await request.get("/api/care?demo=invalid&role=owner")).status()).toBe(400);
  expect((await request.get("/api/care?demo=" + demoId + "&role=admin")).status()).toBe(400);
  expect((await request.get("/api/care?demo=" + randomUUID() + "&role=owner")).status()).toBe(410);
  expect(await snapshot(request, demoId)).toEqual(before);

  const auth = await request.get("/api/auth");
  const authState = await auth.json() as { configured: boolean; authenticated: boolean };
  expect(typeof authState.configured).toBe("boolean");
  expect(authState.authenticated).toBe(false);
  if (!authState.configured) expect(auth.status()).toBe(200);
  const privateCare = await request.get("/api/care");
  expect([401, 503]).toContain(privateCare.status());
  expect(await privateCare.json()).not.toHaveProperty("mode", "demo");
  const privateDocument = await request.get("/api/care/documents/" + before.documents[0].id + "?demo=" + demoId);
  expect([401, 503]).toContain(privateDocument.status());
});

test("guided assistant returns exact permitted evidence and cannot alter a handoff", async ({ request }, testInfo) => {
  const demoId = await newRun(request, testInfo);
  const before = await snapshot(request, demoId);
  const selected = before.documents.find(document => document.current && document.version === 2)!;
  expect(selected).toBeDefined();
  const answer = await request.post(endpoint("/api/assistant", demoId), {
    headers: { Origin: origin(testInfo) }, data: { question: "evidence", documentId: selected.id },
  });
  expect(answer.status()).toBe(200);
  const body = await answer.json() as {
    answer: string; mode: string; sources: { documentId: string; page: number; quote: string; label: string }[];
  };
  expect(body.mode).toBe("guided");
  expect(body.answer.trim().length).toBeGreaterThan(0);
  expect(body.sources.length).toBeGreaterThan(0);
  for (const source of body.sources) {
    expect(source.documentId).toBe(selected.id);
    expect(selected.evidence.some(evidence => evidence.page === source.page && evidence.quote === source.quote)).toBe(true);
  }
  const foreign = await request.post(endpoint("/api/assistant", demoId), {
    headers: { Origin: origin(testInfo) }, data: { question: "evidence", documentId: "26004179-vorsorge-v1" },
  });
  expect(foreign.status()).toBe(403);
  const receipt = await request.post(endpoint("/api/assistant", demoId), {
    headers: { Origin: origin(testInfo) }, data: { question: "receipt" },
  });
  expect(receipt.status()).toBe(200);
  expect(await snapshot(request, demoId)).toEqual(before);
});
