# Bakery Wave WhatsApp Authentication

> **Status:** Approved implementation specification. This document describes the production system to build; it does not mean the backend or WhatsApp integration already exists.
>
> **Cost basis:** Estimates and message rates in this document were researched in September 2026. Meta's service-message pricing described below takes effect on October 1, 2026. Verify vendor pricing again before purchase or launch.

## 1. Purpose

Bakery Wave will support a low-friction customer sign-in journey initiated through WhatsApp:

1. A customer scans a QR code in a hotel, shop, or brochure.
2. A Bakery Wave campaign URL records the scan and opens WhatsApp with a prefilled affirmative message.
3. The customer taps **Send**. WhatsApp does not permit the QR code to send the message automatically.
4. Meta's webhook identifies the WhatsApp user and Bakery Wave replies with one short-lived, single-use sign-in link.
5. The link opens a minimal confirmation page. The customer taps **Continue** once.
6. Bakery Wave consumes the link, establishes a secure server-side session, and redirects the customer into the PWA already signed in.

Customers may also type `LOGIN`, `START`, `SIGN IN`, or `OPEN APP` directly to the bakery's WhatsApp number to request the same link. Unrelated messages remain support conversations and do not generate credentials.

## 2. Current State and Production Gap

The current Bakery Wave application is a browser-only Vite/MSW prototype:

- WhatsApp and OTP delivery are simulated.
- OTP verification accepts a fixed demonstration credential.
- The customer object and expiry are trusted from `localStorage` rather than a signed or server-managed session.
- Customer and order data are stored in browser IndexedDB.
- Protected-looking APIs do not perform server-side authentication or customer authorization.
- The Vercel configuration deploys a static SPA and has no production webhook or authentication backend.

A real WhatsApp sign-in cannot be added safely as a frontend-only feature. Production work must introduce a trusted backend and move customer-owned data behind authenticated APIs. The mock service worker and IndexedDB data must be available only in an explicit demo build and must not intercept production authentication or customer APIs.

## 3. Confirmed Product Decisions

| Area | Decision |
| --- | --- |
| First-time customer | Automatically create a customer account after successful link consumption |
| WhatsApp integration | Direct Meta WhatsApp Cloud API |
| WhatsApp number | New dedicated customer login and support number |
| Staff support | WhatsApp Business App/API coexistence where Meta confirms eligibility |
| App target | Responsive web/PWA; installed-PWA opening is best effort |
| Sign-in confirmation | One explicit **Continue** tap |
| Magic-link lifetime | Five minutes and one use |
| Session lifetime | 30-day idle timeout and 90-day absolute timeout |
| Initial volume | Fewer than 1,000 WhatsApp sign-in replies per month |
| QR analytics | Count scans, messages received, links delivered, and successful sign-ins |
| Campaign granularity | One non-secret code per location/channel/campaign |
| SMS fallback | MSG91-backed India SMS OTP, sent only when the customer requests it |
| Customer backend scope | Profiles, carts, addresses, orders, saved designs, assets, and checkout ownership |
| Owner/KDS auth | Separate security realm and later production phase |

## 4. Target Architecture

### 4.1 Services

- **Frontend:** Existing Bakery Wave Vite PWA.
- **Application backend:** TypeScript Vercel Functions deployed in the Mumbai region.
- **Primary database:** Managed Postgres, initially Supabase Pro in the nearest available India region.
- **Asset storage:** Supabase Storage or an equivalent private object store.
- **WhatsApp:** Direct Meta WhatsApp Cloud API.
- **Rate limiting:** Upstash Redis.
- **Durable jobs:** Upstash QStash for webhook work and outbound messages.
- **SMS fallback:** MSG91 behind a provider interface, using approved Indian DLT templates.
- **Monitoring:** Structured application metrics, error tracking, delivery status, and spend alerts without credential or message-body logging.

### 4.2 End-to-end flow

```text
Printed QR
  -> GET /r/H07-A
  -> record privacy-minimized scan
  -> 302 to wa.me/<business-number>?text=<encoded-login-message>
  -> customer taps Send
  -> Meta webhook
  -> verify signature + deduplicate message
  -> identify/create customer
  -> create five-minute one-time token
  -> queue one WhatsApp reply containing the link
  -> /auth/whatsapp#t=<secret>
  -> customer taps Continue
  -> POST /api/auth/whatsapp/exchange
  -> atomically consume token + create session
  -> set secure HttpOnly cookie
  -> redirect to /bakery/app/
```

