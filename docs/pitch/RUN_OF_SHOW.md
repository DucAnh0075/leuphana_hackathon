# Pitch and live-demo run of show

Prepared 6 November 2026. **Working script, not a completed rehearsal.** English spoken lines; German operator guidance. Target: six minutes including the live demo, followed by three minutes of questions, according to the [Open Track pitch checklist](../../Checkliste%20Pitch%20Open%20track.pdf). Confirm any later organizer announcement on site.

This runbook is grounded in application commit `6ec45fe3c26f49b8e74ef5bf24f560fd17199870`. Its baseline UI is German. The English Consumer interface and public planning flow seen in the separate local Feature-Worktree were uncommitted at inspection and are an **optional variant**, not part of this baseline. All people and documents in the demonstration are synthetic. The clinical workspace simulates integration; it is not a deployed hospital interface.

## Assign people before rehearsing

| Responsibility | Suggested handover | Team answer |
|---|---|---|
| Problem, solution and closing | Speaks at the start and end | **Name:** ___ |
| Demo operator and narrator | One person clicks while speaking, or a silent operator follows the six beats below | **Name:** ___ |
| Technical explanation and questions | Explains what runs and what remains unproven | **Name:** ___ |
| Business hypothesis and timekeeping | Watches stopwatch and takes the next section on cue; combine roles for a team of three | **Name:** ___ |

These assignments are proposals. Record actual team contributions separately in the submission material; a suggested speaking role is not evidence of who built a feature.

## Start a reproducible baseline

Use a checkout containing the base commit above and this pitch package. Do not replace somebody else's working directory or discard changes to get to the baseline. The prepared pitch checkout is `C:/Hackathon/Pitch-Paket`; teammates can use their clone of the pushed pitch branch.

From the project directory, prepare dependencies and the production build in advance:

```powershell
npm ci
npm run build
npm run start -- --port 3110
```

These are setup instructions, **not commands executed by the author of this runbook**. Do not run installation or compilation during the pitch. Keep the successful server process running. One browser and two tabs on the same laptop are sufficient; different browser profiles also work when they use the same demo ID. This synthetic mode needs no Supabase account, real login, email, model key or external patient data. Verify the chosen port is available before starting; if using another port, use it consistently in both tabs.

Before every rehearsal and before the pitch:

1. Open `http://localhost:3110/anmelden` and click **Synthetische Demo öffnen**. This creates a new synthetic session. Do not fill in account credentials.
2. Leave this as **Tab A — personal view**. Its address contains `demo=<id>`. Keep that ID; it is a public reference to synthetic data, not an authentication credential.
3. In Tab A click **Klinikansicht** (header) or **Klinikansicht öffnen** (footer) to open **Tab B — clinic** with the same ID. Alternatively open `http://localhost:3110/klinik?demo=<same-id>` manually.
4. In Tab B verify **Erika Berger**, case **26004182**, and **Noch kein neuer Eingang**. The new **Gesprächsbegleitung** item must not yet be present in the record. Do not click the card simulation during this baseline run.
5. Back in Tab A verify **Eine neue Fassung ist bereit** and the **Patientenverfügung · Fassung 2**. Open and close the handoff preview if useful, but do not submit it before the live sequence. The pending new version is selected by default; older documents are already in the synthetic record.
6. Keep only the required windows visible. Use a readable desktop viewport and rehearse with the actual projector resolution. Start the pitch with Tab A ready and Tab B preloaded, not with terminal setup.

**State lifetime:** the session exists in one running Next.js server process, for at most 24 hours. A restart loses it. Separate serverless instances do not share it. If the session expires or the process restarts, create a new session from the login page and reopen **both** tabs using its new ID. Do not reuse a previous receipt as if it were created in the new run. A new run needs no deletion of old records. See [setup and boundaries](../CARE-SETUP.md).

## Six-minute speaking script

All times below are targets. Replace only the explicitly marked hypotheses with actual team decisions or evidence. Leave unsupported claims out.

