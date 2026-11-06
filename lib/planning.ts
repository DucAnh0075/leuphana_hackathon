import originalSources from "../public/templates/sources.json";

/** Local planning notes only. This model never fills or signs an official form. */
export type Subject = "self" | "someone-else";
export type GoalId = "decisions" | "wishes" | "information" | "court" | "unsure";
export type TemplateId = "healthcare-proxy" | "advance-directive" | "care-nomination" | "information-release";
export type PlanningStep = "subject" | "purpose" | "templates" | "packages" | "review";
export type PackageStatus = "empty" | "partial" | "complete" | "pending";

export interface PlanningDraft {
  version: 1;
  subject: Subject | null;
  goals: GoalId[];
  selectedTemplateIds: TemplateId[];
  answers: Record<string, Record<string, string>>;
  pendingPackageIds: string[];
  currentPackageId?: string;
  step: PlanningStep;
  revision: number;
  reviewedRevision: number | null;
}

export interface PlanningField {
  id: string;
  label: string;
  placeholder: string;
  help: string;
  required: boolean;
  multiline: boolean;
}

export interface PlanningPackage {
  id: string;
  templateId: TemplateId | null;
  title: string;
  description: string;
  fields: PlanningField[];
}

export interface PlanningTemplate {
  id: TemplateId;
  title: string;
  germanTitle: string;
  summary: string;
  limitation: string;
  source: {
    title: string;
    url: string;
    localPath: string;
    version: string;
    kind: "official-template" | "synthetic-example";
  };
  packageIds: string[];
}

export const GOALS: { id: GoalId; title: string; description: string }[] = [
  { id: "decisions", title: "Choose someone to help with decisions", description: "Plan who could represent the person in health matters, and discuss the limits." },
  { id: "wishes", title: "Record wishes for future care", description: "Gather values and questions for a conversation about treatment wishes." },
  { id: "information", title: "Let someone receive information", description: "Plan who should receive which health information, and for how long." },
  { id: "court", title: "Name a preferred court-appointed representative", description: "Record a preference in case a court-appointed representative is needed." },
  { id: "unsure", title: "I am not sure yet", description: "Compare the options. Nothing will be chosen for you." },
];

function officialSource(path: string): PlanningTemplate["source"] {
  const source = originalSources.sources.find(item => item.url === path);
  if (!source) throw new Error("Missing planning template provenance.");
  return { title: source.label, url: source.upstream, localPath: source.url, version: source.version, kind: "official-template" };
}

// Only the first two kinds have official original templates in this repository.
// The remaining references are explicitly synthetic examples from demo-patients.json.
export const TEMPLATES: PlanningTemplate[] = [
  {
    id: "healthcare-proxy", title: "Healthcare proxy", germanTitle: "Vorsorgevollmacht",
    summary: "Prepare a conversation about a trusted person and the health matters they might handle.",
    limitation: "These notes grant no authority. The German original covers separate powers and choices that this worksheet does not complete.",
    source: officialSource("/pdfs/Vorsorgevollmacht.pdf"),
    packageIds: ["proxy-person", "proxy-scope"],
  },
  {
    id: "advance-directive", title: "Advance directive", germanTitle: "Patientenverfügung",
    summary: "Gather personal values, concerns and questions about future treatment wishes.",
    limitation: "These notes are not treatment instructions. Specific situations and treatment choices need separate discussion and review; no medical choice is made here.",
    source: officialSource("/templates/patientenverfuegung-textbausteine.pdf"),
    packageIds: ["wishes-values", "wishes-discussion"],
  },
  {
    id: "care-nomination", title: "Care representative nomination", germanTitle: "Betreuungsverfügung",
    summary: "Gather a preference for who might be appointed if court-appointed representation is needed.",
    limitation: "A preference does not appoint a representative or grant authority. This project supplies a synthetic example, not an official form.",
    source: { title: "Project demo: Betreuungsverfügung (synthetic example)", url: "/demo-documents/26004182-betreuung.pdf", localPath: "/demo-documents/26004182-betreuung.pdf", version: "Demo 05.11.2026", kind: "synthetic-example" },
    packageIds: ["care-person", "care-wishes"],
  },
  {
    id: "information-release", title: "Information sharing permission", germanTitle: "Auskunft & Schweigepflichtentbindung",
    summary: "Plan a recipient, the information to share and boundaries for that sharing.",
    limitation: "These notes do not authorize disclosure or medical decisions. This project supplies a synthetic example, not an official form.",
    source: { title: "Project demo: Auskunftsvollmacht (synthetic example)", url: "/demo-documents/26004182-auskunft.pdf", localPath: "/demo-documents/26004182-auskunft.pdf", version: "Demo 05.11.2026", kind: "synthetic-example" },
    packageIds: ["information-person", "information-scope"],
  },
];

