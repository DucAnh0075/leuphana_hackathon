export type Area = "overview" | "documents" | "prevention" | "vaccinations" | "travel";
export type DocumentId = "power" | "directive" | "guardian";
export type Answer = { value: string; note: string; reviewed: boolean };
export type Question = { id: string; title: string; purpose: string; prompt: string; caution?: string; options?: string[] };
export type CareDocument = { id: DocumentId; title: string; original: string; description: string; source: string; sourceLabel: string; modules: Question[] };
export type Vaccine = { id: string; name: string; date: string; product: string; batch: string; note: string };
export type WorkspaceState = {
  version: 1;
  planningFor?: "self" | "someone";
  selected: DocumentId[];
  answers: Record<string, Answer>;
  profile: { birthYear: string; programme: "all" | "women" | "men" };
  vaccines: Vaccine[];
  travel: { destination: string; departure: string; checks: string[] };
  completion: Record<string, string[]>;
};

export const STORAGE_KEY = "vora.workspace.v1";
export const SOURCES = {
  power: "https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html",
  directive: "https://www.bmjv.de/DE/themen/vorsorge_betreuungsrecht/patientenverfuegung/patientenverfuegung_node.html",
  guardian: "https://www.bmjv.de/DE/service/formulare/form_vorsorgevollmacht/form_vorsorgevollmacht_node.html",
  prevention: "https://www.g-ba.de/themen/methodenbewertung/ambulant/frueherkennung-krankheiten/",
  vaccinations: "https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Impfkalender/impfkalender-node.html",
  measles: "https://www.masernschutz.de/",
  travel: "https://www.auswaertiges-amt.de/de/reiseundsicherheit/reise-gesundheit",
  countries: "https://www.auswaertiges-amt.de/de/reiseundsicherheit/reise-und-sicherheitshinweise",
  epa: "https://www.gematik.de/anwendungen/epa",
};

