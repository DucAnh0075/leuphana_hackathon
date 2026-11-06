# VORA conversation service

This service supports the consumer workspace with multi-turn orientation, explanations of document modules and suggested wording. Responses are suggestions for review. It cannot read private records, change a document, determine vaccine protection, sign, send or book anything.

## Configuration

Set `OPENAI_API_KEY` in the server environment. Never prefix credentials with `NEXT_PUBLIC_` or commit them. Optional `VORA_AI_MODEL` overrides `OPENAI_MODEL`; the default is `gpt-4.1-mini`. Restart the server after changing its environment. No extra SDK or production dependency is required.

`GET /api/vora/assistant` returns `{ configured: boolean, provider: "OpenAI" }`. This reports key presence only. It does not verify credentials, model access, account credit or provider reachability.

## Frontend contract

`POST /api/vora/assistant` accepts JSON from the application's own origin:

```json
{
  "consent": true,
  "locale": "de",
  "context": {
    "area": "documents",
    "documentTitle": "Patientenverfügung",
    "moduleTitle": "Was mir wichtig ist"
  },
  "messages": [
    { "role": "user", "content": "Welche Frage hilft mir beim Einstieg?" }
  ]
}
```

The UI must explain before sending that OpenAI receives the submitted chat history and current screen titles. The deliberate consent control must govern this request, including retries. Do not infer permission from opening a panel or selecting a document. Do not include stored answers, document content, vaccination records or a profile automatically. User-entered chat text may itself contain sensitive information; explain this at the input and minimize it.

Only the documented keys are admitted, including within context and messages. Limits: 24 messages, 6,000 characters per message, 18,000 total message characters and 80,000 request bytes. Roles are `user` and `assistant`; the last message must be from the user. Locale is `de` or `en`. Screen area is limited to 80 characters and optional titles to 160 each. The frontend should offer a new conversation rather than silently dropping older messages.

Success is `{ message: string, mode: "live", sources: [] }`. Only a completed provider text response can produce `live`. Sources are empty because this service does not retrieve documents or web sources. Do not label generated statements as verified or source-backed. Render the message as text, not HTML.

Failure is `{ error: string, code: string, mode: "unavailable" }` with an appropriate non-2xx status. Configuration failures use 503, provider failures 502, timeout 504, rejected consent/schema 400 and capacity limits 429 with `Retry-After: 60`. Cross-origin requests use 403; oversized bodies 413 and wrong content types 415. A caller abort cancels the provider fetch and is classified as `CANCELLED` (499 if a response can still be delivered). Keep the user's text available to retry; do not fabricate a fallback AI answer.

## Data and execution boundaries

The backend sends the validated conversation and screen titles to the fixed OpenAI Responses API endpoint. It adds product instructions, requests `store: false`, caps output at 1,200 tokens and supplies no tools. No secret, application record or user session is added to the model input. Secrets are read only by the server route. The application service does not log prompt or response text and does not persist the conversation server-side.

`store: false` disables response storage for later API retrieval. It is **not** proof of zero provider retention or an alternative to reviewing the account's applicable data controls and processing terms. Browser conversation retention is a separate frontend decision. Do not describe the whole conversation as device-only or promise zero retention.

The request has a 25-second provider timeout, including response reading. There are no automatic retries and no autonomous writes. A retry is a new provider request and may incur another charge. Per-process admission caps work at three concurrent calls and 20 starts per minute. This protects a bounded demo; it is not a distributed quota or user authentication system. Before public production deployment, the application owner needs account-scoped access and a shared quota aligned with the deployment topology, plus applicable privacy and data-processing review.

## Verification

[The contract tests](../tests/vora-assistant.spec.ts) exercise consent and unknown-key rejection, conversation bounds, provider payload and cancellation, unavailable/incomplete responses, error redaction and the request budget. Transport doubles establish the adapter contract; they do not establish live model availability or clinical/legal accuracy. A synthetic live test must be reported separately.

Implementation follows [OpenAI's Responses guidance](https://developers.openai.com/api/docs/guides/migrate-to-responses) and [API quickstart](https://developers.openai.com/api/docs/quickstart). These links describe the provider interface, not evidence for health or legal answers.