const field = (id: string, label: string, placeholder: string, help: string, required = true, multiline = true): PlanningField => ({ id, label, placeholder, help, required, multiline });

export const PACKAGES: PlanningPackage[] = [
  {
    id: "about-person", templateId: null, title: "About the person", description: "Start with who this plan is for and how their own wishes will be heard.",
    fields: [
      field("name", "Name or initials of the person", "For example, Alex M.", "Initials are enough for a planning draft. Avoid unnecessary personal details.", true, false),
      field("involvement", "How is the person taking part?", "Their own notes, a conversation together, or a question still to resolve", "If you are helping someone else, distinguish their expressed wishes from your questions. Helping does not grant authority."),
    ],
  },
  {
    id: "proxy-person", templateId: "healthcare-proxy", title: "Choose a person to discuss this with", description: "Record a possible trusted person. This is a discussion prompt, not an appointment.",
    fields: [
      field("person", "Who might be the trusted person?", "Name or initials", "The person concerned should be involved in this choice.", true, false),
      field("conversation", "What needs to be discussed with them?", "Their willingness, practical availability, or questions", "Do not assume that being a relative already gives someone authority."),
    ],
  },
  {
    id: "proxy-scope", templateId: "healthcare-proxy", title: "Discuss the scope", description: "Separate the intended health matters from powers that still need a decision.",
    fields: [
      field("intent", "What help is the person considering?", "Describe the health matters they want to discuss", "No powers are selected or granted by this answer. The original has separate choices."),
      field("questions", "What limits or questions need review?", "Situations, exclusions, or questions for qualified advice", "Keep unresolved questions visible instead of assuming a broad permission."),
    ],
  },
  {
    id: "wishes-values", templateId: "advance-directive", title: "Start with what matters", description: "Gather the person's own words before discussing specific treatment situations.",
    fields: [
      field("values", "What matters to the person in their care?", "Values, priorities, comfort, or people they want nearby", "Record their own words where possible. These are conversation notes."),
      field("topics", "What situations or concerns need a conversation?", "A concern to discuss with a clinician", "This worksheet does not select or recommend treatment options."),
    ],
  },
  {
    id: "wishes-discussion", templateId: "advance-directive", title: "Prepare the next conversation", description: "Identify what needs clarification before any specific directive is prepared.",
    fields: [
      field("questions", "What would the person like to ask a clinician?", "Questions about possible situations and what choices mean", "The German text blocks contain alternatives that require careful individual consideration."),
      field("support", "Who could join that conversation?", "A clinician, trusted person, or adviser", "Optional planning note; this does not give that person decision-making authority.", false),
    ],
  },
  {
    id: "care-person", templateId: "care-nomination", title: "Record a preferred person", description: "Plan a preference for a possible future court appointment.",
    fields: [
      field("person", "Who would the person prefer?", "Name or initials", "A nomination alone is not a court appointment.", true, false),
      field("reason", "Why is this their preference?", "What makes this person a good fit for their wishes?", "If helping someone else, record their preference rather than choosing on their behalf."),
    ],
  },
  {
    id: "care-wishes", templateId: "care-nomination", title: "Gather wishes and open questions", description: "Record what should be considered if representation becomes necessary.",
    fields: [
      field("preferences", "What personal wishes should be discussed?", "Preferences about support, daily life, or people involved", "These notes do not establish that representation is needed or already exists."),
      field("questions", "What still needs clarification?", "Questions for an adviser or the person concerned", "Optional. An unresolved question can remain open.", false),
    ],
  },
  {
    id: "information-person", templateId: "information-release", title: "Name the intended recipient", description: "Start with who the person would like to receive information.",
    fields: [
      field("person", "Who might receive information?", "Name or initials", "This does not authorize disclosure.", true, false),
      field("relationship", "How do they know the person?", "Relationship or role", "Optional context. A relationship alone is not permission to receive information.", false, false),
    ],
  },
  {
    id: "information-scope", templateId: "information-release", title: "Set information boundaries", description: "Prepare a specific discussion about information, timing and limits.",
    fields: [
      field("information", "What information is being considered?", "The specific information, care episode, or provider", "Avoid assuming permission for all records or all future treatment."),
      field("limits", "What time limits or exclusions need discussion?", "An end date, excluded information, or limits on further sharing", "Information access and treatment decisions are separate matters."),
    ],
  },
];