| Time | Speaker / screen | English spoken lines |
|---|---|---|
| 0:00–0:25 | Slide 1 — scenario; problem speaker | “Imagine arriving at hospital with a new version of your advance care documents. You need to know whether the right version reached the right record. The clinical team needs the relevant statement, its conditions and its source. We will use an entirely synthetic example.” |
| 0:25–0:45 | Slide 2 — evidence; problem speaker | “In Germany's 2023 Ageing Survey, around half of people aged 45 to 90 reported having none of the three main advance-care documents. That shows a preparation gap. Our prototype also explores what happens when existing documents reach a hospital.” |
| 0:45–1:15 | Slide 3 — solution; problem speaker, then Tab A | “We connect a personal document view with a simulated clinical workspace. The person chooses which versions to share. The clinic confirms the case assignment. Both sides can then see the same handoff status. Let us follow one new version all the way to its original source.” |
| 1:15–3:45 | Slide 4 — live demo; demo narrator | Follow the six 25-second beats below. The clock starts with the two tabs already prepared. |
| 3:45–4:30 | Slide 5 — technology / AI; technical speaker | “This runs as a Next.js prototype. The demo uses synthetic documents and a shared state in one server process. The source passages are prepared and linked to the original PDFs. Our current assistance is deterministic: no language model is called at runtime. We have not yet validated a live hospital connection, production authentication or a physical NFC card. A future AI step must be evaluated against the source documents before we can claim reliable extraction.” |
| 4:30–5:15 | Slide 6 — business hypothesis; business speaker | “Germany had 1,841 hospitals in 2024. That describes the institutional landscape, not validated demand for our product. Our initial hypothesis is a hospital or hospital group paying for document-workflow support, starting with planned admissions. We need to test this with clinical users and budget owners. A pilot should measure the time to find the correct version and source, handoff completion and review errors. Pricing and savings remain unvalidated.” |
| 5:15–5:40 | Slide 7 — built and pre-existing; technical or product speaker | “During the event, we built the synthetic clinical workspace, source-linked review and document handoff. General preparation material and a neutral technical test existed beforehand. Official document templates and software libraries are external components. We disclose AI-assisted development separately from the deterministic assistance running in the product.” |
| 5:40–6:00 | Slide 8 — ask; closing speaker | “We are looking for a clinical workflow partner and an integration partner. Together, we want to test whether people can find the correct version and source more reliably, and measure the effort involved. Please talk to our team after the pitch.” |

The buyer and pilot proposition above are an **editable proposal**, not established market evidence or a team decision. **Team decision:** keep / replace with ___ . **Evidence or conversation supporting the decision:** ___ .

The statistic and hospital count are verified in [EVIDENCE_QA](EVIDENCE_QA.md), E1 and E2. The preparation statistic measures self-reported possession, not hospital availability. Before presenting slide 7, confirm which pre-existing items were actually used and add each member's contribution and actual development tools in the [package checklist](README.md). Do not present unspecified individual contributions as verified.

If time is tight, shorten the business hypothesis paragraph and transition sentences. Preserve the source demonstration and the distinction between received, confirmed in the record, and clinically reviewed.

## Live demo: 2 minutes 30 seconds

The baseline deliberately uses an **existing** synthetic document revision. It does not create a new document during the pitch. No NFC hardware is required.