Example QR-prefilled message:

```text
Yes, send me a secure Bakery Wave sign-in link. Ref H07-A.
```

The example contains no phone number, authentication secret, or privileged referral value.

## 5. QR Campaign and Attribution Design

Each physical location or channel receives a campaign code and first-party redirect URL such as:

```text
https://bakery.example/r/H07-A
```

The redirect endpoint must:

1. Validate that the campaign exists and is active.
2. Record a scan timestamp and campaign ID with privacy-minimized technical metadata.
3. Return a fast `302` to the encoded `wa.me` destination.
4. Never place a login token, customer identifier, discount entitlement, or other secret in the QR code.

Campaign codes are analytics labels and can be copied or spoofed. They must not control authorization, discounts, payouts, or partner commissions. Any future financial referral feature requires independently signed referral claims and fraud controls.

The reporting funnel will keep these events distinct:

- QR scanned.
- Login-intent message received.
- Sign-in link accepted by Meta.
- Sign-in link delivered or failed.
- Login transaction consumed.
- Authenticated session established.

## 6. WhatsApp Identity and Account Linking

### 6.1 Primary identity model

Use an internal immutable `customer_id`. A phone number is an identity attribute, not the customer primary key.

Meta's 2026 WhatsApp username rollout means a webhook may identify a customer using a business-scoped user ID while withholding the phone number. The identity model therefore must support:

- WhatsApp business-scoped user ID/BSUID or `user_id` when supplied.
- Legacy WhatsApp `wa_id`.
- Verified E.164 phone number.
- Verified SMS phone identity.

Store phone numbers encrypted at rest. Use a keyed HMAC of the normalized number for deterministic lookup; never use an unsalted phone hash because the phone-number space is enumerable.

### 6.2 New customer

On the first successfully consumed WhatsApp link:

1. Create the customer if no matching verified identity exists.
2. Attach the verified WhatsApp identity.
3. Use the WhatsApp display name only as an editable profile suggestion.
4. Establish the customer session.
5. Do not treat login consent as marketing consent.

### 6.3 Legacy phone-account merge

If Meta supplies both a BSUID and phone, attach both verified identities to the same customer in one transaction.

If Meta supplies only a BSUID and the customer asks for old orders or rewards:

1. Create or keep a provisional WhatsApp customer.
2. Ask the customer to enter the legacy phone number in Bakery Wave.
3. Send an MSG91 SMS OTP only after the customer requests it.
4. Verify the OTP.
5. Atomically merge identities and customer-owned records.
6. Record an auditable merge event without logging the OTP or full phone number.

Never merge accounts using display-name similarity or an unverified number.

## 7. Magic-link Security

### 7.1 Token creation

- Generate 32 random bytes using a cryptographically secure random-number generator.
- Encode the browser token with base64url.
- Store only an HMAC-SHA-256 digest or equivalent keyed digest in Postgres.
- Bind the transaction to the customer identity, initiating WhatsApp message, campaign, creation time, expiry, and server-approved return destination.
- Expire the transaction after five minutes.
- Invalidate older unused login transactions when issuing a new one for the same identity.
- Never revive an expired transaction.

### 7.2 Link construction

Use a fragment so link previews, proxies, HTTP logs, and referrer headers do not receive the credential:

```text
https://bakery.example/auth/whatsapp#t=<one-time-random-token>
```

Do not put a session cookie, reusable JWT, phone number, or customer ID in the URL.

### 7.3 Confirmation page

Serve `/auth/whatsapp` outside the existing `/bakery/` service-worker scope. It must be a minimal same-origin page with:

- No analytics, tag managers, advertising scripts, or third-party assets.
- `Cache-Control: no-store`.
- `Referrer-Policy: no-referrer`.
- A strict Content Security Policy.
- No token persistence in localStorage, sessionStorage, IndexedDB, cookies, or logs.

The page reads the fragment into memory, immediately strips it using `history.replaceState`, then waits for the customer to tap **Continue**. The tap sends the token in the body of a `POST` request to the exchange endpoint.