const authorityOptions = ["Include this authority", "Do not include", "Discuss before deciding"];
export const DOCUMENTS: CareDocument[] = [
  {
    id: "power", title: "Power of attorney", original: "Vorsorgevollmacht",
    description: "Choose who can act for you, and precisely what they may do.",
    source: SOURCES.power, sourceLabel: "BMJV official form · January 2023",
    modules: [
      { id: "person", title: "Your trusted person", purpose: "A power of attorney authorises a person to act for you in the areas you explicitly grant.", prompt: "Who would you like to ask, and have you discussed the responsibility?", caution: "Use the original form for complete names, addresses and contact details. A trusted person must be willing and able to act." },
      { id: "health", title: "Health & care decisions", purpose: "Section 1, page 2: general health care, care arrangements and upholding your patient directive. The original form asks about especially serious medical risks and restrictive measures separately.", prompt: "Should your representative make general health and care decisions and uphold your patient directive?", options: authorityOptions, caution: "This answer does not decide the separate serious-risk or restrictive-measure permissions below. VORAcard records preparation, not a grant of authority." },
      { id: "serious-risk", title: "Treatment decisions with serious risks", purpose: "Section 1, page 2: a separate express authorisation covers consenting to, refusing or withdrawing consent to medical measures when death or serious, lasting harm may result.", prompt: "Should your representative have this specific authority for treatment decisions carrying those serious risks?", options: authorityOptions, caution: "This is a distinct decision from general health care. Discuss the scope and statutory safeguards with a qualified adviser. A power of attorney does not replace any required court approval." },
      { id: "records", title: "Medical records & confidentiality", purpose: "Section 1, page 2 addresses access to and release of medical records, confidentiality and permission to share information with others.", prompt: "Should your representative access medical records and receive confidential information? Note any questions about onward disclosure before completing the original.", options: authorityOptions },
      { id: "restrictions", title: "Restrictions: questions to clarify", purpose: "Section 1, page 2 distinguishes placement, individual restrictions, compulsory medical treatment and transport to hospital for such treatment. These are not one permission.", prompt: "What questions or concerns do you want to clarify before considering each of these separate authorities?", caution: "Previous notes remain here as context. They do not answer the individual permissions below. No authority is preselected, and the statutory conditions still apply." },
      { id: "placement", title: "Placement restricting liberty", purpose: "Section 1, page 2 contains an explicit permission concerning placement that deprives a person of liberty, subject to legal safeguards.", prompt: "Should your representative have the specific authority concerning a placement that restricts your liberty?", options: authorityOptions, caution: "This is not the same as choosing a place to live. The authorisation does not replace statutory conditions or court approval where required. Discuss this separately with a qualified adviser." },
      { id: "restrictive-measures", title: "Individual liberty-restricting measures", purpose: "Section 1, page 2 asks separately about measures that deprive a person of liberty, including qualifying restrictions through devices, medication or other means.", prompt: "Should your representative have the specific authority concerning these individual liberty-restricting measures?", options: authorityOptions, caution: "This is separate from placement and from ordinary medical consent. Statutory conditions and any required court approval remain necessary; do not infer this permission from another answer." },
      { id: "compulsory-treatment", title: "Compulsory medical treatment", purpose: "Section 1, page 2 separately addresses consent to compulsory medical measures. This is not ordinary consent to a treatment.", prompt: "Should your representative have the specific authority concerning compulsory medical treatment under the legal safeguards?", options: authorityOptions, caution: "This has strict statutory conditions and court-approval safeguards. A representative cannot use this authorisation as a general permission to override your wishes. Obtain professional clarification before deciding." },
      { id: "transport", title: "Transport for compulsory treatment", purpose: "Section 1, page 2 separately asks about transport to hospital for a compulsory medical measure.", prompt: "Should your representative have the specific authority concerning transport to hospital for a compulsory medical measure?", options: authorityOptions, caution: "This does not follow automatically from granting treatment authority. The statutory conditions and any required court approval still apply." },
      { id: "residence", title: "Residence & housing", purpose: "Section 2 covers deciding where you live, your tenancy and a care-home contract.", prompt: "What housing decisions should your representative be able to make?", options: authorityOptions },
      { id: "authorities", title: "Authorities & insurance", purpose: "Section 3 covers dealings with public authorities, insurers and social-benefit providers.", prompt: "Should your representative deal with authorities, insurance and social benefits?", options: authorityOptions },
      { id: "assets", title: "Money & property", purpose: "Section 4 covers assets and financial transactions, with room for exclusions.", prompt: "Which financial powers or exclusions do you want to discuss?", caution: "Real estate, consumer loans and some business transactions have additional form requirements. Ask your bank about its account/depot authorisation and seek notarial advice where needed." },
      { id: "post", title: "Post & digital communication", purpose: "Section 5 covers post, telecommunications and related legal transactions.", prompt: "What access to post, telecommunications or digital accounts should be possible?", options: authorityOptions, caution: "Keep passwords out of these notes. Consider a separate, secure access arrangement." },
      { id: "court", title: "Representation in court", purpose: "Section 6 concerns representation before courts and procedural acts.", prompt: "Should your representative be able to represent you in court?", options: authorityOptions },
      { id: "delegation", title: "Delegating authority", purpose: "Section 7 asks whether your representative may authorise someone else.", prompt: "Should your representative be able to grant a sub-authorisation?", options: authorityOptions },
      { id: "guardian", title: "Court-appointed support", purpose: "Section 8 records whom you would prefer if a court-appointed guardian is still needed.", prompt: "Who would you want the court to consider as your guardian?", caution: "A separate Betreuungsverfügung can record more detailed wishes. The court decides on appointment." },
      { id: "afterdeath", title: "After your death", purpose: "Section 9 asks whether the authority should continue beyond death.", prompt: "Should the authority remain effective after your death?", options: authorityOptions, caution: "This does not replace a will or decide inheritance." },
      { id: "additional", title: "Additional arrangements", purpose: "Section 10 provides space for additional rules and restrictions.", prompt: "What conditions, exclusions or questions should you clarify?" },
      { id: "signature", title: "Signature & original", purpose: "The original form ends with place, date and signatures. Access to the original matters when the authority is used.", prompt: "Where will the original be kept, and how will your representative find it?", caution: "A download from VORAcard is preparation only. Complete and sign the official form; clarify certification or notarisation requirements for your circumstances." },
    ],
  },
  {
    id: "directive", title: "Patient directive", original: "Patientenverfügung",
    description: "Connect specific treatment situations to your treatment wishes.",
    source: SOURCES.directive, sourceLabel: "BMJV guidance & text modules",
    modules: [
      { id: "situations", title: "Situations it should cover", purpose: "BMJV section 2.2, pages 1–2: a directive concerns defined situations in which you cannot form or communicate your own will.", prompt: "Which precisely described situations do you want to discuss: dying, terminal illness, permanent brain damage or advanced dementia? Give each a short label to use in the treatment blocks.", caution: "A diagnosis alone is not enough. The circumstances and expected course need individual clarification. A label is only a reference to your full situation description." },
      { id: "treatment", title: "Treatment in each situation", purpose: "BMJV sections 2.2–2.3 connect concrete situations with specific treatment wishes. Use this block to describe that connection and preserve any earlier general notes.", prompt: "Which of your named situations should each following treatment block address? Record any differences or open questions before considering the measures one by one.", caution: "A blanket statement such as ‘no life-prolonging measures’ is generally insufficient. Earlier general notes do not automatically answer any of the separate treatment blocks. VORAcard never preselects treatment choices." },
      { id: "resuscitation", title: "Resuscitation", purpose: "BMJV section 2.3 includes a separate resuscitation module. The intended situation matters, including how a foreseeable crisis differs from an unexpected emergency.", prompt: "For each situation you named, what wish or open question do you want to record about resuscitation? Name the situation beside the wish.", caution: "Discuss the possible outcomes, emergency circumstances and precise wording with a clinician. A note here is not a verified emergency treatment order." },
      { id: "ventilation", title: "Artificial ventilation", purpose: "BMJV section 2.3 treats artificial ventilation separately from other life-sustaining measures and symptom relief.", prompt: "For each situation you named, what wish or open question do you have about starting, continuing or ending artificial ventilation?", caution: "Name the relevant situation for each entry. Discuss what the options would mean and how breathlessness would be relieved; do not infer a choice from another treatment block." },
      { id: "nutrition", title: "Artificial nutrition", purpose: "BMJV section 2.3 addresses artificial nutrition and fluid administration. VORAcard separates them so one does not silently decide the other.", prompt: "In which of your named situations would you want to discuss artificial nutrition, and what wish or question applies in each?", caution: "Discuss the purpose, route and circumstances with a clinician. Your entry does not automatically decide fluid administration or ordinary assistance with eating and drinking." },
      { id: "hydration", title: "Artificial fluid administration", purpose: "BMJV section 2.3 includes artificial fluid administration in the nutrition-and-fluids module. It can require its own clarification.", prompt: "For each situation you named, what wish or open question do you have about artificial fluid administration?", caution: "Keep the situation explicit. Ask a clinician to clarify benefits, burdens and comfort measures; no choice is inferred from your nutrition notes." },
      { id: "dialysis", title: "Dialysis", purpose: "BMJV section 2.3 includes a distinct module for dialysis rather than treating all life-sustaining measures as one choice.", prompt: "For each situation you named, what wish or question applies to starting, continuing or ending dialysis?", caution: "A clinician can clarify the medical circumstances and possible consequences. Record situations and wishes together; an unanswered block stays open." },
      { id: "antibiotics", title: "Antibiotics", purpose: "BMJV section 2.3 addresses antibiotics separately, including the purpose for which treatment is given.", prompt: "In each situation you named, what would you like to clarify about antibiotics, including treatment goals and symptom relief?", caution: "The purpose of treatment matters. Discuss the available options without assuming that a wish about another measure also applies to antibiotics." },
      { id: "blood", title: "Blood & blood components", purpose: "BMJV section 2.3 contains a separate module for blood and blood components.", prompt: "For each situation you named, what wish or open question do you have about receiving blood or blood components?", caution: "Specify the relevant situation and discuss the treatment goal, alternatives and consequences with a clinician. No transfusion decision is preselected." },
      { id: "comfort", title: "Comfort & symptom relief", purpose: "BMJV section 2.3 addresses pain and symptom relief separately from decisions to start or stop other treatments.", prompt: "For the situations you named, what matters to you about relief of pain, breathlessness and anxiety? What should you clarify with a clinician?", caution: "Symptom relief needs its own discussion. A wish about a life-sustaining measure does not automatically describe how you want symptoms managed." },
      { id: "place-support", title: "Place of care & personal support", purpose: "BMJV section 2.4, page 4 records wishes about where care takes place and who should provide personal support.", prompt: "For the situations you named, where would you wish to receive care and whom would you want nearby? Note alternatives if a wish cannot be met.", caution: "These are wishes for discussion, not a guarantee that a particular place or service will be available." },
      { id: "values", title: "Your values", purpose: "Personal values can help interpret your wishes when a situation does not exactly match the directive.", prompt: "What does quality of life mean to you, and what should those caring for you understand?" },
      { id: "confidentiality", title: "Confidentiality & information", purpose: "BMJV section 2.5, page 5 addresses releasing medical confidentiality for named people. Receiving information and having authority to make decisions are distinct roles.", prompt: "In the situations covered by your directive, who should be allowed to receive medical information? What limits or questions should be clarified?", caution: "Naming an information recipient does not appoint them as your representative. Use the original document for identifying details and explicit confidentiality arrangements." },
      { id: "representative", title: "Who will uphold your wishes", purpose: "BMJV sections 2.6–2.7 address implementing the directive and its relationship to other documents. A patient directive records wishes; a separate power of attorney grants representation authority.", prompt: "For the situations you described, who should discuss and uphold your wishes with the treating team, and where is that person’s representation authority recorded?", caution: "Keep an information contact, a trusted supporter and an authorised representative distinct. Resolve inconsistencies between the directive and other documents before signing." },
      { id: "organ-donation", title: "Organ donation & treatment wishes", purpose: "BMJV section 2.9, page 6 addresses organ donation and a possible conflict with restrictions on treatment in a patient directive.", prompt: "What have you already recorded about organ donation, and how should possible conflicts with the treatment wishes in your named situations be clarified?", caution: "Do not assume that one document automatically takes priority. Discuss the circumstances, necessary measures and any intended priority explicitly; VORAcard selects neither consent nor refusal." },
      { id: "consultation", title: "Medical discussion", purpose: "A clinician can help connect wording to the medical situations and options you intend.", prompt: "What questions will you bring to your medical consultation?", caution: "Use the official BMJV modules with professional support where needed. This workspace does not provide individual medical or legal advice." },
      { id: "signature", title: "Signature, access & review", purpose: "A patient directive must be in writing and signed. It can be revoked at any time without a required form.", prompt: "Where will you keep it, who will have a copy, and when would you revisit your wishes?", caution: "There is no general mandatory expiry period. Revisit it when your wishes or circumstances change." },
    ],
  },
  {
    id: "guardian", title: "Care directive", original: "Betreuungsverfügung",
    description: "Tell a court who you would want as a guardian and how you wish to be supported.",
    source: SOURCES.guardian, sourceLabel: "BMJV official care-directive form",
    modules: [
      { id: "preferred", title: "Your preferred guardian", purpose: "You can name someone you would like a court to appoint if legal guardianship becomes necessary.", prompt: "Whom would you prefer, and have you spoken with them?", caution: "This document does not grant representation powers. The court appoints a guardian and considers your wishes and suitability." },
      { id: "alternative", title: "Alternatives & exclusions", purpose: "You can name an alternative and people you do not want appointed.", prompt: "Who is an alternative, or should not be appointed?" },
      { id: "wishes", title: "Your everyday wishes", purpose: "Your wishes can guide how the guardian supports you in daily life, housing and personal affairs.", prompt: "Which habits, relationships and living arrangements matter to you?" },
      { id: "signature", title: "Sign & make it findable", purpose: "Record place and date, sign the form and let a trusted person know where it is kept.", prompt: "Where will the signed form be kept and who will know?", caution: "Registration in the Central Register of Lasting Powers of Attorney can help a court find the information. Check the register’s current services and requirements separately; registration does not replace completing and signing your document." },
    ],
  },
];

