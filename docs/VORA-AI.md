# VORAcard conversation service

**Current product context — 6 November 2026:** See the [current VORAcard feature contract](CONSUMER-FEATURES.md#aktueller-voracard-vertrag--6-november-2026) for the public website, protected profile, repeated case discovery, dashboard, DE/EN templates and notary demo. The assistant explains these public workflows; it does not read private case answers or local health files automatically. The visible name is VORAcard; existing API/storage identifiers remain unchanged. Earlier sign-in observations and acceptance records below are evidence from the **previous iteration**, not a new live-model or new-UI acceptance. The local ChatGPT/API funding and credential boundaries below continue to apply.

Current implementation contract, 6 November 2026. The service explains the current VORA task, public document modules and possible next actions. Suggested wording remains a draft for the person's review. It cannot read private records, change notes, connect ePA, determine vaccine protection, sign, register, share or book anything.

The user reported successful ChatGPT sign-in in the local preview on 6 November 2026. This establishes the user's sign-in observation, not a lead-verified completed model dialogue, remaining credit or clinical/legal answer quality. The UI offers **My ChatGPT account** and explicitly selected **Configured API key** mode. Failure never switches funding automatically.

## Explicit API-key configuration

Set `OPENAI_API_KEY` in the server environment for this separate API-billing mode. Never prefix credentials with `NEXT_PUBLIC_` or commit them. Optional `VORA_AI_MODEL` overrides `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Environment changes require a coordinated restart. No extra SDK or production dependency is required. A key is not required for the implemented ChatGPT account path below.

`GET /api/vora/assistant` returns `{ configured: boolean, provider: "OpenAI" }`. This reports key presence only. It does not verify credentials, model access, account credit or provider reachability.

<a id="requested-chatgpt-sign-in-path--checked-6-november-2026"></a>

## Local Sign in with ChatGPT — implemented 6 November 2026

The implementation follows OpenAI's [local/open-source registration flow](https://developers.openai.com/siwc/token-sharing-open-source/sign-in). It requires `VORA_CHATGPT_LOCAL_ENABLED=true`, `NODE_ENV=production` and strict HTTP loopback Host/origin admission. The operator must also bind the server to loopback: Host validation cannot establish the network peer's address. After building, start a coordinated local preview:

```powershell
$env:VORA_CHATGPT_LOCAL_ENABLED='true'
npm run start -- --hostname 127.0.0.1 --port 3112
```

The page may use `localhost` or `127.0.0.1`; the exact callback is always `http://127.0.0.1:<port>/api/vora/chatgpt/callback`. `next dev` is intentionally not admitted because its request logging can expose callback queries. This local support does not establish public-hosted or commercial plan-use approval.

Initial registration uses `dynamic_agent_client`, VORA's name and a stable opaque host ID. Each attempt has fresh state, nonce and PKCE S256 values; the callback's issued client ID is used for exchange. Signature/JWKS, issuer, exact audience, expiry and nonce are checked before accepting identity. Both `resource.invoke` and `chatgpt.tokens.use.direct` must be granted before inference. Identity without those scopes remains signed in with plan use disabled.

Authorization lasts five minutes and supports cancellation, denial and one-time consumption. Credentials and account registrations remain only in a per-browser server-memory session, addressed by an HttpOnly, SameSite=Strict cookie. **Server restart requires sign-in again.** Only a non-secret host ID persists in ignored `.vora-runtime/chatgpt-host.json`; no Codex credentials are read or reused. This is a single-process local demo, not durable account storage. Refreshes are serialized and rotating tokens replaced together. Disconnect stops local use and attempts remote revocation; failure to confirm revocation is visible. See [accounts and sessions](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions).

| Connection endpoint | Contract / boundary |
| --- | --- |
| `GET /api/vora/chatgpt` | `{ available, connected, planEnabled, pending, accountLabel?, reason?, models?, diagnostic? }`; models contain `{ slug, displayName }`. Availability is local admission; sign-in and granted plan permission are distinct from completed inference or available credit. |
| `POST /api/vora/chatgpt` with `{ action: "start" }` | Same-origin JSON; returns `{ authorizationUrl }` and sets the local session cookie. The user opens OpenAI's authorization flow. |
| Same POST with `cancel` or `disconnect` | Returns status. Cancel invalidates the pending attempt; disconnect clears local credentials and attempts revocation. |
| `GET /api/vora/chatgpt/callback` | Static success/failure HTML; sends only `{ type: "vora:chatgpt-auth", ok }` to the initiating page origin. Polling its own session remains authoritative. |

Diagnostics contain only fixed/allowlisted `{ phase, code, httpStatus? }`, never OAuth codes, tokens, identity values or raw provider bodies. Omit `accountLabel` from troubleshooting output. No user balance or entitlement beyond the actual grant has been inspected or assumed. The earlier API-key `invalid_api_key` result is historical evidence in [VORA design history](VORA-DESIGN.md#historical-verification--earlier-api-key-prototype), not a current ChatGPT sign-in blocker.

## Frontend contract

`POST /api/vora/assistant` accepts JSON from the application's own origin:

```json
{
  "provider": "chatgpt",
  "consent": true,
  "locale": "en",
  "context": {
    "area": "documents",
    "documentTitle": "Vorsorgevollmacht",
    "moduleTitle": "Your trusted person"
  },
  "messages": [
    { "role": "user", "content": "Welche Frage hilft mir beim Einstieg?" }
  ]
}
```

The UI explains that OpenAI receives the submitted conversation, selected public screen context and VORA's public explanations of official templates/care-preparation steps. Deliberate conversation consent governs sends and retries; opening the avatar, choosing a document or completing OAuth does not replace it. Stored answers, profile/age, vaccination records, organ-card contents/uploads, private files and travel plans are not automatically attached. Chat text itself may contain sensitive information; the input warns against identifiers and medical files. The temporary chat clears when its panel closes.

`provider` is `chatgpt` or `apiKey`; omission retains the older API-key contract. The provider must match the explicit server configuration, with no failure fallback. The instructions follow the language of the latest substantive user question and any explicit language request; `locale` is only a fallback when that signal is missing. English UI does not force English replies to German questions.

Only the documented keys are admitted, including within context and messages. Limits: 24 messages, 6,000 characters per message, 18,000 total message characters and 80,000 request bytes. Roles are `user` and `assistant`; the last message must be from the user. Locale is `de` or `en`. Screen area is limited to 80 characters and optional titles to 160 each. The frontend should offer a new conversation rather than silently dropping older messages.

Success is `{ message: string, mode: "live", sources: { title, url }[] }`. Only a completed provider text response can produce `live`. Sources come from the selected public catalog and are labelled **Official references**: they are not live retrieved evidence or proof of every generated statement. Generated URLs never populate this metadata. Render the message as text, not HTML.

Failure is `{ error: string, code: string, mode: "unavailable" }` with an appropriate non-2xx status. Configuration/provider failures generally use 502/503, missing ChatGPT sign-in 401, timeout 504 and rejected consent/schema 400. Local capacity limits return 429 with `Retry-After: 60`; ChatGPT usage-limit errors do not invent a reset time. Cross-origin requests use 403; oversized bodies 413 and wrong content types 415. Caller abort or disconnect cancels provider fetch (`CANCELLED`, 499 if a response remains possible). Partial streams never count as success. Keep the question for explicit retry; do not fabricate an answer or change funding.

## VORA-specific public context

[The mapper](../lib/vora-agent-context.ts) reads finite public catalogs from [VORA](../lib/vora.ts) and [Health pass](../lib/vora-health-pass.ts). It matches a known German/English document name, then a module title within that document, and supplies its purpose, question, caution, choices and allowlisted references. Unknown or mismatched labels fall back to the known area. Health-pass selectors are `Health pass` with `Vaccination passport` or `Organ donation card`; no private card or vaccination state enters the mapper.

The instructions know the 40 distinct blocks (19/17/4), genuine official originals and the distinction between preparation, review and signing. They separate prevention eligibility from personal recommendations; real ePA from opted-in fictional Demo-ePA; old unverified notes from imported records; a local organ card from a state-register entry; and the four-step fictional appointment journey from real booking. Replies normally use 2–4 short sentences/bullets, one concrete next action and at most one useful follow-up. These instructions describe intended behaviour, not measured model compliance. Public summaries retain the recorded date 6 November 2026; the earlier RKI retrieval limitation remains explicit.

## Data and execution boundaries

Both modes use the fixed public Responses endpoint with product instructions, validated conversation, public catalog context, `store: false` and no tools. API-key mode caps output at 1,200 tokens. ChatGPT mode requests the actual account model catalog, selects its first displayable model in provider order and uses `stream: true`; unsupported fields including `max_output_tokens` are omitted. Only `response.completed` establishes inference success, and late usage errors stop it. See [models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) and [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations). No secret or account credential enters model input. Application code does not log prompt/response text or persist conversations server-side.

`store: false` disables response storage for later API retrieval. It is **not** proof of zero provider retention or an alternative to reviewing the account's applicable data controls and processing terms. Browser conversation retention is a separate frontend decision. Do not describe the whole conversation as device-only or promise zero retention.

The provider timeout is 25 seconds including response reading. Returned text and streamed text deltas are bounded to 6,000 characters, matching the per-message history limit; oversized answers fail explicitly rather than being truncated or making the next follow-up invalid. The plan stream has a 512,000-byte ceiling. There are no automatic retries or autonomous writes. A retry is a new request and can consume allowance or credits. Per-process admission allows three concurrent calls and 20 starts per minute, not a distributed/account-wide quota. Public hosted deployment needs its own approved integration and session/quota design. Supabase configuration and archive permissions are unchanged.

## Verification

[Assistant tests](../tests/vora-assistant.spec.ts), [OAuth/session tests](../tests/vora-chatgpt.spec.ts), [stream tests](../tests/vora-chatgpt-stream.spec.ts), [public-context tests](../tests/vora-agent-context.spec.ts) and [opt-in real local-route tests](../tests/vora-chatgpt-routes.spec.ts) cover the bounded contracts with synthetic data. The lead's final 20 agent/provider/context tests, production build and focused ESLint passed; assembled UI/production journey evidence is recorded in [current design acceptance](VORA-DESIGN.md#current-implementation-and-lead-acceptance--6-november-2026). These checks do not establish model accuracy, allowance or clinical/legal suitability. The user's earlier successful sign-in report is separate. The final local preview was restarted and an anonymous check confirmed availability; re-login is required after that restart. A completed live dialogue using the new VORA prompt has not been verified by the lead.

Implementation follows [OpenAI's prompt-engineering guidance](https://developers.openai.com/api/docs/guides/prompt-engineering): code-managed instructions, typed input, separation of trusted context and conversation, and representative boundary tests. Provider documentation is not evidence for medical or legal answers.