### 7.4 Atomic exchange

The exchange transaction must atomically:

1. Locate the stored token digest.
2. Confirm it is unused, unrevoked, and unexpired.
3. Mark it consumed.
4. Create and persist the authenticated session.
5. Commit before returning success.

Expired, replayed, invalid, or revoked tokens return the same neutral retry screen and a safe link back to WhatsApp. The response must not reveal whether a customer already exists.

Only server-defined Bakery Wave routes may be used as post-login destinations. Arbitrary `returnTo` URLs are forbidden.

## 8. Session and Authorization Model

### 8.1 Session cookie

Issue a random opaque session ID and store only its digest server-side. Set it using:

```text
__Host-bw_session=<opaque-value>; Secure; HttpOnly; SameSite=Lax; Path=/
```

Do not store authentication tokens in browser storage.

### 8.2 Lifetime and rotation

- Idle timeout: 30 days after the last accepted authenticated activity.
- Absolute timeout: 90 days after the original sign-in.
- Rotate on sign-in and at least every 24 hours during active use.
- Allow a short overlap for requests from parallel tabs during rotation.
- Permit at most five active customer-device sessions.
- Record only privacy-minimized device/session descriptors.

### 8.3 Revocation and step-up authentication

Support:

- Log out this device.
- Log out all devices.
- Server-side revocation after account suspension or suspicious activity.
- Automatic expiry of idle and absolute sessions.

Require fresh WhatsApp or SMS verification for:

- Changing the verified phone identity.
- Exporting or deleting the account.
- Logging out all other devices.
- Suspicious identity or device changes.
- Configurable high-value orders.

### 8.4 Expired-session experience

When an API returns `401`:

1. Preserve the anonymous cart and approved return route.
2. Clear authenticated client state.
3. Show a concise session-expired screen.
4. Offer WhatsApp sign-in first.
5. Offer SMS OTP only when the customer explicitly requests the fallback.

## 9. Public HTTP Interfaces

### `GET /r/:campaignCode`

Validates the campaign, records the scan, and redirects to the correct `wa.me` URL. Campaign codes are not secrets.

### `GET /api/whatsapp/webhook`

Performs Meta webhook subscription verification by validating the configured verify token and returning the supplied challenge.

### `POST /api/whatsapp/webhook`

- Verify `X-Hub-Signature-256` against the exact raw request body using the Meta app secret and a timing-safe comparison.
- Confirm the expected WABA and phone-number identifiers.
- Accept inbound messages and outbound delivery-status events.
- Persist the event or durable job before returning `200`.
- Deduplicate using Meta's message/event identifier.
- Do not perform slow outbound API calls before acknowledging the webhook.

### `POST /api/auth/whatsapp/exchange`

Consumes a one-time token, creates the customer when necessary, establishes the server session, sets the cookie, and returns the approved app destination.

### `POST /api/auth/sms/request`

Accepts an E.164 phone number and approved purpose, applies abuse controls, creates a short-lived hashed OTP challenge, and requests an MSG91 DLT-approved message.

### `POST /api/auth/sms/verify`

Validates the challenge, attempt count, expiry, and OTP using constant-time comparison. It may create a fallback session or authorize a legacy identity merge, depending on the recorded purpose.

### `GET /api/auth/session`

Returns the minimal authenticated customer projection, session expiry metadata, and permissions. It never returns the session secret.

### `DELETE /api/auth/session`

Revokes the current server session and expires its cookie.

### `DELETE /api/auth/sessions`

Requires fresh verification and revokes all customer sessions.

## 10. Core Data Records

### `customers`

Internal customer ID, profile state, display name, lifecycle status, and timestamps.

### `customer_identities`

Customer ID, provider, provider subject/BSUID, encrypted phone when known, keyed phone lookup value, verification method, and timestamps. Provider plus subject must be unique.

### `login_transactions`

Token digest, identity/customer reference, initiating message, campaign, approved return destination, creation and expiry, consumption and revocation timestamps. Token digest must be unique.

### `sessions`

Session digest, customer, issued/last-seen/idle-expiry/absolute-expiry/revocation times, rotation lineage, and privacy-minimized device label.

### `sms_challenges`

