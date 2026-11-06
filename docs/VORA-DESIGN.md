# VORA consumer workspace

Implementation contract, 6 November 2026. Applies to `/vorsorge` and [the VORA components](../components/vora/). Research authority and its limitations are documented in [VORA research](./research/VORA-VORSORGE.md); legal and medical source text takes precedence over product summaries.

## Product and visual direction

VORA is a calm place to prepare care decisions, keep personal records and find the next useful action. The first screen is the workspace; an account is needed only for the separate existing archive/sharing flow. The clinic demonstrator at `/` is preserved. Earlier planning stays available at `/vorsorge?view=legacy`.

The defining object is a document folder with an actual outline and reviewed blocks. Navigation is stable: Overview, Documents, Prevention, Vaccinations, Travel. Work uses document outlines, entries, source notes and checklists. A right-hand conversation drawer answers contextual questions.

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

Prevention shows selected statutory screening eligibility, optionally filtered by birth year and programme. It does not derive medical advice or due dates from absent clinical history. Vaccination entries support create, edit, delete and undo; they remain self-entered, unverified records. Four general vaccination schedule groups are explicitly separated from legal proof requirements. Travel tracks destination/date and a five-step checklist. Ghana, Thailand, Japan and Brazil have dated, source-linked entry-rule summaries; exact country aliases resolve locally, while other destinations keep the official country-search path. Transit-dependent conditions remain visible and are never resolved into an individual clearance. Booking portals receive no profile data from VORA.

## Data and conversation boundaries

Versioned browser-local data is parsed before use and before saving. A raw saved-state comparison rejects stale writes. Corrupt originals are retained; temporary work is explicitly labelled. Browser storage is not encrypted or synchronised to an account. Previous planning storage is untouched.

Chat sends only the explicitly sent question, complete bounded conversation and topic labels to OpenAI after consent. It never attaches document answers, vaccination entries or profile/travel data. Provider failure is visible and retryable. No simulated AI fallback exists. At the 24-message/18,000-character boundary, the user explicitly starts a new conversation. AI explanations can be added to a document note only by a deliberate action, and the block must be reviewed again. ePA is explicitly not connected.

## Render and interaction contract

Target viewports: `320x740`, `390x844`, `1440x960`. Desktop uses navigation + workspace; mobile has a horizontally scrollable navigation strip, single-column forms and full-height chat drawer. Native labels, semantic buttons, visible focus and reduced-motion support are required. Dialogs trap focus, close by Escape and restore focus. The global skip link targets the focusable main element.

| State | Visible feedback and next action |
| --- | --- |
| Loading | Local-workspace message; chat sending indicator |
| Empty | Select documents, add first vaccination, save first trip |
| Error | Storage/validation message or assistant failure; reload, temporary mode, field correction or retry |
| Partial | Open blocks, partial review count, unavailable ePA, unverified records |
| Success | Local entry save, reviewed block, checklist progress, preparation download |
| Permission | Explicit AI consent and person-change confirmation |

Rendered acceptance evidence is held in ignored `test-results/vora/`, with the local UI-skill record `evidence.json`. These are verification outputs, not application data. The independent visual review found low-contrast small text, excessive mobile workshop introductions and document rows that opened the wrong work context. The implementation darkens and enlarges explanatory text, reduces the working header to document/person context, and targets the chosen document without silently selecting it. Viewport images, the print view and keyboard flows were inspected; no human usability study or complete screen-reader audit is claimed.

## Verification and remaining gates

The research and implementation phases are complete for this local prototype. The lead ran `npm run build` and focused ESLint successfully. A combined Playwright run covering VORA, earlier planning, login and clinical handoff passed **29 tests**; after adding separate document blocks, destination-specific information and the visual fixes, **11 affected model/UI tests passed against the production build**. These include actual local edit/reload/export behavior, strict restore, newer-tab preservation, source links, document targeting and print output. Simulated provider responses test multi-turn chat, consent, retry, bounded context and explicit note adoption; they are not evidence of live model accuracy.

The final focused browser command is `PLAYWRIGHT_PORT=3111 npx playwright test tests/vora-ui.spec.ts --reporter=line` (PowerShell sets the environment variable separately): **7 passed**, including chat focus containment/return and deliberate AI-note adoption. The final build and focused ESLint also passed. The bundled UI-skill checker accepted `test-results/vora/evidence.json`; that structural check supplements the actual screenshot review. The real provider check reached OpenAI but returned **HTTP 401 `invalid_api_key`**; the actual application route returned **503 `AI_CONFIGURATION`**. The application owner must supply a valid server-side key before an end-to-end live AI acceptance can pass. Credentials were neither changed nor printed.

## Current limits

No verified vaccination certificate, real ePA import, automatic medical recommendation, signature validation, destination-specific rule engine or document autofill is represented as implemented. English is the new workspace’s default; official German document names and original sources remain visible. Live AI requires a valid server credential; configuration alone is not a successful connection.

## Executed cross-feature workflows — 6 November 2026

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
