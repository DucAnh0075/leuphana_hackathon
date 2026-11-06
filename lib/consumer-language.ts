import type { CareDocument, CareEvidence, CareHandoff } from "@/lib/care/types";

/** Presentation labels only. Stored documents, quotes and provenance stay unchanged. */
export function documentTitle(document: Pick<CareDocument, "kind" | "title">): string {
  const titles: Record<string, string> = {
    "Patientenverfügung": "Advance directive",
    "Vorsorgevollmacht": "Healthcare proxy",
    "Betreuungsverfügung": "Care representative nomination",
    "Auskunftsvollmacht": "Information sharing permission",
    "Vollmacht": "Power of attorney",
  };
  return titles[document.kind] ?? "Care document";
}

export function evidenceTitle(evidence: CareEvidence): string {
  const labels: Record<string, string> = {
    representation: "Who may represent you",
    information: "Access to information",
    care: "Care preferences",
    wishes: "Your stated wishes",
    treatment: "Treatment preferences",
    condition: "When this applies",
  };
  return labels[evidence.category] ?? "From the original document";
}

export const handoffStatus: Record<CareHandoff["status"], string> = {
  received: "Received", clarification: "Needs clarification", accepted: "Confirmed in record", withdrawn: "Withdrawn",
};

export function consumerError(result: { code?: string } | null | undefined, fallback: string): string {
  const messages: Record<string, string> = {
    DEMO_EXPIRED: "This sample workspace has expired. Open a new sample workspace.",
    DEMO_NOT_FOUND: "This sample workspace is no longer available. Open a new sample workspace.",
    STALE_REVISION: "This handoff has changed. Reload it before trying again.",
    REVISION_CONFLICT: "This handoff has changed. Reload it before trying again.",
    CONFLICT: "This handoff has changed. Reload it before trying again.",
    CARD_REVOKED: "This card link is paused. Activate it in Card settings first.",
    CARD_INACTIVE: "This card link is paused. Activate it in Card settings first.",
    CARD_DISABLED: "This card link is paused. Activate it in Card settings first.",
    CARD_ID: "The card link is incomplete or invalid.",
    DOCUMENT_ACCESS: "This document is not available to this account.",
    UNAUTHORIZED: "Log in again to continue.",
    FORBIDDEN: "Your account does not have access to this action.",
    RATE_LIMITED: "Please wait a moment before trying again.",
  };
  return (result?.code && messages[result.code]) || fallback;
}

export const defaultConsumerDestination = "/vorsorge/app";

export function safeConsumerDestination(value?: string): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return defaultConsumerDestination;
  try {
    const base = "https://vorsorge.invalid";
    const target = new URL(value, base);
    return target.origin === base ? target.pathname + target.search + target.hash : defaultConsumerDestination;
  } catch { return defaultConsumerDestination; }
}

export function demoConsumerDestination(destination: string, demoId: string): string {
  const target = new URL(safeConsumerDestination(destination), "https://vorsorge.invalid");
  target.searchParams.set("demo", demoId);
  if (target.pathname === "/vorsorge" && !target.searchParams.has("view")) target.searchParams.set("view", "documents");
  return target.pathname + target.search + target.hash;
}
