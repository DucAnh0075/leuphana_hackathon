import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createChatGptService } from "./vora-chatgpt";

async function hostId(): Promise<string> {
  // Only an opaque installation identifier is persisted. Never tokens or account data.
  const directory = path.join(process.cwd(), ".vora-runtime");
  const file = path.join(directory, "chatgpt-host.json");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  try {
    await writeFile(file, JSON.stringify({ hostId: "urn:uuid:" + randomUUID() }) + "\n", { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
  }
  const text = await readFile(file, "utf8");
  if (text.length > 256) throw new Error("Invalid local host identifier");
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || !("hostId" in value) || typeof value.hostId !== "string" || !/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.hostId)) throw new Error("Invalid local host identifier");
  return value.hostId;
}

// Next route bundles share this process-local store; no credential is global to all users.
const runtime = globalThis as typeof globalThis & { voraChatGptService?: ReturnType<typeof createChatGptService> };
export const chatGptService = runtime.voraChatGptService ??= createChatGptService({ hostId });
// next dev logs incoming callback query strings; only the local production server is admitted.
export const chatGptEnabled = () => process.env.VORA_CHATGPT_LOCAL_ENABLED === "true" && process.env.NODE_ENV === "production";
export const chatGptHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
