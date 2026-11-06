import { expect, test } from "@playwright/test";
import { emptyWorkspace, parseWorkspace, type WorkspaceState } from "../lib/vora";

const today = new Date("2026-11-06T12:00:00Z");
function roundTrip(value: unknown) { return parseWorkspace(JSON.stringify(value), today); }
function populated(): WorkspaceState {
  return {
    ...emptyWorkspace(), selected: ["power"],
    answers: {
      "power:person": { value: "", note: "Ask a trusted person.\nKeep my own questions.", reviewed: true },
      "power:health": { value: "Discuss before deciding", note: "Clarify the scope.", reviewed: false },
      "directive:values": { value: "", note: "Notes retained after deselecting this document.", reviewed: false },
    },
    profile: { birthYear: "1975", programme: "all" },
    vaccines: [{ id: "entry-1", name: "Example vaccination", date: "2024-02-29", product: "", batch: "", note: "Copied from my booklet; unverified." }],
    travel: { destination: "Example destination", departure: "2026-12-15", checks: ["country", "consultation"] },
    completion: { power: ["0"] },
  };
}

test("workspace restore preserves personal notes exactly, including deselected documents and old trips", () => {
  expect(roundTrip(emptyWorkspace())).toEqual({ ...emptyWorkspace(), planningFor: "self" });
  const state = populated();
  expect(roundTrip(state)).toEqual({ ...state, planningFor: "self" });
  expect(roundTrip({ ...state, planningFor: "someone" })).toMatchObject({ planningFor: "someone" });
  const legacy = { ...state } as Record<string, unknown>;
  delete legacy.planningFor;
  expect(roundTrip(legacy)).toMatchObject({ planningFor: "self", answers: state.answers });
  expect(roundTrip({ ...state, travel: { ...state.travel, departure: "2020-02-29" } }).travel.departure).toBe("2020-02-29");
  expect(roundTrip({ ...state, answers: { "power:person": { value: "", note: "x".repeat(5000), reviewed: false } } }).answers["power:person"].note).toHaveLength(5000);
});

test("corrupt shapes, unknown fields and IDs cannot become a restored workspace", () => {
  const state = populated();
  const invalid: unknown[] = [
    null, [], { ...state, version: 2 }, { ...state, secretProfile: "unexpected data" }, { ...state, planningFor: "unknown" },
    { ...state, selected: ["power", "power"] }, { ...state, selected: ["unknown"] },
    { ...state, answers: [] }, { ...state, profile: [] }, { ...state, completion: [] },
    { ...state, answers: { "power:unknown": { value: "", note: "text", reviewed: false } } },
    { ...state, answers: { "power:person": { value: "", note: "text", reviewed: false, uploadedFile: "private" } } },
    { ...state, profile: { ...state.profile, fullName: "Unapproved field" } },
    { ...state, profile: { ...state.profile, programme: ["all"] } },
    { ...state, travel: { ...state.travel, checks: ["country", "country"] } },
    { ...state, travel: { ...state.travel, checks: ["unknown"] } },
    { ...state, completion: { unknown: ["0"] } }, { ...state, completion: { power: ["4"] } },
    { ...state, completion: { power: ["0", "0"] } },
    { ...state, vaccines: [state.vaccines[0], state.vaccines[0]] },
    { ...state, vaccines: [{ ...state.vaccines[0], verified: true }] },
  ];
  for (const value of invalid) expect(() => roundTrip(value)).toThrow();
  expect(() => parseWorkspace("{broken", today)).toThrow();
  expect(() => parseWorkspace('{"__proto__":{"polluted":true}}', today)).toThrow();
  expect(() => parseWorkspace(" ".repeat(1_000_001), today)).toThrow();
});

test("restored dates must be real calendar dates and vaccination entries cannot be in the future", () => {
  const state = populated();
  for (const date of ["", "not-a-date", "2025-02-29", "2026-04-31", "2026-00-01", "2026-12-00", "2026-1-2", "2026-11-07", "2026-11-06T12:00:00Z"]) {
    expect(() => roundTrip({ ...state, vaccines: [{ ...state.vaccines[0], date }] })).toThrow();
  }
  for (const departure of ["", "2026-02-30", "2026-13-01", "2026-01-99", "0000-01-01"]) {
    expect(() => roundTrip({ ...state, travel: { ...state.travel, departure } })).toThrow();
  }
  for (const birthYear of ["2027", "1905", "-1", "NaN", "1975.5", "1e3", "", "10000"]) {
    const candidate = { ...state, profile: { ...state.profile, birthYear } };
    if (birthYear === "") expect(roundTrip(candidate).profile.birthYear).toBe("");
    else expect(() => roundTrip(candidate)).toThrow();
  }
  expect(roundTrip({ ...state, profile: { ...state.profile, birthYear: "1906" } }).profile.birthYear).toBe("1906");
  expect(() => roundTrip({ ...state, travel: { destination: "", departure: "", checks: ["proof"] } })).toThrow();
});

test("restore rejects empty reviewed blocks, unknown decisions and oversized personal text without truncation", () => {
  const state = populated();
  const invalid: unknown[] = [
    { ...state, answers: { "power:person": { value: "", note: "  ", reviewed: true } } },
    { ...state, answers: { "power:health": { value: "Unlimited authority", note: "", reviewed: true } } },
    { ...state, answers: { "power:person": { value: "", note: "x".repeat(5001), reviewed: false } } },
    { ...state, answers: { "power:person": { value: "", note: "hidden\u0000text", reviewed: false } } },
    { ...state, vaccines: [{ ...state.vaccines[0], name: " " }] },
    { ...state, vaccines: [{ ...state.vaccines[0], name: "x".repeat(101) }] },
    { ...state, vaccines: [{ ...state.vaccines[0], batch: "x".repeat(81) }] },
    { ...state, vaccines: [{ ...state.vaccines[0], note: "x".repeat(1001) }] },
    { ...state, travel: { ...state.travel, destination: "x".repeat(101) } },
  ];
  for (const value of invalid) expect(() => roundTrip(value)).toThrow();
  expect(state.answers["power:person"].note).toBe("Ask a trusted person.\nKeep my own questions.");
});