| Demo clock | German operator action and expected result | English spoken lines |
|---|---|---|
| 0:00–0:25 | **Tab A:** Auf Erika Berger und **Patientenverfügung · Fassung 2** zeigen. **Übergabe vorbereiten** öffnen. Der Dialog heißt **Unterlagen an die Klinik übergeben**. Person, Empfänger und ausgewählte Fassung sichtbar prüfen. Die noch nicht übernommene Fassung 2 bleibt ausgewählt; keine beliebigen weiteren Unterlagen anklicken. | “This is Erika, a synthetic example. She has a new version of her advance directive. Before sharing, she checks the person, the receiving clinic and the exact version.” |
| 0:25–0:50 | Im Dialog **An Klinik übergeben** klicken. In der persönlichen Ansicht erscheint **Eingegangen**. Noch keine Aktenübernahme behaupten. Bei Bedarf **Übergaben** öffnen. | “She chooses to share this version. The status is received. That means the documents arrived; it does not yet mean they have been matched to her clinical record.” |
| 0:50–1:15 | **Tab B:** Auf **Neue Vorsorgedokumente** bzw. den Eingang zeigen. Der sichtbare Status ist **Eingegangen**; **Übernahme bestätigen** ist zunächst deaktiviert. Bis zu etwa drei Sekunden Nachladeintervall einplanen. | “The clinical team sees a new arrival. Confirmation is intentionally a separate step. The record has not silently changed just because someone sent a document.” |
| 1:15–1:40 | Checkbox **Fallzuordnung für Erika Berger bestätigen** aktivieren, dann **Übernahme bestätigen**. Erwartet: **In der Akte bestätigt** und **Aktenstand aktualisiert**. Falls die Patientenakte vom Eingang verdrängt wird, **Eingang einklappen** nutzen. | “After checking the case assignment, the clinician confirms the version in Erika's record. This is a record receipt, not a claim that a doctor has read or approved every statement.” |
| 1:40–2:05 | In Erikas Fallübersicht zum Bereich **Behandlungswünsche im Versorgungskontext** scrollen. Im Eintrag **Gesprächsbegleitung** steht **Jana Berger hinzuziehen**. Dessen **Beleg anzeigen · S. 4** öffnen. Erwartet: Patientenverfügung Fassung 2, **Seite 4 von 4**, Zitat, Bedingung und Ausschluss. Nicht einen der anderen gleichnamigen Beleglinks anklicken. | “Here is the new statement: Erika wishes her daughter Jana to join conversations about her treatment wishes, where possible. One click opens page four of the original. The limitation stays visible: this addition gives Jana no extra authority to represent her.” |
| 2:05–2:30 | Zurück zu **Tab A**, **Übergaben** öffnen. **In der Akte bestätigt**, Empfänger und **Patientenverfügung · Fassung 2** zeigen. Bei ausreichender Zeit einmal neu laden und **Übergaben** erneut öffnen; der Status bleibt für diesen laufenden Server erhalten. Nicht nochmals senden. | “Back in the personal view, Erika can see which version was confirmed in the record. The handoff is traceable on both sides. The clinical team must still assess the document in the actual treatment context.” |

The page-four source reads: “Ich wünsche, dass meine Tochter Jana Berger bei Gesprächen über meine Behandlungswünsche hinzugezogen wird.” Condition: “Soweit dies in der konkreten Behandlungssituation möglich ist.” Exclusion: “Diese Ergänzung erteilt keine zusätzliche Vertretungsbefugnis.” The source remains in German; the English narration is an explanation, not a certified translation. See the [revision source](../../lib/demo-care-revision.json) and [synthetic PDF](../../public/demo-documents/26004182-patientenverfuegung-v2.pdf).

## Optional latest-local UI variant

Use this table only if the team deliberately chooses the newer Consumer build and has rehearsed that exact build. It was present as uncommitted work in `C:/Users/User/kepler/worktrees/Hacka-feat-4be66` during inspection; the pitch documentation branch does not publish that application work.

| Baseline label | Newer local English label / navigation |
|---|---|
| Synthetische Demo öffnen | Open sample workspace |
| Übergabe vorbereiten | Share documents |
| Unterlagen an die Klinik übergeben | Share documents |
| An Klinik übergeben | Send to clinic |
| Eingegangen | Received |
| Übergaben | Sharing (sidebar link) |
| In der Akte bestätigt (personal view) | Confirmed in record |
| Klinikansicht / Klinikansicht öffnen | Sharing → Open clinic demo |
| Fassung 2 | Version 2 |

The clinical labels and page-four evidence path stay German. The newer personal receipt keeps version details under **Handoff details**. If the versions are not immediately visible, expand it; do not mistake the receipt summary for the exact version list.

**Optional planning opening — 20 seconds, only on that newer local build:** open `/vorsorge` in a separate tab. Show **Who are you planning for?**, select **Myself**, click **Continue**, then show **What would you like to prepare?**. Say: “A separate planning entry helps people work through small questions without creating an account. It currently prepares a local planning draft. It does not create a signed legal document or feed a newly written plan into the handoff we are about to show.” Then switch explicitly to the prepared existing-document demo in Tab A. Replace 20 seconds of the solution introduction; do not add time to the six minutes. Do not claim this screen is available in the baseline checkout.

## Failure path: keep the claim honest

