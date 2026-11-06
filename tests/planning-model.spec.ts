import { expect, test } from "@playwright/test";
import {
  createPlanningDraft, exportPlanningDraft, getPackageStatus, getPackages, getProgress,
  markPackagePending, markReviewed, recommendTemplates, restorePlanningDraft,
  serializePlanningDraft, setAnswer, setCurrentPackage, setGoals, setPlanningStep, setSubject, toggleTemplate,
  type PlanningDraft, type TemplateId,
} from "../lib/planning";

// Pure model tests. They cover local planning state, not legal validity or clinical advice.
function selected(templateId: TemplateId = "healthcare-proxy"): PlanningDraft {
  return toggleTemplate(setGoals(setSubject(createPlanningDraft(), "self"), ["decisions"]), templateId);
}

test("purpose matching separates information access, representation, wishes and court preference", () => {
  expect(recommendTemplates(["information"]).map(item => item.templateId)).toEqual(["information-release"]);
  expect(recommendTemplates(["decisions"]).map(item => item.templateId)).toEqual(["healthcare-proxy"]);
  expect(recommendTemplates(["wishes"]).map(item => item.templateId)).toEqual(["advance-directive"]);
  expect(recommendTemplates(["court"]).map(item => item.templateId)).toEqual(["care-nomination"]);
  expect(recommendTemplates(["information", "wishes"]).map(item => item.templateId).sort()).toEqual(["advance-directive", "information-release"]);
  expect(recommendTemplates(["unsure"])).toEqual([]);
  const undecided = setGoals(setSubject(createPlanningDraft(), "self"), ["unsure"]);
  expect(undecided.selectedTemplateIds).toEqual([]);
  expect(() => setPlanningStep(undecided, "packages")).toThrow();
  expect(getProgress(undecided)).toEqual({ complete: 0, total: 0, pending: 0, reviewed: false });
});

test("empty, partial, answered and explicitly pending planning packages remain distinct", () => {
  let draft = selected();
  expect(getPackageStatus(draft, "about-person")).toBe("empty");
  draft = setAnswer(draft, "about-person", "name", "Alex M.");
  expect(getPackageStatus(draft, "about-person")).toBe("partial");
  draft = setAnswer(draft, "about-person", "involvement", "   ");
  expect(getPackageStatus(draft, "about-person")).toBe("partial");
  draft = setAnswer(draft, "about-person", "involvement", "My own notes for a conversation.");
  expect(getPackageStatus(draft, "about-person")).toBe("complete");
  expect(getProgress(draft)).toMatchObject({ complete: 1, total: 3, pending: 2 });
  draft = markPackagePending(draft, "about-person");
  expect(getPackageStatus(draft, "about-person")).toBe("pending");
  expect(getProgress(draft)).toMatchObject({ complete: 0, pending: 3 });
  expect(exportPlanningDraft(draft)).toContain("Marked pending; revisit this package");
  draft = setAnswer(draft, "about-person", "involvement", "Reviewed my notes with a helper.");
  expect(getPackageStatus(draft, "about-person")).toBe("complete");
});

test("switching the subject clears person-dependent answers, pending flags and review", () => {
  let draft = selected();
  draft = setAnswer(draft, "about-person", "name", "First person");
  draft = setAnswer(draft, "proxy-person", "person", "First person's representative");
  draft = markReviewed(markPackagePending(draft, "proxy-scope"));
  const changed = setSubject(draft, "someone-else");
  expect(changed.answers).toEqual({});
  expect(changed.pendingPackageIds).toEqual([]);
  expect(getProgress(changed).reviewed).toBe(false);
  expect(changed.step).toBe("purpose");
  expect(exportPlanningDraft(changed)).not.toContain("First person");
  expect(exportPlanningDraft(changed)).toContain("Helping another person does not give you authority");
  // The immutable transition preserves the prior draft for the caller's confirmation flow.
  expect(draft.answers["about-person"].name).toBe("First person");
  expect(setSubject(changed, "someone-else")).toBe(changed);
});

test("deselecting a document removes its notes from storage, export and later reselection", () => {
  let draft = toggleTemplate(selected(), "information-release");
  draft = setAnswer(draft, "about-person", "name", "Shared name");
  draft = setAnswer(draft, "information-person", "person", "PRIVATE RECIPIENT NOTE");
  draft = markPackagePending(draft, "information-scope");
  draft = toggleTemplate(draft, "information-release");
  expect(serializePlanningDraft(draft)).not.toContain("PRIVATE RECIPIENT NOTE");
  expect(exportPlanningDraft(draft)).not.toContain("Information sharing permission");
  expect(exportPlanningDraft(draft)).not.toContain("26004182-auskunft.pdf");
  expect(draft.answers["about-person"].name).toBe("Shared name");
  expect(draft.pendingPackageIds).toEqual([]);
  const reselected = toggleTemplate(draft, "information-release");
  expect(getPackageStatus(reselected, "information-person")).toBe("empty");
  const none = toggleTemplate(draft, "healthcare-proxy");
  expect(getPackages(none)).toEqual([]);
  expect(none.answers).toEqual({});
  expect(restorePlanningDraft(serializePlanningDraft(none))).toEqual(none);
});