export function emptyWorkspace(): WorkspaceState {
  return { version: 1, planningFor: "self", selected: [], answers: {}, profile: { birthYear: "", programme: "all" }, vaccines: [], travel: { destination: "", departure: "", checks: [] }, completion: {} };
}
export function answerKey(doc: DocumentId, module: string) { return `${doc}:${module}`; }
export function progress(doc: CareDocument, state: WorkspaceState) {
  return doc.modules.filter(module => state.answers[answerKey(doc.id, module.id)]?.reviewed).length;
}
function workspaceRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function workspaceKeys(value: Record<string, unknown>, keys: string[], optional: string[] = []): boolean {
  return keys.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => keys.includes(key) || optional.includes(key));
}
function workspaceText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}
function workspaceChoices(value: unknown, choices: string[]): value is string[] {
  return Array.isArray(value) && value.length <= choices.length &&
    value.every(item => typeof item === "string" && choices.includes(item)) && new Set(value).size === value.length;
}
function workspaceDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Reject corrupt storage as a whole; never silently discard or rewrite personal notes. */
export function parseWorkspace(raw: string, today = new Date()): WorkspaceState {
  if (typeof raw !== "string" || raw.length > 1_000_000 || !Number.isFinite(today.getTime())) throw new Error("Unsupported saved workspace");
  const state: unknown = JSON.parse(raw);
  const documentIds = DOCUMENTS.map(doc => doc.id);
  if (!workspaceRecord(state) || !workspaceKeys(state, ["version", "selected", "answers", "profile", "vaccines", "travel", "completion"], ["planningFor"]) ||
      state.version !== 1 || !workspaceChoices(state.selected, documentIds) || !workspaceRecord(state.answers) ||
      !workspaceRecord(state.profile) || !workspaceRecord(state.travel) || !Array.isArray(state.vaccines) || !workspaceRecord(state.completion) ||
      (state.planningFor !== undefined && state.planningFor !== "self" && state.planningFor !== "someone")) {
    throw new Error("Unsupported saved workspace");
  }

  const { profile, travel } = state;
  if (!workspaceKeys(profile, ["birthYear", "programme"]) || !workspaceText(profile.birthYear, 4) ||
      (profile.birthYear !== "" && (!/^\d{4}$/.test(profile.birthYear) || Number(profile.birthYear) < today.getFullYear() - 120 || Number(profile.birthYear) > today.getFullYear())) ||
      typeof profile.programme !== "string" || !["all", "women", "men"].includes(profile.programme)) throw new Error("Invalid saved profile");

  if (!workspaceKeys(travel, ["destination", "departure", "checks"]) || !workspaceText(travel.destination, 100) ||
      !workspaceChoices(travel.checks, ["country", "entry", "consultation", "proof", "documents"]) ||
      (travel.destination === "" ? travel.departure !== "" || travel.checks.length !== 0 : !travel.destination.trim() || !workspaceDate(travel.departure))) {
    throw new Error("Invalid saved trip");
  }

  const modules = new Map(DOCUMENTS.flatMap(doc => doc.modules.map(module => [answerKey(doc.id, module.id), module] as const)));
  for (const [key, answer] of Object.entries(state.answers)) {
    const question = modules.get(key);
    if (!question || !workspaceRecord(answer) || !workspaceKeys(answer, ["value", "note", "reviewed"]) ||
        !workspaceText(answer.value, 5000) || !workspaceText(answer.note, 5000) || typeof answer.reviewed !== "boolean" ||
        (question.options && answer.value !== "" && !question.options.includes(answer.value)) ||
        (answer.reviewed && !answer.value.trim() && !answer.note.trim())) throw new Error("Invalid saved document");
  }

  if (state.vaccines.length > 500) throw new Error("Too many saved vaccination entries");
  const vaccineIds = new Set<string>();
  const currentDate = today.toISOString().slice(0, 10);
  for (const vaccine of state.vaccines) {
    if (!workspaceRecord(vaccine) || !workspaceKeys(vaccine, ["id", "name", "date", "product", "batch", "note"]) ||
        !workspaceText(vaccine.id, 80) || !/^[a-zA-Z0-9_-]+$/.test(vaccine.id) || vaccineIds.has(vaccine.id) ||
        !workspaceText(vaccine.name, 100) || !vaccine.name.trim() || !workspaceDate(vaccine.date) || vaccine.date > currentDate ||
        !workspaceText(vaccine.product, 100) || !workspaceText(vaccine.batch, 80) || !workspaceText(vaccine.note, 1000)) {
      throw new Error("Invalid saved vaccination record");
    }
    vaccineIds.add(vaccine.id);
  }

  for (const [id, checks] of Object.entries(state.completion)) {
    if (!documentIds.includes(id as DocumentId) || !workspaceChoices(checks, ["0", "1", "2", "3"])) throw new Error("Invalid saved checklist");
  }
  // Deselected documents may retain notes, as explicitly promised by the selection UI.
  return { ...state, planningFor: state.planningFor ?? "self" } as WorkspaceState;
}