export const MAX_ANSWER_LENGTH = 2000;
const MAX_STORED_LENGTH = 80_000;
const MAX_REVISION = 1_000_000;
const STEPS: PlanningStep[] = ["subject", "purpose", "templates", "packages", "review"];
const templateIds = new Set(TEMPLATES.map(template => template.id));
const goalIds = new Set(GOALS.map(goal => goal.id));

export function createPlanningDraft(): PlanningDraft {
  return { version: 1, subject: null, goals: [], selectedTemplateIds: [], answers: {}, pendingPackageIds: [], step: "subject", revision: 0, reviewedRevision: null };
}

export function recommendTemplates(goals: readonly GoalId[]): { templateId: TemplateId; reason: string }[] {
  const matches: { goal: GoalId; templateId: TemplateId; reason: string }[] = [
    { goal: "decisions", templateId: "healthcare-proxy", reason: "You want to discuss who could help with health decisions and what their role should cover." },
    { goal: "wishes", templateId: "advance-directive", reason: "You want to gather the person's wishes for future care and questions for a clinician." },
    { goal: "information", templateId: "information-release", reason: "You want to plan access to information, with a named recipient and clear limits." },
    { goal: "court", templateId: "care-nomination", reason: "You want to record a preference in case court-appointed representation is needed." },
  ];
  return matches.filter(match => goals.includes(match.goal)).map(({ templateId, reason }) => ({ templateId, reason }));
}

export function getPackages(draft: PlanningDraft): PlanningPackage[] {
  if (!draft.selectedTemplateIds.length) return [];
  return PACKAGES.filter(pkg => pkg.templateId === null || draft.selectedTemplateIds.includes(pkg.templateId));
}

function revised(draft: PlanningDraft, changes: Partial<PlanningDraft>): PlanningDraft {
  if (draft.revision >= MAX_REVISION) throw new Error("Planning draft revision limit reached. Export the draft and start a new one.");
  return { ...draft, ...changes, revision: draft.revision + 1, reviewedRevision: null };
}

export function setSubject(draft: PlanningDraft, subject: Subject): PlanningDraft {
  if (subject !== "self" && subject !== "someone-else") throw new Error("Unknown planning subject.");
  if (draft.subject === subject) return draft;
  // The caller confirms this loss before changing an already chosen subject.
  // Every answer can contain person-specific information, so all are cleared.
  return revised(draft, { subject, answers: {}, pendingPackageIds: [], currentPackageId: undefined, step: "purpose" });
}

export function setGoals(draft: PlanningDraft, goals: GoalId[]): PlanningDraft {
  if (!draft.subject) throw new Error("Choose who the plan is for first.");
  if (goals.some(goal => !goalIds.has(goal)) || new Set(goals).size !== goals.length) throw new Error("Unknown or duplicate planning purpose.");
  if (goals.includes("unsure") && goals.length > 1) throw new Error("Choose specific purposes or the unsure option.");
  if (draft.goals.length === goals.length && draft.goals.every(goal => goals.includes(goal))) return draft;
  return revised(draft, { goals: [...goals], ...(goals.length ? {} : { step: "purpose" }) });
}

export function toggleTemplate(draft: PlanningDraft, templateId: TemplateId): PlanningDraft {
  if (!draft.subject || !draft.goals.length) throw new Error("Choose a person and purpose first.");
  if (!templateIds.has(templateId)) throw new Error("Unknown planning template.");
  const selectedTemplateIds = draft.selectedTemplateIds.includes(templateId)
    ? draft.selectedTemplateIds.filter(id => id !== templateId)
    : [...draft.selectedTemplateIds, templateId];
  const activeIds = new Set(getPackages({ ...draft, selectedTemplateIds }).map(pkg => pkg.id));
  const answers = Object.fromEntries(Object.entries(draft.answers).filter(([id]) => activeIds.has(id)));
  return revised(draft, {
    selectedTemplateIds, answers,
    pendingPackageIds: draft.pendingPackageIds.filter(id => activeIds.has(id)),
    currentPackageId: draft.currentPackageId && activeIds.has(draft.currentPackageId) ? draft.currentPackageId : undefined,
    ...(selectedTemplateIds.length ? {} : { step: "templates" }),
  });
}

