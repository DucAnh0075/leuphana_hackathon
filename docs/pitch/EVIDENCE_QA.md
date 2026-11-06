# VORA pitch evidence and jury answers

Prepared 6 November 2026 for the Leuphana AI Hackathon Open Track.
Purpose: source-backed wording and concise English answers for the pitch team.
Product baseline: repository commit `6ec45fe`; later Consumer/VORA commits and local work are not part of that demonstration.
External sources were checked for the initial package on 6 November 2026; the family-first revision retains those findings without claiming a new external-source review. This file does not certify clinical use or legal validity.

## Read this before rehearsing

- **Source fact** means an independently checked statement with its date and population below.
- **Implemented baseline** means behavior described in the repository at `6ec45fe`, not proof of a live deployment.
- **Proposal** means our recommended business or evaluation hypothesis; it is not an adopted team decision or measured result.
- **Product vision** means Henri's family-first direction: prepare, understand, organize, share selectively and stay current, with a path into care. It does not establish completed functionality or measured benefit.
- **Later VORA work** includes committed development through `258338b` and additional local changes; do not describe it all as uncommitted or promise it is in the pinned demo.
- Keep the demo synthetic. Distinguish a document arriving in the clinical inbox from a confirmed import into the patient record.

Baseline references: [repository overview](../../README.md), [care setup and limits](../CARE-SETUP.md), [consumer concept](../UI-CONSUMER-ERWEITERUNG.md).

## Evidence suitable for slides

