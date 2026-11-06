export type AppointmentBrief = { purpose: string; specialty: string; location: string };
export type DemoSlot = { id: string; startsAt: string; endsAt: string };
export type DemoPractice = { id: string; name: string; detail: string; slots: DemoSlot[] };
export type DemoSelection = { practice: DemoPractice; slot: DemoSlot };
export type DemoReceipt = DemoSelection & { id: string; createdAt: string };

// This model has no provider adapter or persistence. Only an explicit start enters it.
export type DemoState =
  | { step: "off" | "prepare" }
  | { step: "practices"; brief: AppointmentBrief; practices: DemoPractice[]; notice?: string }
  | { step: "review"; brief: AppointmentBrief; practices: DemoPractice[]; selection: DemoSelection }
  | { step: "confirmed" | "cancelled"; brief: AppointmentBrief; receipt: DemoReceipt };

export type DemoAction =
  | { type: "start" }
  | { type: "preview"; brief: AppointmentBrief; now: Date }
  | { type: "select"; practiceId: string; slotId: string }
  | { type: "back" }
  | { type: "edit" }
  | { type: "confirm"; now: Date; id: string }
  | { type: "cancel" }
  | { type: "exit" };

export function createDemoPractices(now: Date): DemoPractice[] {
  const slot = (day: number, hour: number): DemoSlot => {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() + day);
    start.setUTCHours(hour, 0, 0, 0);
    const startsAt = start.toISOString();
    return { id: startsAt, startsAt, endsAt: new Date(start.getTime() + 30 * 60_000).toISOString() };
  };
  return [
    { id: "demo-courtyard", name: "VORAcard Demo Practice — Courtyard", detail: "In-person visit · 30 minutes", slots: [slot(1, 9), slot(1, 13), slot(2, 10)] },
    { id: "demo-riverside", name: "VORAcard Demo Practice — Riverside", detail: "In-person visit · 30 minutes", slots: [slot(2, 8), slot(3, 12), slot(4, 14)] },
    { id: "demo-garden", name: "VORAcard Demo Practice — Garden", detail: "Example of a practice with no times", slots: [] },
  ];
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "start": return state.step === "off" ? { step: "prepare" } : state;
    case "exit": return { step: "off" };
    case "edit": return state.step === "off" ? state : { step: "prepare" };
    case "preview": {
      if (state.step !== "prepare" || !action.brief.purpose || !action.brief.specialty || !action.brief.location.trim()) return state;
      return { step: "practices", brief: { ...action.brief, location: action.brief.location.trim() }, practices: createDemoPractices(action.now) };
    }
    case "select": {
      if (state.step !== "practices") return state;
      const practice = state.practices.find(item => item.id === action.practiceId);
      const slot = practice?.slots.find(item => item.id === action.slotId);
      if (!practice || !slot) return state;
      return { step: "review", brief: state.brief, practices: state.practices, selection: { practice, slot } };
    }
    case "back": return state.step === "review" ? { step: "practices", brief: state.brief, practices: state.practices } : state;
    case "confirm": {
      // The state guard makes repeated clicks idempotent; only one receipt survives.
      if (state.step !== "review") return state;
      if (Date.parse(state.selection.slot.startsAt) <= action.now.getTime()) {
        return { step: "practices", brief: state.brief, practices: createDemoPractices(action.now), notice: "That demo time has passed. Choose a new example time." };
      }
      return { step: "confirmed", brief: state.brief, receipt: { ...state.selection, id: action.id, createdAt: action.now.toISOString() } };
    }
    case "cancel": return state.step === "confirmed" ? { ...state, step: "cancelled" } : state;
  }
}

export function formatDemoTime(value: string, locale: "de" | "en" = "en") {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { timeZone: "Europe/Berlin", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

function calendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\n|\r/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldCalendarLine(value: string) {
  const encoder = new TextEncoder();
  let line = "";
  let bytes = 0;
  const lines: string[] = [];
  for (const character of value) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) { lines.push(line); line = " "; bytes = 1; }
    line += character;
    bytes += length;
  }
  return [...lines, line].join("\r\n");
}

export function demoCalendar(receipt: DemoReceipt) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // No user-entered location, purpose, profile, or medical notes are exported.
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VORA//Appointment Demo//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${calendarText(receipt.id)}@vora.invalid`, `DTSTAMP:${stamp(receipt.createdAt)}`,
    `DTSTART:${stamp(receipt.slot.startsAt)}`, `DTEND:${stamp(receipt.slot.endsAt)}`,
    "SUMMARY:DEMO - VORAcard appointment (no real booking)",
    `DESCRIPTION:${calendarText(`${receipt.practice.name}. Fictional practice and time. No real booking. Do not attend. Delete this example from your calendar after trying the demo.`)}`,
    "LOCATION:Fictional demo practice - do not attend", "STATUS:TENTATIVE", "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR", "",
  ].map(foldCalendarLine).join("\r\n");
}