export function setAnswer(draft: PlanningDraft, packageId: string, fieldId: string, value: string): PlanningDraft {
  const pkg = getPackages(draft).find(item => item.id === packageId);
  if (!pkg?.fields.some(item => item.id === fieldId)) throw new Error("Unknown or inactive planning field.");
  if (typeof value !== "string" || value.length > MAX_ANSWER_LENGTH || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) throw new Error("Invalid planning answer.");
  if (draft.answers[packageId]?.[fieldId] === value && !draft.pendingPackageIds.includes(packageId)) return draft;
  return revised(draft, {
    answers: { ...draft.answers, [packageId]: { ...draft.answers[packageId], [fieldId]: value } },
    pendingPackageIds: draft.pendingPackageIds.filter(id => id !== packageId),
  });
}

export function markPackagePending(draft: PlanningDraft, packageId: string): PlanningDraft {
  if (!getPackages(draft).some(pkg => pkg.id === packageId)) throw new Error("Unknown or inactive planning package.");
  if (draft.pendingPackageIds.includes(packageId)) return draft;
  return revised(draft, { pendingPackageIds: [...draft.pendingPackageIds, packageId] });
}

export function getPackageStatus(draft: PlanningDraft, packageId: string): PackageStatus {
  const pkg = getPackages(draft).find(item => item.id === packageId);
  if (!pkg) throw new Error("Unknown or inactive planning package.");
  if (draft.pendingPackageIds.includes(packageId)) return "pending";
  const answers = draft.answers[packageId] ?? {};
  if (!pkg.fields.some(item => answers[item.id]?.trim())) return "empty";
  return pkg.fields.filter(item => item.required).every(item => answers[item.id]?.trim()) ? "complete" : "partial";
}

export function getProgress(draft: PlanningDraft): { complete: number; total: number; pending: number; reviewed: boolean } {
  const packages = getPackages(draft);
  const complete = packages.filter(pkg => getPackageStatus(draft, pkg.id) === "complete").length;
  return { complete, total: packages.length, pending: packages.length - complete, reviewed: draft.reviewedRevision !== null && draft.reviewedRevision === draft.revision };
}

export function setCurrentPackage(draft: PlanningDraft, packageId: string): PlanningDraft {
  if (!getPackages(draft).some(pkg => pkg.id === packageId)) throw new Error("Unknown or inactive planning package.");
  return { ...draft, currentPackageId: packageId };
}

export function setPlanningStep(draft: PlanningDraft, step: PlanningStep): PlanningDraft {
  if (!STEPS.includes(step)) throw new Error("Unknown planning step.");
  if (step !== "subject" && !draft.subject) throw new Error("Choose who the plan is for first.");
  if (["templates", "packages", "review"].includes(step) && !draft.goals.length) throw new Error("Choose a purpose first.");
  if (["packages", "review"].includes(step) && !draft.selectedTemplateIds.length) throw new Error("Choose at least one template first.");
  return { ...draft, step };
}

export function markReviewed(draft: PlanningDraft): PlanningDraft {
  if (!draft.subject || !draft.goals.length || !draft.selectedTemplateIds.length) throw new Error("Choose a person, purpose and template before reviewing.");
  // Review acknowledges the notes and their gaps, never legal completion.
  return { ...draft, step: "review", reviewedRevision: draft.revision };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}

function uniqueStrings(value: unknown, allowed: ReadonlySet<string>, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every(item => typeof item === "string" && allowed.has(item)) && new Set(value).size === value.length;
}