Purpose, phone lookup reference, hashed OTP, creation and expiry, failed-attempt count, send status, and consumption timestamp. Never store the plaintext OTP.

### `whatsapp_webhook_events`

Provider event/message ID, safe event type, processing state, attempt count, and timestamps. Provider identifiers must be unique for idempotency.

### `message_outbox`

Message purpose, destination identity, safe template/body reference, deduplication key, provider message ID, status, attempts, and next-attempt time.

### `campaigns` and `campaign_events`

Campaign code, channel/location metadata, active state, event type, timestamp, and privacy-minimized attribution metadata.

### Customer-owned data

Profiles, addresses, carts, orders, saved designs, uploads, and checkout state must reference `customer_id`. Every read and write must derive that customer from the authenticated server session.

## 11. Customer Data Productionization

Preserve the existing `/api/bakery/v1` frontend contract where practical, but replace production MSW handlers with authenticated server handlers.

- Allow an anonymous cart locally.
- After sign-in, merge quantities into the active server cart.
- Revalidate products, options, availability, price, discount, tax, fulfillment method, and delivery slot on the server.
- Never trust totals or customer IDs supplied by the browser.
- Store customer cake/design uploads using customer-scoped object keys.
- Use short-lived signed upload and download URLs.
- Validate file signature, MIME type, extension, dimensions, and size.
- Keep uploaded assets private until explicitly exposed through an authorized workflow.
- Store replication/approval status and comments server-side.

Owner and KDS applications must use a separate staff authentication and role model. The customer WhatsApp cookie must never grant staff or operational write access. Production owner/KDS authentication is outside this phase.

## 12. Webhook Reliability and Abuse Controls

Meta may retry failed webhook delivery and may send duplicate or out-of-order events. Processing must therefore be idempotent.

1. Validate the signature and known WABA/number.
2. Insert the provider message ID with a unique constraint.
3. Create the outbox job in the same database transaction.
4. Acknowledge Meta promptly.
5. Send the WhatsApp reply asynchronously.
6. Store delivery/failure status and retry transient failures with capped backoff.
7. Run an outbox sweeper to recover interrupted jobs.

Initial limits:

- Three login links per WhatsApp identity per 15 minutes.
- Ten login links per WhatsApp identity per day.
- Ten exchange attempts per IP per minute, plus single-use enforcement.
- Sixty campaign redirects per IP per minute before escalation/challenge.
- OTP attempt and resend limits enforced per phone lookup, IP, and device risk signal.
- A global daily messaging-spend limit and circuit breaker.

Responses must not disclose whether an identity or phone number already has an account.

## 13. Privacy, Retention, and Operational Security

- Login consent authorizes the requested authentication reply, not promotional messaging.
- Capture order updates and marketing permissions separately and support withdrawal.
- Do not log raw webhook bodies, complete phone numbers, OTPs, magic tokens, session cookies, Meta tokens, or app secrets.
- Keep secrets in managed encrypted environment variables and rotate them through a documented runbook.
- Delete or irreversibly anonymize consumed/expired login-transaction details after the short fraud-investigation window.
- Retain pseudonymous security/audit logs in India for 180 days, subject to final Indian legal review.
- Apply separate legal retention schedules to orders, invoices, and tax records.
- Provide customer access, correction, deletion, consent withdrawal, and incident-response procedures before launch.

## 14. Cost Estimate

All figures are planning estimates, not vendor quotations.

### 14.1 Recurring platform cost

| Item | Expected launch cost |
| --- | ---: |
| Meta service/login replies below 1,000 delivered messages per month | ₹0 Meta delivery fee under the October 2026 allowance |
| Meta at 10,000 delivered login replies per month | Approximately ₹1,035 plus applicable tax |
| Vercel Pro | USD 20/month |
| Supabase Pro | From USD 25/month |
| Upstash Redis and QStash at launch volume | Expected to remain free or near-free |
| MSG91 fallback SMS | Account/dial-plan rate plus DLT costs; written quote required |
| Domain, SIM/number, monitoring, and storage growth | Usage/vendor dependent |

Practical initial production allowance: **₹4,000–₹7,000 per month plus taxes, SMS usage, storage growth, domain, and number costs**.

