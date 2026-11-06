# VORAcard consumer experience

**Current contract update — 6 November 2026:** The [VORAcard feature contract](CONSUMER-FEATURES.md#aktueller-voracard-vertrag--6-november-2026) is authoritative for the current public website → registration/sign-in → profile/cases → dashboard flow. `/vorsorge` is now the public website; `/vorsorge/app` holds the account or explicit demo workspace. Discovery belongs to a case and can be repeated. DE/EN, actual official language variants, concrete prevention tasks, the notary form check/demo and scoped local health storage are part of this iteration. The visual brand is **VORAcard**; technical identifiers remain stable. Existing acceptance records below describe the **previous iteration**, not completed validation of these new changes. The lead records current integrated validation separately.

## Previous iteration: workspace contract and acceptance

Implementation contract, 6 November 2026. Applies to `/vorsorge` and [the VORA components](../components/vora/). Research authority and its limitations are documented in [VORA research](./research/VORA-VORSORGE.md); legal and medical source text takes precedence over product summaries.

The current purpose → information → action mapping is the [first table in the feature catalog](CONSUMER-FEATURES.md#aktueller-vora-katalog--6-november-2026). The current contract below supersedes the earlier manual-vaccination, large-assistant and unimplemented-OAuth descriptions preserved in the labelled history later in this document. Latest integrated UI/live-model acceptance is recorded separately by the lead; old results are not reused as new verification.

## Product and visual direction

VORA is a calm place to prepare care decisions, keep personal records and find the next useful action. The first screen is the workspace; an account is needed only for the separate existing archive/sharing flow. The clinic demonstrator at `/` is preserved. Earlier planning stays available at `/vorsorge?view=legacy`.

The defining object is a document folder with an actual outline and reviewed blocks. Navigation is Overview, Documents, Prevention, **Health pass**, Travel; the internal `vaccinations` area identifier is preserved. Work uses outlines, source notes and checklists. A compact, reachable avatar opens temporary contextual chat, with identity/connection settings secondary to the current question. It does not occupy a permanent large agent panel.

| Token | Value / purpose |
| --- | --- |
| Navy | `#152d42`, persistent navigation |
| Ink | `#203449`, decisions and primary content |
| Blue | `#245fd5`, deliberate actions and current step |
| Canvas | `#f6f8fb`, quiet working background |
| Rule | `#dfe5ec`, meaningful groups and rows |
| Green | `#33715e`, user-reviewed state only |
| Typography | Existing Geist sans; 24–37px page headings, 14–19px section headings, 12–14px work content; important explanatory text uses the darker muted tone `#586b7d` |
| Shape | 4–9px corner radius by hierarchy; no decorative gradients or card matrix |

## Sequence and acceptance

1. Choose one or more actual document types. Self/supporting-someone context applies only to documents; changing it with existing notes requires confirmation and clears those notes.
2. Work through named, small blocks with purpose, questions and relevant cautions. Critical permissions are never preselected. Notes can remain open. Explicit confirmation records review, not legal validity. Editing invalidates review and completion checks.
3. Review answers and open questions together. Print/save a readable PDF via the browser. The print report contains no application navigation.
4. Open the actual BMJV form/text-module PDF. Transfer, clarify, sign and arrange access to the original. The preparation export is conspicuously not a signable legal document. Completion checks are self-reported.

The current outline has **19 power-of-attorney blocks**, **17 patient-directive blocks** and **4 care-directive blocks**. The power separates general care, serious-risk medical authority, placement, individual liberty restrictions, compulsory treatment and transport for compulsory treatment. The patient directive separates resuscitation, ventilation, nutrition, fluids, dialysis, antibiotics and blood/components; every treatment question explicitly refers to the person’s named situations. Comfort, care location/support, confidentiality, representation and organ-donation conflicts remain distinct. Original broad block IDs remain as context to preserve earlier notes; they do not answer or review the newly separated decisions.

Document, phase (`select`, `blocks`, `review`, `finish`) and active block are represented in the URL. A known URL restores that work position; otherwise the workshop selects the next open block. Overview actions distinguish continuing work from reviewing notes, and a document row targets that document without silently selecting it. URL navigation is not cloud synchronization or proof that a document was completed.

Prevention shows selected statutory screening eligibility, optionally filtered by birth year and programme. It does not derive advice or due dates from absent clinical history. **Prepare a visit** on an offer passes only the public purpose, specialty and offer title to the local appointment brief; location remains user-entered. Replacing an existing preparation requires confirmation and clears its prior demo practice/time/receipt only after acceptance; cancellation preserves it.

**Health pass** contains two independent workflows. Vaccination passport is ePA-first: no vaccination-file upload or new manual entry. Real ePA remains unconnected. The explicit `Connect Demo-ePA` → separate consent → `Import demo vaccinations` flow imports fictional fixtures and exposes their demo provenance and last demo sync. Repeat/reset actions affect that demo state. Existing manual notes are retained separately, read-only and unverified; no record, timestamp or example dose establishes protection.

The organ donation card offers **Complete a card** or **Upload existing card**, independent of ePA. The form preserves an open decision and five distinct voluntary choices, then review and download of a German unsigned personal declaration. PNG/JPEG/PDF uploads up to 5 MB are checked locally for technical readability: native image decoding or PDF page-operator readability. Unreadable, truncated or locked files are rejected before replacement, preserving the existing file. There is no text extraction, remote upload or verification of the person's decision/signature. Neither path writes to the state organ-donation register or proves ePA import. Conflicts with treatment wishes remain a separate clarification task.

Travel keeps destination/date and five checks. Ghana, Thailand, Japan and Brazil retain dated official summaries and exact aliases; unknown destinations keep the official country-search path. Transit conditions stay visible. `Prepare travel consultation` preselects only public purpose/specialty, while the proof/documents steps link to Health pass and Documents. Own checkmarks do not establish entry clearance. No profile or itinerary is automatically sent to a booking provider.

The **appointment demonstration** has four steps: preparation → fictional practice/example time → explicit demo review/confirmation → demo receipt/calendar. Its calendar entry is labelled DEMO. Practice selection works only inside that fictional local journey; real Doctolib availability and booking remain unconnected. Brief and demo state stay in memory until leaving/reloading. No fictional selection is described as a real booking.

## Data and conversation boundaries

Versioned browser-local data is parsed before use and before saving. A raw saved-state comparison rejects stale writes. Corrupt originals are retained; temporary work is explicitly labelled. Browser storage is not encrypted or synchronised to an account. Previous planning storage is untouched.

Health pass is mounted lazily and retained when switching workspace areas. Its session-only state therefore survives area changes during that page session; this does not promise survival after reload when durable local saving was unavailable. Technical upload-readability checks are distinct from validating the medical/legal content.

After deliberate consent, chat sends the explicitly submitted conversation plus server-selected public VORA catalog context and official-template explanations. Known document/module labels resolve to purpose, question, caution and choices; unknown labels are discarded. Stored answers, vaccination entries, card files, profile and travel data are not attached. Official references are curated contextual links, not live retrieved evidence. The user's question language takes priority over the UI locale, and instructions target a concise answer plus a useful next action.

ChatGPT sign-in is implemented for the explicitly enabled, loopback-bound production demo; user sign-in is reported working. API-key mode remains an explicit alternative with separate billing and no automatic fallback. Five-minute authorization, per-browser server-memory credentials and restart/re-login behaviour are defined in [VORA-AI](VORA-AI.md). This does not modify Supabase. Provider failure remains visible and retryable; there is no simulated AI answer. At the 24-message/18,000-character boundary the user starts a new conversation. Each returned answer also fits the 6,000-character per-message limit. Note adoption is deliberate and resets the block's review.

## Render and interaction contract

Target viewports: `320x740`, `390x844`, `1440x960`. Desktop uses navigation plus workspace; mobile retains reachable navigation, single-column tasks and a viewport-bounded temporary chat. Keep introductions compact once work begins. Native labels, semantic buttons, visible focus and reduced-motion support remain required. Dialogs trap focus, close by Escape and restore focus. The global skip link targets the focusable main element. Current source changes require fresh rendered acceptance, not an inference from older screenshots.

| State | Visible feedback and next action |
| --- | --- |
| Loading | Local-workspace message; chat sending indicator |
| Empty | Select documents, explain real ePA unavailability/offer explicit Demo-ePA, choose card completion/upload, save first trip |
| Error | Storage/validation message or assistant failure; reload, temporary mode, field correction or retry |
| Partial | Open blocks, partial review, missing real ePA connection, unverified legacy notes or unsigned card |
| Success | Reviewed preparation, explicit fictional import, local card draft, checklist progress or labelled demo receipt |
| Permission | Conversation consent, separate Demo-ePA consent, person-change and appointment-topic replacement confirmations |

Earlier rendered evidence was recorded under ignored `test-results/vora/`, including `evidence.json`; those are historical verification artifacts, not application data or proof of the latest combined state. The earlier review motivated darker/larger explanatory text, compact working headers and correctly targeted document rows. No human usability study or complete screen-reader audit is claimed.

## Current implementation and lead acceptance — 6 November 2026

The lead's final production build passed on Next 16.4.5 (compilation 6.7 seconds; TypeScript 19.0 seconds). Focused ESLint passed for the VORA routes/page, components, ConsumerShell, libraries and tests. The 20 agent/provider/context tests passed. These checks concern the final local source tree; they do not establish a remote deployment or model answer quality.

The final four affected production journeys on port 3117 passed in 1.8 minutes: all 40 document blocks with exports/reload and isolated review invalidation; finish-to-Overview scroll/focus orientation; document cursor plus public avatar context; and overview review targeting with invalid URL parameters. An earlier targeted nine-test run had eight passes and one stale overview-copy assertion. Its selectors were corrected while retaining the 40/3 counts and strengthening URL-resume checks; an observed navigation-orientation defect was fixed and rebuilt before the final four-test run. [Final production recheck artifacts](../test-results/vora-production-final/recheck/) retain the document exports, screenshots and orientation evidence.

Separate Health-pass runs passed: nine source scenarios, three exact-viewport scenarios, nine regressions and two upload-readability/session-retention review checks. Five action-flow scenarios passed across two runs. These are distinct, potentially overlapping runs, not a combined total. The lead inspected rendered Health pass at 320/390/1440 widths and the overview/avatar; the Health-pass evidence checker passed. [Health-pass captures and evidence](../test-results/vora-health-pass/evidence/) and [workspace captures](../test-results/vora/) are local ignored artifacts, not a full accessibility certification or human usability study.

The lead restarted the final-build local preview on port 3112 and observed HTTP 200 with title VORA. An anonymous connection check returned `available: true`, `connected: false`, `pending: false`; this is an anonymous runtime check, not a claim about an authenticated user's account. The user's earlier successful ChatGPT sign-in report remains separate. The lead has not verified a completed live dialogue with the new prompt, and server-memory credentials require re-login after restart. Real ePA synchronization, real Doctolib booking, signature/clinical verification and state-register submission remain outside the implemented demo. Supabase and existing archive permissions are unchanged; no new push was performed for this acceptance.

<a id="verification-and-remaining-gates"></a>

## Historical verification — earlier API-key prototype

The following paragraphs retain the original earlier measurements and their then-current limits. In particular, the old invalid-key result is historical; the current connection contract above and [VORA-AI](VORA-AI.md) supersede its API-key-only completion requirement.

The research and implementation phases are complete for this local prototype. The lead ran `npm run build` and focused ESLint successfully. A combined Playwright run covering VORA, earlier planning, login and clinical handoff passed **29 tests**; after adding separate document blocks, destination-specific information and the visual fixes, **11 affected model/UI tests passed against the production build**. These include actual local edit/reload/export behavior, strict restore, newer-tab preservation, source links, document targeting and print output. Simulated provider responses test multi-turn chat, consent, retry, bounded context and explicit note adoption; they are not evidence of live model accuracy.

The final focused browser command is `PLAYWRIGHT_PORT=3111 npx playwright test tests/vora-ui.spec.ts --reporter=line` (PowerShell sets the environment variable separately): **7 passed**, including chat focus containment/return and deliberate AI-note adoption. The final build and focused ESLint also passed. The bundled UI-skill checker accepted `test-results/vora/evidence.json`; that structural check supplements the actual screenshot review. The real provider check reached OpenAI but returned **HTTP 401 `invalid_api_key`**; the actual application route returned **503 `AI_CONFIGURATION`**. The application owner must supply a valid server-side key before an end-to-end live AI acceptance can pass. Credentials were neither changed nor printed.

<a id="current-limits"></a>

## Historical limits at that prototype stage

No verified vaccination certificate, real ePA import, automatic medical recommendation, signature validation, destination-specific rule engine or document autofill is represented as implemented. English is the new workspace’s default; official German document names and original sources remain visible. Live AI requires a valid server credential; configuration alone is not a successful connection.

<a id="executed-cross-feature-workflows--6-november-2026"></a>

## Historical executed cross-feature workflows — 6 November 2026

These are the original earlier journey results. Statements about manual vaccination entry, an unpersisted cursor or the rejected provider key describe that run; they do not override the current Health pass, URL-resume and ChatGPT contracts above.

The follow-up request to execute every feature in dynamic workflows was carried out as automated, complete user journeys. These runs add coverage around the existing screens; they do not introduce a new in-app workflow engine. The test browser uses isolated synthetic data. No real clinical delivery, signature, booking or medical decision is made.

| Executed journey | Observed result | Scope boundary |
| --- | --- | --- |
| All three documents, driven by their displayed outlines | Passed: 40 distinct blocks (19/17/4), three complete exports without mixed content, twelve self-reported completion checks, reload and explicit document selection. Editing one power block leaves 18/19 reviewed and clears only its checks; the other exports remain byte-identical. No API requests or browser errors. | Checks are simulated test state, not proof of advice or signing. The last block cursor is not persisted. |
| Prevention → vaccination → travel → preparation → archive → clinical receipt → local workspace | Passed: persisted filters/records, all five travel checks and export, reset after destination change, archive boundary, deliberate sample-mode entry, real receipt transition inside the isolated demo, and preserved local notes/records after returning. | Private archive returned HTTP 503 `AUTH_SETUP`; the run followed the visible manual login/sample recovery link. Real account authentication and external clinic delivery were not established. |
| AI across Overview, Documents, Prevention, Vaccinations and Travel | Passed: ten submissions across five two-turn conversations, consent on each new conversation, correct context labels, follow-up history and no stored document/vaccine/travel marker in any payload. | Responses are controlled transport fixtures. The rejected live provider key remains an external blocker. |

Test owners: [document workflows](../tests/vora-document-workflows.spec.ts) and [cross-feature workflows](../tests/vora-cross-workflows.spec.ts). **Three final journey results passed**, as did focused ESLint and TypeScript. Initial attempts exposed a duplicate hidden-print locator and an incorrect assumption that every unavailable archive redirects automatically. Tests now scope the visible review and follow the actual recovery path while retaining access-boundary assertions. Application source and credentials were not changed in this follow-up.

Replay against the current production build:

```powershell
$env:PLAYWRIGHT_PORT='3111'
npx playwright test tests/vora-document-workflows.spec.ts tests/vora-cross-workflows.spec.ts --output=test-results/vora-workflows --trace=on --reporter=line
```

Observed evidence remains in ignored `test-results/vora-document-workflows/run-2/` (exports/screenshots) and `test-results/vora-cross-workflows/` (controlled requests and traces; successful cross-feature run in `run-2/`). Real AI needs a valid key, private accounts need configured authentication, ePA/verification are not connected, and booking links do not constitute bookings.

<a id="account-and-appointment-update--6-november-2026"></a>

## Historical account and appointment update — 6 November 2026

This records the earlier preparation-only iteration and its tests. Its statements that OAuth or practice selection were not implemented are preserved as history; current local OAuth and fictional practice selection are described above. Real booking remains unavailable.

The user's follow-up keeps the already linked Supabase setup unchanged and makes email/password the first login option; email codes remain secondary. Password submission, accessible rejection/correction and the preserved destination were verified with controlled authentication responses. No real account or provider settings were changed.

The previous portal-button group is replaced in Prevention, Vaccinations and Travel by [appointment preparation](../components/vora/AppointmentPlanning.tsx). It validates purpose, specialty and location, then supports review, edit, clear and download. This brief exists only in memory until leaving the section or reloading. Doctolib is visibly unconnected; practice selection, real availability and booking remain unavailable pending authorized partner access. This is an implemented local first step, not a live Doctolib integration. The [source research](research/VORA-VORSORGE.md#61-doctolib-tiefe-buchungsintegration-statt-portal-link) defines that boundary.

Production build, focused ESLint and TypeScript passed. Seven targeted browser scenarios passed across login, appointment preparation and prevention; the responsive scenario passed again after compacting the 320px stage overview. Desktop and phone captures were inspected, and the UI evidence checker accepted `test-results/vora-appointments/evidence.json`. The new [appointment tests](../tests/vora-appointments.spec.ts) check no external data transfer or persisted preparation, no fabricated booking, validation, export, editing and all three entry surfaces. The OpenAI account/credit alternatives are documented in [VORA-AI.md](VORA-AI.md#requested-chatgpt-sign-in-path--checked-6-november-2026); ChatGPT OAuth itself is not implemented or connected yet.

Before this update, the remote feature head was checked as `ac306cf`; neither remote `main` nor `dev` contained additional missing commits. Local checkpoint `258338b` is a direct descendant. Later mobile refinement and this verification record preserve that checkpoint rather than rewriting it. No additional push was performed as part of these integration checks.