| Observation | Operator action | English line |
|---|---|---|
| The inbox has not refreshed yet | Wait for one polling interval, then reload Tab B once, preserving the same demo ID. Confirm actual state before acting again. | “The receiving view is refreshing. I will check the current state once.” |
| An error appears after sending or confirming | Read current state in both tabs before retrying. Do not repeatedly click and do not claim success from an animation. If still unresolved, return to the deck. | “The live handoff is not completing here. I will distinguish the intended workflow from what this run actually confirmed.” |
| Demo expired / server restarted | Before stage time: create a new demo and reopen both tabs. During the pitch: do not spend the remaining time debugging or reuse an old receipt as live evidence. | “This demonstration session has expired. The saved examples still explain the flow, but they do not show a successful live handoff in this run.” |
| PDF viewer fails | Use **Original öffnen** for the selected version if the server still serves it. Otherwise open the repository's local synthetic PDF, page four. Explain the source change. | “The embedded viewer did not load. This is the same synthetic source file opened directly; it is not evidence that a new transfer succeeded.” |
| The live app cannot be reached | Show the prepared workflow slide and open the local page-four PDF if useful. Label both as static illustrations. No recording or external network is needed for this fallback. | “The live app is unavailable. This static example shows the source and the workflow we implemented, not a completed live transaction.” |
| Someone asks for an NFC tap or real account | Do not improvise an untested hardware or cloud demonstration. Explain the boundary and continue with the tested synthetic interaction. | “Today we demonstrate the document handoff in software. Physical NFC and real cloud access still need their own test.” |

Keep a local copy of the deck and the synthetic PDF available. A static document can support an explanation but does not replace the required live demonstration. A backup video is not produced by this package; event recording remains subject to the applicable organizer and participant permissions. The local baseline avoids a runtime cloud dependency, but offline behavior on the actual presentation laptop still needs a rehearsal.

## Two timed rehearsals — fill in real observations

| Check | Rehearsal 1 | Rehearsal 2 |
|---|---|---|
| Date, time, operator | ___ | ___ |
| Application commit / dirty changes | ___ | ___ |
| Baseline German UI or newer English local variant | ___ | ___ |
| Laptop / browser / screen resolution | ___ | ___ |
| Server port, one process, same demo ID confirmed | ___ | ___ |
| Fresh session: no new inbox item, no Gesprächsbegleitung in record | ___ | ___ |
| Actual total pitch time | ___ min ___ sec | ___ min ___ sec |
| Actual live demo time | ___ min ___ sec | ___ min ___ sec |
| Received before record confirmation observed | ___ | ___ |
| Page-four original, condition and exclusion shown | ___ | ___ |
| Exact version receipt shown in personal view | ___ | ___ |
| Fallback deck + local PDF opened successfully | ___ | ___ |
| Actual network condition / venue WLAN test | ___ | ___ |
| Stumble, error or cut to make | ___ | ___ |
| Ready / remaining action and owner | ___ | ___ |

Pass condition for a rehearsal: the full pitch fits six minutes, the live handoff completes on the actual chosen build, the correct original source and version receipt are visible, and no narration exceeds what was demonstrated. A failed live step is recorded as failed rather than compensated with a previous screenshot. The team owns these rehearsals and the final presentation upload.

## Evidence behind this script

- [Care UI scenarios](../../tests/care-ui.spec.ts): explicit handoff, clinical case matching, receipt and clarification behavior; read at base commit `6ec45fe` and compared with local English-label changes. The author did not rerun them for this document.
- [Clinical handoff workspace](../../components/ClinicalCareWorkspace.tsx): exact confirmation labels, refresh interval and independent receipt step.
- [Clinical projection](../../lib/clinical-care.ts): record displays accepted versions and their source evidence; incoming files alone do not add the new source statement.
- [Clinical UI](../../components/KisWorkspace.tsx): treatment-wish card and page-specific source link.
- [Demo session state](../../lib/care/demo.ts): session lifetime and in-process state.
- [Local assistance](../../lib/care-assistant.ts): deterministic source lookup and handoff explanation; no runtime model call.
- [Setup](../CARE-SETUP.md): current baseline contracts, previously reported local checks and explicit cloud/hardware limits. Historical successful checks are not a new rehearsal result.

Prepared by a repository/code read and label comparison. No live application interaction, new test run, deployment, recording, account change or external data submission was performed while authoring this runbook.