Meta's published India change effective October 1, 2026 prices delivered service messages at ₹0.115 after the first 1,000 service messages per business phone number each month. The login flow must therefore send one concise reply containing the link rather than separate greeting, link, and follow-up messages. Confirm the live Meta rate card immediately before launch.

### 14.2 Implementation estimate

| Workstream | Estimate |
| --- | ---: |
| WhatsApp/SMS/session security foundation | 15–25 engineering days |
| Customer-data backend productionization | 20–35 engineering days |
| Total | 35–60 engineering days |
| Indicative elapsed delivery | 7–12 calendar weeks |
| Indicative India freelancer/agency budget | ₹3.5–₹10 lakh |

Meta business verification, number approval, coexistence eligibility, and Indian DLT approval can add calendar time independently of engineering effort.

## 15. Test Matrix

### QR and campaign

- Valid, inactive, unknown, malformed, and copied campaign codes.
- Scan event remains separate from WhatsApp message and successful login.
- Redirect contains only the intended number, message, and non-secret campaign code.
- Campaign spoofing never grants a security or financial benefit.

### Webhook

- Correct and incorrect verification token.
- Valid, missing, malformed, and incorrect request signatures.
- Expected and unexpected WABA/phone-number identifiers.
- Duplicate message IDs and duplicate delivery-status events.
- Batched, retried, delayed, and out-of-order events.
- Unsupported content type and ambiguous support messages.
- Durable enqueue succeeds before the endpoint returns `200`.

### Identity

- New BSUID user with no phone number.
- Legacy `wa_id`/phone user.
- Payload containing both BSUID and phone.
- Successful and failed SMS legacy-account merge.
- Simultaneous account creation and merge attempts.
- Same display name on unrelated accounts does not trigger a merge.

### Magic link

- Successful link within five minutes.
- Expired, already-used, revoked, malformed, and unknown token.
- New request invalidates the older unused link.
- WhatsApp link preview and security scanner cannot consume the token.
- Forwarded unused link remains limited by one use and five-minute expiry.
- Token is absent from server/access/referrer logs and browser storage.
- Arbitrary external return destinations are rejected.

### Sessions

- Required cookie flags and host-only behavior.
- Thirty-day idle and 90-day absolute expiry.
- Rotation, concurrent tabs, and overlap expiration.
- Five-device maximum.
- Current-device and all-device logout.
- Revoked, forged, expired, and cross-customer sessions.
- CSRF/origin enforcement on unsafe requests.
- Step-up authentication for sensitive actions.

### Customer data

- Anonymous cart merge and duplicate-item quantities.
- Server-side price, discount, tax, availability, and slot recalculation.
- Cross-customer access to profiles, addresses, carts, orders, designs, and files is rejected.
- Upload signature, MIME, extension, dimension, and size validation.
- Private asset links expire and cannot be reused outside policy.

### SMS fallback

- Fallback is sent only after explicit customer action.
- Approved DLT sender/template is used.
- OTP expiry, maximum attempts, resend delay, throttling, and replay.
- MSG91 timeout, rejected request, failed delivery, and provider outage.
- OTP and full phone number never enter logs.

### PWA and browser

- WhatsApp in-app browser on Android and iOS.
- Chrome, Safari, and installed-PWA best-effort handoff.
- Callback page is outside the cached MSW service-worker scope.
- Offline, refresh-before-Continue, back-button, and multiple-tab behavior.
- Expired-session flow preserves the guest cart and approved return route.

## 16. Acceptance Criteria

- Every protected customer endpoint rejects unauthenticated, expired, revoked, forged, and cross-customer requests.
- Webhooks are durably acknowledged internally within one second under expected load.
- One successful login request produces at most one outbound WhatsApp reply.
- A Meta retry cannot create a second login reply for the same inbound message.
- Magic links expire after five minutes and cannot be consumed twice.
- Authentication secrets never appear in URLs sent to the server, logs, analytics, browser storage, or error reports.
- Sessions obey the 30-day idle and 90-day absolute limits and can be revoked server-side.
- QR reporting shows scan-to-message-to-login conversion by campaign.
- Dashboards expose delivery failures, token expiry, throttling, queue backlog, authentication errors, and messaging spend.
- The fixed demo OTP and production MSW customer APIs are absent from the production bundle/runtime.

## 17. Rollout Plan

### Phase 1: Provider and compliance setup