test("review is bound to the current answers and is never legal completion", () => {
  let draft = markReviewed(selected("advance-directive"));
  expect(getProgress(draft)).toMatchObject({ reviewed: true, complete: 0, pending: 3 });
  expect(exportPlanningDraft(draft)).toContain("OPEN — not answered");
  expect(exportPlanningDraft(draft)).toContain("Review does not establish legal completeness");
  expect(getProgress(setPlanningStep(draft, "packages")).reviewed).toBe(true);
  draft = setAnswer(draft, "wishes-values", "values", "I want to discuss comfort and company.");
  expect(getProgress(draft).reviewed).toBe(false);
  expect(exportPlanningDraft(draft)).toContain("Not reviewed for this revision");
  expect(getProgress(setGoals(markReviewed(draft), ["wishes"])).reviewed).toBe(false);
  expect(getProgress(markPackagePending(markReviewed(draft), "wishes-values")).reviewed).toBe(false);
  expect(getProgress(toggleTemplate(markReviewed(draft), "information-release")).reviewed).toBe(false);
});

test("changing purposes can be saved mid-edit without losing existing notes", () => {
  const draft = setAnswer(selected(), "about-person", "name", "Keep these notes");
  const editing = setGoals(markReviewed(draft), []);
  expect(editing.step).toBe("purpose");
  expect(editing.answers["about-person"].name).toBe("Keep these notes");
  expect(restorePlanningDraft(serializePlanningDraft(editing))).toEqual(editing);
  expect(() => setPlanningStep(editing, "review")).toThrow();
  expect(() => markReviewed(editing)).toThrow();
  expect(() => setGoals(draft, ["unsure", "information"])).toThrow();
});

test("resume restores the last task without treating navigation as changed answers", () => {
  const draft = markReviewed(selected());
  const positioned = setCurrentPackage(setPlanningStep(draft, "packages"), "proxy-scope");
  const restored = restorePlanningDraft(serializePlanningDraft(positioned));
  expect(restored?.currentPackageId).toBe("proxy-scope");
  expect(restored?.step).toBe("packages");
  expect(getProgress(restored!).reviewed).toBe(true);
  expect(setSubject(positioned, "someone-else").currentPackageId).toBeUndefined();
  expect(toggleTemplate(positioned, "healthcare-proxy").currentPackageId).toBeUndefined();
  expect(() => setCurrentPackage(draft, "information-scope")).toThrow();
});

test("restore rejects unknown versions, IDs, oversized values and impossible review states", () => {
  const valid = setAnswer(selected(), "about-person", "name", "Alex M.");
  expect(restorePlanningDraft(serializePlanningDraft(valid))).toEqual(valid);
  expect(restorePlanningDraft("not json")).toBeNull();
  expect(restorePlanningDraft(" ".repeat(80_001))).toBeNull();
  const invalid: unknown[] = [
    null, [], { ...valid, version: 2 }, { ...valid, extra: true },
    { ...valid, selectedTemplateIds: ["unknown-template"] },
    { ...valid, selectedTemplateIds: ["healthcare-proxy", "healthcare-proxy"] },
    { ...valid, subject: "other" }, { ...valid, subject: null },
    { ...valid, goals: ["unsure", "wishes"] }, { ...valid, goals: ["unknown-purpose"] },
    { ...valid, step: "signed" }, { ...valid, revision: -1 },
    { ...valid, revision: 1.5 }, { ...valid, revision: 1_000_001 },
    { ...valid, reviewedRevision: valid.revision + 1 },
    { ...valid, answers: { "unknown-package": { name: "Injected note" } } },
    { ...valid, answers: { "information-person": { person: "Inactive document" } } },
    { ...valid, answers: { "about-person": { unknownField: "Injected note" } } },
    { ...valid, answers: { "about-person": { name: 123 } } },
    { ...valid, answers: { "about-person": { name: "x".repeat(2001) } } },
    { ...valid, answers: { "about-person": { name: "text\u0000hidden" } } },
    { ...valid, pendingPackageIds: ["information-person"] },
    { ...valid, currentPackageId: "information-person" },
    { ...valid, currentPackageId: null },
    { ...valid, pendingPackageIds: ["about-person", "about-person"] },
    { ...createPlanningDraft(), reviewedRevision: 0 },
  ];
  for (const tampered of invalid) expect(restorePlanningDraft(JSON.stringify(tampered))).toBeNull();
  expect(restorePlanningDraft('{"__proto__":{"polluted":true}}')).toBeNull();
  expect(() => setAnswer(valid, "information-person", "person", "Hidden answer")).toThrow();
  expect(() => setAnswer(valid, "about-person", "unknownField", "Hidden answer")).toThrow();
});

test("export carries provenance, unanswered gaps and the unsigned planning boundary", () => {
  let draft = selected("advance-directive");
  draft = toggleTemplate(draft, "care-nomination");
  draft = setAnswer(draft, "wishes-values", "values", "Ask about comfortable care.");
  const text = exportPlanningDraft(draft);
  expect(text).toContain("CARE PLANNING DRAFT — UNSIGNED");
  expect(text).toContain("English explanations are not a legal translation");
  expect(text).toContain("/templates/patientenverfuegung-textbausteine.pdf");
  expect(text).toContain("synthetic example");
  expect(text).toContain("Ask about comfortable care.");
  expect(text).toContain("OPEN — not answered");
  expect(text).toContain("No official form has been filled, signed or validated");
  expect(text).toContain("This draft has not been sent to a clinic");
  expect(text).not.toContain("Vorsorgevollmacht");
});