/** Reject unsupported or malformed storage wholesale; never silently invent answers. */
export function restorePlanningDraft(raw: string): PlanningDraft | null {
  if (typeof raw !== "string" || raw.length > MAX_STORED_LENGTH) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!isRecord(value) || !exactKeys(value, ["version", "subject", "goals", "selectedTemplateIds", "answers", "pendingPackageIds", "currentPackageId", "step", "revision", "reviewedRevision"])) return null;
  if (value.version !== 1 || (value.subject !== null && value.subject !== "self" && value.subject !== "someone-else")) return null;
  if (!uniqueStrings(value.goals, goalIds, GOALS.length) || (value.goals.includes("unsure") && value.goals.length > 1)) return null;
  if (!uniqueStrings(value.selectedTemplateIds, templateIds, TEMPLATES.length)) return null;
  if (typeof value.step !== "string" || !STEPS.includes(value.step as PlanningStep)) return null;
  if (typeof value.revision !== "number" || !Number.isSafeInteger(value.revision) || value.revision < 0 || value.revision > MAX_REVISION) return null;
  if (value.reviewedRevision !== null && value.reviewedRevision !== value.revision) return null;
  if (!isRecord(value.answers)) return null;
  const draft = value as unknown as PlanningDraft;
  const packages = getPackages(draft);
  const activeIds = new Set(packages.map(pkg => pkg.id));
  if (value.currentPackageId !== undefined && (typeof value.currentPackageId !== "string" || !activeIds.has(value.currentPackageId))) return null;
  if (!uniqueStrings(value.pendingPackageIds, activeIds, packages.length)) return null;
  if (!exactKeys(value.answers, [...activeIds])) return null;
  for (const [packageId, packageAnswers] of Object.entries(value.answers)) {
    const pkg = packages.find(item => item.id === packageId)!;
    if (!isRecord(packageAnswers) || !exactKeys(packageAnswers, pkg.fields.map(item => item.id))) return null;
    for (const answer of Object.values(packageAnswers)) {
      if (typeof answer !== "string" || answer.length > MAX_ANSWER_LENGTH || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(answer)) return null;
    }
  }
  if (!draft.subject && (draft.goals.length || draft.selectedTemplateIds.length || Object.keys(draft.answers).length || draft.pendingPackageIds.length)) return null;
  if (draft.reviewedRevision !== null && (!draft.subject || !draft.goals.length || !draft.selectedTemplateIds.length)) return null;
  try { setPlanningStep(draft, draft.step); } catch { return null; }
  return draft;
}

export function serializePlanningDraft(draft: PlanningDraft): string {
  const serialized = JSON.stringify(draft);
  if (!restorePlanningDraft(serialized)) throw new Error("Cannot save an invalid planning draft.");
  return serialized;
}

export function exportPlanningDraft(draft: PlanningDraft): string {
  // Revalidate before turning locally restored data into a durable artifact.
  serializePlanningDraft(draft);
  const progress = getProgress(draft);
  const lines = [
    "CARE PLANNING DRAFT — UNSIGNED",
    "Planning notes only. Not an official completed form, a legally effective document, a grant of authority, or treatment instructions.",
    "English explanations are not a legal translation. Refer to the unchanged German originals where supplied.",
    "",
    `Prepared for: ${draft.subject === "self" ? "myself" : draft.subject === "someone-else" ? "someone else" : "not yet chosen"}`,
    ...(draft.subject === "someone-else" ? ["Helping another person does not give you authority to choose, consent, sign or act for them. Their own wishes and any authority must be established separately."] : []),
    `Purposes: ${draft.goals.map(id => GOALS.find(goal => goal.id === id)!.title).join("; ") || "not yet chosen"}`,
    `Planning prompts: ${progress.complete} of ${progress.total} packages answered; ${progress.pending} still open.`,
    `Review: ${progress.reviewed ? "Notes and gaps reviewed for this revision" : "Not reviewed for this revision"}. Review does not establish legal completeness.`,
    "",
    "CHOSEN TEMPLATES",
  ];
  const selected = TEMPLATES.filter(template => draft.selectedTemplateIds.includes(template.id));
  if (!selected.length) lines.push("No templates selected.");
  for (const template of selected) {
    lines.push(`${template.title} (${template.germanTitle})`, template.limitation, `Source: ${template.source.title}; ${template.source.version}`, `Original/reference: ${template.source.url}`, `Repository copy: ${template.source.localPath}`, "");
  }
  lines.push("PLANNING ANSWERS AND GAPS");
  for (const pkg of getPackages(draft)) {
    const status = getPackageStatus(draft, pkg.id);
    lines.push("", `${pkg.title} — ${status === "complete" ? "planning prompts answered" : status}`);
    if (status === "pending") lines.push("Marked pending; revisit this package even if some answers are present.");
    for (const item of pkg.fields) {
      lines.push(`${item.label}:`, draft.answers[pkg.id]?.[item.id]?.trim() || (item.required ? "OPEN — not answered" : "Not provided (optional)"));
    }
  }
  lines.push("", "NEXT STEPS", "Discuss the notes and open questions with the person concerned and suitable advisers. Review the applicable original form and its full choices separately. No official form has been filled, signed or validated by this tool.", "This draft has not been sent to a clinic or stored as a completed care document.");
  return lines.join("\n");
}