- Create/verify the Meta Business Portfolio and WABA.
- Register the dedicated number, two-step verification PIN, payment method, and system-user credentials.
- Validate Business App/API coexistence eligibility in India.
- Complete MSG91 and DLT onboarding.
- Approve privacy notices, consent copy, retention, incident-response, and processor terms.

### Phase 2: Authentication foundation

- Create Postgres migrations and identity/session services.
- Implement campaign redirect, Meta webhook, durable outbox, and Cloud API reply.
- Implement the isolated confirmation page and atomic exchange.
- Add session middleware, logout, session listing, revocation, rate limits, and monitoring.
- Implement requested MSG91 OTP fallback.

### Phase 3: Customer-data backend

- Replace customer-facing production MSW handlers with authenticated APIs.
- Move profiles, carts, addresses, orders, saved designs, uploads, and checkout ownership to the backend.
- Add anonymous-cart merge and server-side checkout validation.
- Disable mock and demo authentication in production.

### Phase 4: Pilot and launch

- Test using Meta's test number and non-production environment.
- Run internal security, reliability, and browser/PWA testing.
- Pilot one physical location and one brochure campaign.
- Review the funnel, failures, staff support handoff, and spend.
- Expand QR distribution only after pilot acceptance criteria pass.
- Keep the old login interface behind a rollback feature flag until the production flow is stable.

## 18. Launch Checklist

- [ ] Meta Business Portfolio and WABA verified.
- [ ] Dedicated WhatsApp number registered with two-step verification.
- [ ] WABA payment method configured.
- [ ] Business App/API coexistence confirmed for the number.
- [ ] Production webhook TLS, signature verification, and WABA validation enabled.
- [ ] System-user token and app secret stored and rotation tested.
- [ ] MSG91 account and Indian DLT entity/sender/template approved.
- [ ] Postgres backups and restoration test completed.
- [ ] Rate limits, queues, outbox sweeper, spend cap, and alerts enabled.
- [ ] Privacy notice, login copy, separate marketing consent, and support escalation published.
- [ ] Security and authorization test matrix passed.
- [ ] Production build does not start Bakery MSW or accept demo OTP credentials.
- [ ] Incident, provider-outage, credential-rotation, and rollback runbooks approved.
- [ ] Live vendor rates rechecked before purchasing or printing QR materials.

## 19. Assumptions and Boundaries

- Launch traffic remains below 1,000 WhatsApp login replies per month.
- Bakery Wave launches as a responsive website/PWA. WhatsApp can open the HTTPS experience, but browsers and operating systems decide whether an installed PWA opens automatically.
- Current IndexedDB and mock records are demonstration data and will not be migrated automatically.
- Owner and KDS production authentication and role-based operational permissions are a separate phase.
- The selected dedicated number is eligible for the intended Meta onboarding and coexistence mode; otherwise the documented support-page fallback is used.
- Vendor rates, taxes, exchange rates, free allowances, and regulatory requirements may change and must be reconfirmed before launch.

## 20. Official Research Sources

- [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934)
- [WhatsApp QR codes](https://faq.whatsapp.com/888878128766436/)
- [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/?lang=en_US)
- [WhatsApp Platform pricing](https://whatsappbusiness.com/products/platform-pricing/)
- [Meta rate cards effective October 1, 2026](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#rate-cards-effective-october-1-2026)
- [Meta WhatsApp webhook overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview)
- [Meta webhook endpoint requirements](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/)
- [Meta Cloud API examples](https://github.com/fbsamples/whatsapp-api-examples)
- [Meta WhatsApp usernames and business-scoped user IDs](https://developers.meta.com/resources/videos/whatsapp-usernames/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Vercel pricing](https://vercel.com/pricing)
- [Vercel Functions usage and pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [Upstash QStash pricing](https://upstash.com/pricing/qstash)
- [MSG91 India SMS pricing](https://msg91.com/in/pricing/sms/pricing-india)
- [MSG91 OTP service](https://msg91.com/in/otp)

---

This README intentionally remains independent of `README_DEPLOY.md` and `BAKERY_WAVE_UI_UX_IMPLEMENTATION_PLAN.md` so deployment instructions, UI/UX planning, and authentication architecture can evolve without obscuring one another.