export function preparationText(doc: CareDocument, state: WorkspaceState): string {
  return [
    `VORAcard — ${doc.title} (${doc.original})`,
    "PREPARATION NOTES — NOT A SIGNABLE LEGAL DOCUMENT",
    "These are your notes, not a completed official form, medical advice or legal advice.",
    `Official source: ${doc.source}`,
    ...doc.modules.map(module => {
      const answer = state.answers[answerKey(doc.id, module.id)];
      return `\n${module.title}\n${module.prompt}\n${answer?.value || "Open — no decision recorded"}\n${answer?.note || "No notes"}\nReview: ${answer?.reviewed ? "reviewed by you" : "not reviewed"}`;
    }),
    "\nNEXT STEPS\nClarify open questions. Transfer decisions into the official form or BMJV text modules. Check required formalities, sign, store the original and inform your representative. This export does not certify validity.",
  ].join("\n");
}

export type PreventionOffer = { id: string; title: string; group: "all" | "women" | "men"; min: number; max?: number; schedule: string; detail: string };
export const PREVENTION: PreventionOffer[] = [
  { id: "checkup-young", title: "General health check-up", group: "all", min: 18, max: 34, schedule: "Once between 18 and 34", detail: "A statutory health-insurance benefit. The scope of tests depends on age and risk factors." },
  { id: "checkup", title: "General health check-up", group: "all", min: 35, schedule: "Every 3 years from 35", detail: "Includes a once-only hepatitis B and C screening offer from age 35." },
  { id: "skin", title: "Skin cancer screening", group: "all", min: 35, schedule: "Every 2 years from 35", detail: "A visual examination of the skin by a qualified clinician." },
  { id: "cervical-young", title: "Cervical cancer screening", group: "women", min: 20, max: 34, schedule: "Annual cytology from 20 to 34", detail: "For people in the statutory cervical-screening programme; individual eligibility should be checked with the practice." },
  { id: "cervical", title: "Cervical cancer screening", group: "women", min: 35, schedule: "HPV + cytology every 3 years from 35", detail: "The combined screening offer is distinct from an annual clinical gynaecological examination." },
  { id: "breast", title: "Clinical breast examination", group: "women", min: 30, schedule: "Annually from 30", detail: "Includes examination and guidance on breast awareness." },
  { id: "mammography", title: "Mammography screening", group: "women", min: 50, max: 75, schedule: "Every 2 years, ages 50–75", detail: "Organised screening programme. Participation is voluntary; the programme explains benefits and harms." },
  { id: "bowel", title: "Colorectal cancer screening", group: "all", min: 50, schedule: "From 50: colonoscopy or stool test", detail: "Two screening colonoscopies at least 10 years apart, or an immunological stool test every 2 years. Discuss the programme choices with a practice." },
  { id: "prostate", title: "Prostate & genital examination", group: "men", min: 45, schedule: "Annually from 45", detail: "The statutory offer includes palpation. A PSA blood test is not part of this standard screening benefit." },
  { id: "aorta", title: "Abdominal aortic aneurysm screening", group: "men", min: 65, schedule: "Once from 65", detail: "Ultrasound screening offered to men covered by statutory health insurance." },
];
