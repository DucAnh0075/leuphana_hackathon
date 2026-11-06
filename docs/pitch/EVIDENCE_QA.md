# Pitch evidence and jury answers

Prepared 6 November 2026 for the Leuphana AI Hackathon Open Track.
Purpose: source-backed wording and concise English answers for the pitch team.
Product baseline: repository commit `6ec45fe`; later local consumer UI work is not part of that baseline.
External sources were checked on 6 November 2026. This file does not certify clinical use or legal validity.

## Read this before rehearsing

- **Source fact** means an independently checked statement with its date and population below.
- **Implemented baseline** means behavior described in the repository at `6ec45fe`, not proof of a live deployment.
- **Proposal** means our recommended business or evaluation hypothesis; it is not an adopted team decision or measured result.
- **Later local UI** means the separately reported, uncommitted planning extension; do not promise it is in the pushed baseline.
- Keep the demo synthetic. Distinguish a document arriving in the clinical inbox from a confirmed import into the patient record.

Baseline references: [repository overview](../../README.md), [care setup and limits](../CARE-SETUP.md), [consumer concept](../UI-CONSUMER-ERWEITERUNG.md).

## Evidence suitable for slides

| ID | Verified source fact | Safe English pitch wording | Scope and limitation |
|---|---|---|---|
| E1 | DEAS 2023: approximately half reported none of three advance-care documents; 44.6% had an advance directive. [DZA authors, Sozialbericht 2024, pp. 100–101](https://www.bpb.de/system/files/dokument_pdf/2.7.pdf) | “In Germany's 2023 Ageing Survey, around half of people aged 45–90 reported having neither an advance directive, a power of attorney nor a guardianship directive.” | Weighted survey of ages 45–90. Self-reported possession, not quality, validity or availability during treatment. Do not generalize to all adults. |
| E2 | Germany had 1,841 hospitals in 2024. [Destatis, updated 27 November 2025](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Gesundheit/Krankenhauser/Tabellen/eckzahlen-krankenhaeuser.html) | “Germany has 1,841 hospitals. Our initial customer hypothesis is hospital teams handling planned admissions and advance-care documentation.” | Hospital count is a potential institutional universe, not revenue TAM or validated buyers. Groups can purchase centrally. The customer focus is our proposal. |
| E3 | ZVR year-end 2025: 6,817,992 registered directives, adjusted for deletions; physicians received information in 421 cases during 2025. [ZVR annual report, pp. 1–2](https://www.vorsorgeregister.de/fileadmin/user_upload_zvr/Dokumente/Jahresberichte_ZVR/2025-JB-ZVR.pdf) | Appendix only: “The ZVR reported 421 physician information cases in 2025, alongside more than 6.8 million registered directives at year-end.” | Stock and annual cases have different denominators. No nationwide document-use rate, clinical failure rate or cost-saving conclusion follows. Other access channels are not counted. |
| E4 | ZVR's latest quarterly table reports 7,190,433 entries at 30 September 2026. [ZVR statistics 2026](https://www.vorsorgeregister.de/fileadmin/user_upload_zvr/Dokumente/Statistiken_ZVR/2026-Statistik-ZVR.pdf) | “The national register reported more than 7.1 million entries by September 2026.” | The quarterly label is total entries. Keep its date and definition separate from E3's adjusted year-end figure. It shows an established ecosystem, not demand for our product. |
| E5 | From 1 October 2026 institutional users can deposit electronic copies in ZVR; authorized treating physicians and courts can inspect them. [Bundesnotarkammer circular, 30 September 2026](https://www.bnotk.de/aufgaben-und-taetigkeiten/rundschreiben/details/aenderungen-im-zentralen-vorsorgeregister-der-bundesnotarkammer-zvr-zum-1-oktober-2026) | “The national register now supports document copies. Our prototype explores preparation and hospital review workflows around existing infrastructure.” | Private users cannot upload copies in their own registration. Do not claim ZVR stores metadata only or that our prototype is integrated with it. |
| E6 | Patients can upload documents to ePA; ePA records document access and permits replacing documents with new versions. [BMG overview](https://www.bundesgesundheitsministerium.de/epa-na-sicher), [gematik FAQ](https://www.gematik.de/anwendungen/epa-fuer-alle/faq) | “The ePA already supports document exchange and access records. We would test whether our focused workflow adds value alongside it.” | Do not claim sharing, versioning or traceability are unique to us. No implemented ePA integration is established. |

Recommendation: use E1 on the problem slide and E2 on the business slide. Keep E3–E6 for questions and the appendix; more statistics will not establish demand.

## Product claims: what can we actually say?

| Claim | Status and defensible wording | Do not say |
|---|---|---|
| Existing-document handoff | Baseline: synthetic personal view → clinical inbox → confirmed case assignment → record update → receipt. | “A scan automatically imports a clinically verified record.” |
| Source-linked review | Baseline: prepared statements link to a document, version and page; mappings are authored and checked against the PDFs. | “AI reads arbitrary uploaded documents and verifies them.” |
| Runtime assistant | Baseline: local deterministic assistance for source passages, next steps and handoff status. | “An LLM is answering live” or “we trained a clinical AI.” |
| AI development assistance | AI-assisted development can be disclosed; the team must confirm tools, roles and actual contributions. | An invented model, contribution percentage, training process or team role. |
| Personal planning | Later local UI only: reported guided planning and text export. This flow is separate from handing over existing documents. | “A newly created legally valid directive flows straight into the hospital.” |
| Access controls | Code contains Supabase/session and RLS provisions; actual configured cloud behavior remains unproven. | “Production security, compliance and cloud isolation are verified.” |
| NFC | Baseline supports a card-event route and a synthetic simulation. Physical tag and phone behavior are unproven. | “We demonstrated physical NFC” unless the team has actually done so. |
| Hospital integration | The clinical workspace is a simulated demonstrator with synthetic records. | “Connected to a real hospital information system.” |
| Deployment | A historic Vercel address exists; deployment of the selected feature version is unconfirmed. | “This exact version is live” without checking it. |
| Legal/clinical outputs | Synthetic, non-binding examples support human review. | “Legally valid generated directives,” “automatic treatment decisions” or “clinical approval.” |
| Value | Better preparation and less retrieval/review effort are hypotheses to evaluate. | Proven savings, fewer unwanted treatments or improved outcomes. |

## Twelve jury answers in English

### 1. What problem are you solving, and for whom?

“We focus on two tasks: helping people prepare their advance-care information, and helping hospital staff review the documents they receive. The survey shows a preparation gap. Our prototype makes a specific document handoff visible and connects displayed statements to their original passages. We have not yet established how common this exact workflow problem is in hospitals.”

### 2. What works today?

“In the committed prototype, a synthetic person shares an existing document package. The clinical user sees the incoming package, confirms its assignment to the patient case, and imports it. The personal view then shows the receipt. The clinical demonstration also lets us open a source passage in its PDF. Everything shown is synthetic.”

### 3. Where is the AI?

“The assistant running in this version is local and deterministic; it does not call a language model. Source mappings are prepared, not extracted automatically. AI-assisted development is a separate contribution that we will identify accurately. Model-based extraction or guidance would be future work requiring evaluation before we could claim it works.”

Operator note: this is a material limitation for an AI hackathon. Do not conceal it behind “AI-powered.” Team-confirmed development tools and contributions: **[fill in actual tools, people and tasks]**.

### 4. Are the source links generated automatically?

“No. The synthetic examples and their links to document, version, page and passage are prepared in the dataset. The generator checks those references against the resulting PDFs. This demonstrates an inspectable review interface; it does not establish reliable extraction from unseen documents.”

### 5. Why not just use ZVR or ePA?

“They already provide important registration, document and access infrastructure. ZVR has supported document copies since October 2026, and ePA supports document exchange. Our prototype explores the workflow around them: preparation, an explicit hospital handoff and source-linked review. We have not integrated with either, and would test whether this adds value for clinical users.”

### 6. What is your innovation?

“Our proposed differentiation is the continuity of the workflow: from personal preparation to a visible handoff and review against original passages. That is our product hypothesis. We have not established market uniqueness or clinical superiority, and the newly drafted planning flow is not yet connected to the existing-document handoff.”

### 7. What prevents a wrong interpretation from affecting care?

“The prototype shows the original source and keeps case-assignment confirmation separate from receiving a document. It does not determine whether a statement applies to the current clinical situation. Qualified people must make that judgment. Before real use, we would need to validate identity, document quality, interpretation and the clinical workflow.”

### 8. What about privacy and security?

“Our demonstration uses synthetic people and documents. The repository includes access-control and private-document mechanisms for a Supabase mode, but real cloud authentication, applied RLS and operational security have not been demonstrated. The synthetic demo identifier is not an authentication credential. We are not claiming production readiness or a compliance certification.”

### 9. Does the card work, and are you connected to a real hospital?

“Today we demonstrate the software event and the handoff in a simulated hospital workspace. A card can point to the scan route, but the exact tag and phone still require a physical test. The hospital interface is also simulated. Neither the card event nor opening a link independently grants clinical access.”

### 10. Who would pay, and what is the business model?

“Our initial hypothesis is a hospital or hospital group paying for workflow support, starting with planned admissions. Germany had 1,841 hospitals in 2024, but that is not our validated market size or customer count. We first need interviews with users and budget owners, then a supervised pilot. Pricing, willingness to pay and procurement effort remain open.”

### 11. How much time or money do you save?

“We have not measured savings. We would compare the existing workflow with the prototype on the same kinds of tasks: finding the relevant document, completing a handoff and checking a statement against its source. We would measure time, completion, corrections and staff effort before estimating financial impact.”

### 12. What did you build during the hackathon, and what comes next?

“We will distinguish the inherited materials, AI-assisted development and each person's work on the submission slide. The committed demonstrator includes synthetic clinical records, source-linked review and an explicit document handoff. Next we need a clinical partner to evaluate the workflow, and tests of the actual authentication, integrations and hardware before real use.”

Operator note: only retain work in this answer that the team confirms was built during the event. Team names, contributions, dates and prior work: **[complete on submission slide]**. Do not present inherited code or preparation as event output.

## Business hypothesis and a measurable first pilot

This is a proposed validation plan, not an agreed commercial commitment or a clinical trial.

| Decision | Prepared proposal | Evidence still needed |
|---|---|---|
| Initial user | Staff who receive and review advance-care documents for planned admissions. | Interviews and observation of current intake and review tasks. |
| Initial buyer | Hospital or hospital-group operational/digital lead with the clinical owner. | Named budget owner, procurement pathway and willingness to pay. |
| Offering | Workflow software, with implementation/support effort priced separately if interviews justify it. | Integration effort, support demand, acceptable contract structure and costs. |
| Pricing | Keep pricing explicitly unvalidated; no invented annual price or revenue projection. | Buyer interviews and an agreed, costed pilot scope. |
| First evaluation | Supervised comparison using synthetic cases before any separately approved real-data study. | Clinical reviewer, representative task set and review procedure. |
| Go/no-go | Agree quality and usability criteria before collecting results. | Team and clinical owner must set criteria; none have been invented here. |

Suggested paired comparison: have participants complete comparable tasks using the current method and the prototype. Vary the order to reduce learning effects. Include outdated versions, missing documents and ambiguous passages, not only the happy path.

| Measure | Operational definition | Interpretation limit |
|---|---|---|
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
| Problem and business potential | E1; proposed admission workflow; E2; buyer and pilot hypotheses. | Supply actual user insights if available. No invented interview or revenue claims. |
| AI and technical implementation | Existing-document handoff, local assistant, source-linked review, documented checks and clear architecture boundaries. | State runtime AI limitation; confirm coding tools and contributions. Cloud, hardware and real integration remain unproven. |
| Innovation | Proposed connection between preparation, explicit receipt and inspectable review. | Acknowledge current ZVR/ePA capabilities; validate additional user value. |
| Communication | One concrete synthetic case; English answers above; visible transitions and an explicit closing ask. | Rehearse with a stopwatch; confirm speakers, team ID, upload and actual demo environment. |

## Final factual review before submission

- [ ] Keep the 45–90 age range and 2023 survey year next to E1.
- [ ] Describe the hospital count as a potential institutional universe, not a revenue forecast.
- [ ] Keep ZVR's October 2026 document capability in competitive answers.
- [ ] Confirm every product statement against the version actually being demonstrated.
- [ ] Label physical scan simulation, prepared mappings and deterministic assistance accurately.
- [ ] Confirm development-tool disclosure and each person's contribution with the team.
- [ ] List prior preparation and inherited work on the submission slide.
- [ ] Remove any unsupported promise of legal validity, clinical benefit, compliance or savings.

These are factual review prompts for this package, not a replacement for the lead's shared preparation checklist.