| ID | Verified source fact | Safe English pitch wording | Scope and limitation |
|---|---|---|---|
| E1 | DEAS 2023: approximately half reported none of three advance-care documents; 44.6% had an advance directive. [DZA authors, Sozialbericht 2024, pp. 100–101](https://www.bpb.de/system/files/dokument_pdf/2.7.pdf) | “In Germany's 2023 Ageing Survey, around half of people aged 45–90 reported having neither an advance directive, a power of attorney nor a guardianship directive.” | Weighted survey of ages 45–90. Self-reported possession, not quality, validity or availability during treatment. Do not generalize to all adults. |
| E2 | Germany had 1,841 hospitals in 2024. [Destatis, updated 27 November 2025](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Gesundheit/Krankenhauser/Tabellen/eckzahlen-krankenhaeuser.html) | Appendix only: “Germany had 1,841 hospitals in 2024; that is context for potential clinical partners.” | Hospital count is neither the family market nor revenue TAM or validated buyers. Groups can purchase centrally. The earlier hospital-payer proposal is one option, not the accepted core business model. |
| E3 | ZVR year-end 2025: 6,817,992 registered directives, adjusted for deletions; physicians received information in 421 cases during 2025. [ZVR annual report, pp. 1–2](https://www.vorsorgeregister.de/fileadmin/user_upload_zvr/Dokumente/Jahresberichte_ZVR/2025-JB-ZVR.pdf) | Appendix only: “The ZVR reported 421 physician information cases in 2025, alongside more than 6.8 million registered directives at year-end.” | Stock and annual cases have different denominators. No nationwide document-use rate, clinical failure rate or cost-saving conclusion follows. Other access channels are not counted. |
| E4 | ZVR's latest quarterly table reports 7,190,433 entries at 30 September 2026. [ZVR statistics 2026](https://www.vorsorgeregister.de/fileadmin/user_upload_zvr/Dokumente/Statistiken_ZVR/2026-Statistik-ZVR.pdf) | “The national register reported more than 7.1 million entries by September 2026.” | The quarterly label is total entries. Keep its date and definition separate from E3's adjusted year-end figure. It shows an established ecosystem, not demand for our product. |
| E5 | From 1 October 2026 institutional users can deposit electronic copies in ZVR; authorized treating physicians and courts can inspect them. [Bundesnotarkammer circular, 30 September 2026](https://www.bnotk.de/aufgaben-und-taetigkeiten/rundschreiben/details/aenderungen-im-zentralen-vorsorgeregister-der-bundesnotarkammer-zvr-zum-1-oktober-2026) | “The national register now supports document copies. Our prototype explores preparation and hospital review workflows around existing infrastructure.” | Private users cannot upload copies in their own registration. Do not claim ZVR stores metadata only or that our prototype is integrated with it. |
| E6 | Patients can upload documents to ePA; ePA records document access and permits replacing documents with new versions. [BMG overview](https://www.bundesgesundheitsministerium.de/epa-na-sicher), [gematik FAQ](https://www.gematik.de/anwendungen/epa-fuer-alle/faq) | “The ePA already supports document exchange and access records. We would test whether our focused workflow adds value alongside it.” | Do not claim sharing, versioning or traceability are unique to us. No implemented ePA integration is established. |

Use E1 on the problem slide. Keep E2–E6 for questions and the appendix; none establishes willingness to pay, the reasons for postponing preparation or lower family stress. The family-first scenario comes from Henri's brief, retained verbatim in the [package overview](README.md), and remains a problem hypothesis until researched with users.

## Versioned scope: demo, later work and vision

This distinction prevents two opposite errors: advertising the full vision as working, or claiming the current project has no model connection because the older demo does not.

| Scope | Observed implementation / evidence | Boundary |
|---|---|---|
| Fixed demo, `6ec45fe` | Synthetic documents, selected versions sent to one configured clinic, case confirmation, receipt and prepared source links. | No runtime model call in this baseline; not a family-sharing account system. |
| Later VORA: published `ac306cf`, local commit `258338b` | Guided planning for oneself or a supported person, document blocks, general age/program-filtered prevention information and an OpenAI Responses adapter. [Published README](https://github.com/DucAnh0075/leuphana_hackathon/blob/ac306cf/README.md), [published model adapter](https://github.com/DucAnh0075/leuphana_hackathon/blob/ac306cf/lib/vora-assistant.ts). Local commit `258338b` adds appointment preparation and text download; its remote publication was not confirmed at this review. | Implemented code is not proof that the combined latest flow or a live model dialogue was successfully demonstrated. General information is not exhaustive individual medical guidance. |
| Additional local work at the 6 November read | Further model sign-in work; fictional practice/slot/calendar journey; Demo-ePA consent with two fixed synthetic vaccination rows and health-pass screens. | Outside the pushed pitch baseline. Sign-in reported by the user is not a recorded completed model dialogue; fictional booking is not a real appointment, and Demo-ePA is not live ePA. |
| Family-first product vision | Persistent per-document permissions for relatives; family overview; ongoing changes/reminders; eventual care-system connection. | Current sharing roles are owner/clinic, with one configured clinic. No family invitation/account flow or verified family permission enforcement is established. A notary appears as a possible clarification step, not an integrated booking service. |

This snapshot records a code/document read, not new application tests. The latest running build and any uncommitted changes still require their own rehearsal before replacing the pinned demo.

## Product claims: what can we actually say?

| Claim | Status and defensible wording | Do not say |
|---|---|---|
| Existing-document handoff | Baseline: synthetic personal view → clinical inbox → confirmed case assignment → record update → receipt. | “A scan automatically imports a clinically verified record.” |
| Source-linked review | Baseline: prepared statements link to a document, version and page; mappings are authored and checked against the PDFs. | “AI reads arbitrary uploaded documents and verifies them.” |
| Runtime assistant | `6ec45fe`: deterministic assistance. Later VORA code has a model adapter, outside this demo. | “An LLM answered in this demo” without observing that run; or the opposite blanket claim “VORA has no model integration.” |
| AI development assistance | AI-assisted development can be disclosed; the team must confirm tools, roles and actual contributions. | An invented model, contribution percentage, training process or team role. |
| Personal planning | Later VORA work: guided preparation and text export, separate from the existing-document handoff. | “A newly created legally valid directive flows straight into the hospital.” |
| Selective family sharing | Product goal: allow a relative to see a power of attorney while keeping a vaccination record private. Baseline only selects document versions for one clinic. | “Every relative already has independently enforced per-document access.” |
| Appointments and staying current | Later code prepares appointment information; local additions simulate booking. Real booking, ongoing reminders and change monitoring are unproven. | “We book the appointment” or “we automatically keep all family documents current.” |
| Access controls | Code contains Supabase/session and RLS provisions; actual configured cloud behavior remains unproven. | “Production security, compliance and cloud isolation are verified.” |
| NFC | Baseline supports a card-event route and synthetic simulation. Intended card role: access trigger, subject to permissions. Physical tag/phone behavior is unproven. | “The card stores the whole file,” “anyone tapping it can read everything,” or “physical NFC is proven.” |
| Hospital integration | The clinical workspace is a simulated demonstrator with synthetic records. | “Connected to a real hospital information system.” |
| Deployment | A historic Vercel address exists; deployment of the selected feature version is unconfirmed. | “This exact version is live” without checking it. |
| Legal/clinical outputs | Synthetic, non-binding examples support human review. | “Legally valid generated directives,” “automatic treatment decisions” or “clinical approval.” |
| Value | Clearer next steps, better preparation, greater family confidence and less retrieval effort are hypotheses to evaluate. | Proven stress reduction, a fully protected family, cost savings or improved clinical outcomes. |

## Jury answers in English

### 1. What problem are you solving, and for whom?

“Our primary users are people preparing for themselves and their families. We want to make a difficult, easily postponed task more manageable: understand the next step, organize the documents, decide who may see them and keep them useful over time. The survey supports a preparation gap; our explanation of stress and postponement still needs user research. Today's demo shows the hospital handoff section of that larger journey.”

### 2. What works today?

“In the pinned prototype we are demonstrating, a synthetic person shares selected versions of existing documents with one clinic. The clinical user confirms their assignment to the patient case and imports them. The personal view shows the receipt, and the clinical view opens the original source passage. Later VORA development adds planning and appointment preparation, but we do not present it as demonstrated by this earlier run.”

### 3. Where is the AI?

“The pinned demo uses deterministic assistance and prepared source mappings. Later VORA code includes a language-model adapter for guidance; that code is outside the demonstration you just saw. We distinguish an implemented model connection, a successfully observed model response and an evaluated product. We are not claiming arbitrary document extraction or clinical reliability. AI-assisted development is a separate contribution we disclose.”

Operator note: describe the build actually shown. If a newer live-model path is selected, record its exact version and successful rehearsal before changing this answer. Team-confirmed development tools and contributions: **[fill in actual tools, people and tasks]**.

### 4. Are the source links generated automatically?

“No. The synthetic examples and their links to document, version, page and passage are prepared in the dataset. The generator checks those references against the resulting PDFs. This demonstrates an inspectable review interface; it does not establish reliable extraction from unseen documents.”

### 5. Why not just use ZVR or ePA?

“They already provide important registration, document and access infrastructure. ZVR has supported document copies since October 2026, and ePA supports document exchange. Our vision starts earlier: helping people and families prepare, keep track of next steps and choose what to share. We want to connect that preparation to existing care infrastructure. Real integration and the additional value for families and clinicians still need validation.”

### 6. What is your innovation?

“Our product hypothesis is continuity: prepare for yourself and your family, organize the next steps, control document sharing and make the relevant information accessible in care. Today's handoff and source review demonstrate one section. The full end-to-end family journey is our direction, not a claim that every connection already works. We have not established market uniqueness or clinical superiority.”

### 7. What prevents a wrong interpretation from affecting care?

“The prototype shows the original source and keeps case-assignment confirmation separate from receiving a document. It does not determine whether a statement applies to the current clinical situation. Qualified people must make that judgment. Before real use, we would need to validate identity, document quality, interpretation and the clinical workflow.”

### 8. What about privacy and security?

“Our demonstration uses synthetic people and documents. The repository includes access-control and private-document mechanisms for a Supabase mode, but real cloud authentication, applied RLS and operational security have not been demonstrated. The synthetic demo identifier is not an authentication credential. We are not claiming production readiness or a compliance certification.”

### 9. Does the card work, and are you connected to a real hospital?

“The card is intended as an access trigger, not storage for the PDFs or permission to read everything. The baseline has a software scan route; today's main demo uses the explicit handoff in a simulated hospital workspace. Physical tag and phone behavior still need testing. We want to explore KIS or ePA integration, but neither is established by this demonstration.”

### 10. Who would pay, and what is the business model?

“People and families are the primary users. We have not chosen or validated the payer. A family-paid service and access funded by an institution are two options to test. Our earlier hospital-workflow proposal remains an option, not an agreed business model. We need user and buyer conversations, including whether the service is useful enough to maintain over time. Pricing and willingness to pay remain open.”

### 11. How much time or money do you save?

“We have not measured savings. We would compare the existing workflow with the prototype on the same kinds of tasks: finding the relevant document, completing a handoff and checking a statement against its source. We would measure time, completion, corrections and staff effort before estimating financial impact.”

### 12. What did you build during the hackathon, and what comes next?

“We distinguish inherited materials, AI-assisted development and each person's work on the submission slide. The pinned demonstrator includes synthetic clinical records, source-linked review and document handoff; later VORA development is identified separately. Next we need people and families to test preparation and sharing needs, plus clinical and integration partners to test the connection to care.”

Operator note: only retain work in this answer that the team confirms was built during the event. Team names, contributions, dates and prior work: **[complete on submission slide]**. Do not present inherited code or preparation as event output.

### 13. Can I share a power of attorney without sharing my vaccination record?

“That is a core requirement of the family product vision. Each person should choose the recipient and the documents, without blanket access to everything. Today's baseline demonstrates selecting versions for a clinic. It does not yet implement relative accounts and persistent per-document family permissions. Viewing a document also does not grant the legal authority described in it.”

### 14. Are you promising all preventive care in one app?

“We aim to provide a calm place for information, documents and next steps. Later VORA work includes general prevention information and preparation flows. We cannot promise that it identifies every relevant topic for every person. Personal clinical advice, legal questions and specialist appointments still require the appropriate professionals; their actual service integrations are not established here.”

### 15. Why act before a doctor raises a concern?

“The goal is to make preparation possible before urgency adds pressure. We are not saying that a doctor's concern means it is already too late, or that preventive care only begins after symptoms. A conversation can also be a useful prompt to act. Whether VORA helps people start earlier and feel less burdened is something we need to test.”

### 16. Does helping a family member give me access to their information?

“No automatic family access is intended. Helping someone prepare, permission to view a document and authority to act on their behalf are different things. The product must represent those distinctions clearly. The current synthetic owner-to-clinic handoff does not validate a real family's consent or access rules, and our family-sharing design still needs implementation and testing.”

## User and buyer hypotheses, with a measurable first pilot

This is a proposed validation plan, not an agreed commercial commitment or a clinical trial.

| Decision | Prepared proposal | Evidence still needed |
|---|---|---|
| Primary user | People preparing for themselves and their families; clinical staff receive relevant information later in the journey. | Family interviews and observed preparation tasks; clinical review of the handoff needs. |
| Buyer | Undecided: compare family-paid use with institution-funded access. The earlier hospital-buyer proposal is retained as one option. | Willingness to pay, actual budget owner, procurement and whether value persists over time. |
| Offering | Guided preparation, organization and controlled sharing; evaluate care-system connection separately. | What users return for, what may be shared, integration/support effort and acceptable terms. |
| Pricing | Keep pricing explicitly unvalidated; no invented annual price or revenue projection. | Buyer interviews and an agreed, costed pilot scope. |
| First evaluation | Family preparation/usability sessions, then a supervised clinical handoff comparison using synthetic cases. | Participants, appropriate consent, clinical reviewer, representative tasks and review procedure. |
| Go/no-go | Agree quality and usability criteria before collecting results. | Team and clinical owner must set criteria; none have been invented here. |

Suggested paired comparison: have participants complete comparable tasks using the current method and the prototype. Vary the order to reduce learning effects. Include outdated versions, missing documents and ambiguous passages, not only the happy path.

| Measure | Operational definition | Interpretation limit |
|---|---|---|
| Preparation progress | Whether a participant can identify a next step and complete the chosen synthetic preparation task. | Does not certify a legally valid document or complete family preparedness. |
| Permission understanding | Whether a participant correctly identifies which recipient can see each document in a proposed sharing task. | A design exercise is not proof that access controls enforce those choices. |
| Perceived burden | Ask the same short ease/burden question before and after the task, retaining the participant's explanation. | A small usability session does not establish durable stress reduction. |
| Retrieval time | Time from task start to opening the correct document version and requested passage. | A faster wrong result is not a success; record correctness separately. |
| Handoff completion | Requested packages with correct case assignment, explicit receipt and confirmed import divided by all attempted packages. | Report sample size and reasons for incomplete tasks. |
| Review accuracy | Reviewer assessment of whether a displayed statement and source reference match the original. | Clinical applicability is a separate judgment; do not combine them. |
| Corrections and errors | Wrong case, wrong version, missing source, unsupported interpretation and corrections before/after confirmation. | Preserve failed attempts; do not silently remove them from results. |
| Staff effort | Observed active minutes and task interruptions by role. | Do not convert elapsed time directly into cost savings. |
| User experience | Participant comments and a consistently asked ease/confidence question after each task. | Confidence is not proof of accuracy or safety. |
| Operational effort | Configuration, integration, support and recovery effort encountered during the pilot. | Local demo operation does not establish production cost. |

Report denominators, task mix, errors and uncertainty alongside any averages. No targets, pilot participants, measured improvements or savings have been supplied yet.

## Coverage of the four judging criteria

| Criterion | Material already prepared | Honest boundary / team action |
|---|---|---|
| Problem and business potential | Family-first scenario, E1, preparation/sharing needs and explicit payer options. | Supply actual user insights if available. No invented interview, stress-reduction or revenue claims. |
| AI and technical implementation | Pinned existing-document handoff, source-linked review and separately identified later VORA model adapter. | State which build and model behavior was actually shown; confirm coding contributions. Cloud, hardware and real integration remain unproven. |
| Innovation | Proposed continuity from family preparation and selective sharing to inspectable care handoff. | Acknowledge current ZVR/ePA capabilities; distinguish product vision from implemented connections. |
| Communication | One concrete synthetic case; English answers above; visible transitions and an explicit closing ask. | Rehearse with a stopwatch; confirm speakers, team ID, upload and actual demo environment. |

## Final factual review before submission

- [ ] Keep the 45–90 age range and 2023 survey year next to E1.
- [ ] Describe the hospital count as a potential institutional universe, not a revenue forecast.
- [ ] Keep ZVR's October 2026 document capability in competitive answers.
- [ ] Confirm every product statement against the version actually being demonstrated.
- [ ] Keep family permissions, real booking/reminders and KIS/ePA integration labelled by their actual state.
- [ ] Do not infer doctor time pressure, register non-use or “too late” from the survey or register counts.
- [ ] Label physical scan simulation, prepared mappings and deterministic assistance accurately.
- [ ] Confirm development-tool disclosure and each person's contribution with the team.
- [ ] List prior preparation and inherited work on the submission slide.
- [ ] Remove any unsupported promise of legal validity, clinical benefit, compliance or savings.

These are factual review prompts for this package, not a replacement for the lead's shared preparation checklist.
