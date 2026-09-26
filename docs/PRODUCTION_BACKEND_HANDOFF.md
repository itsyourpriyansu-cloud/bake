# The Pizza Wave — Production Backend Handoff

This document describes the post-approval replacement plan. It is not an instruction to connect the pitch prototype to live providers.

## Preserve these contracts

- `/api/v1` resource shapes and typed client services
- Separate Customer, Owner, and KDS authentication realms
- Server-shaped cart quote and modifier validation
- Order intent before payment and operational order only after verified payment
- Explicit order/payment/fulfillment state machines and append-only events
- Owner-authoritative versus chef-temporary availability
- One loyalty wallet across customer and store-assisted orders
- One conversation history for in-app and WhatsApp messages
- Shared realtime event names with polling fallback

## Replacement map

| Prototype | Production replacement | Required production behavior |
| --- | --- | --- |
| MSW handlers | FastAPI routers and application services | Validate every request server-side, enforce realm authorization, return the existing typed contracts, and publish domain events transactionally. |
| Dexie business persistence | PostgreSQL | Normalized transactional tables, constraints, indexes, migrations, encrypted sensitive data, backups, point-in-time recovery, and audit retention. |
| `DemoRealtimeTransport` | Authenticated WebSockets plus Redis pub/sub or streams | Per-customer/order/store authorization, reconnect cursors, event sequencing, replay or refetch after gaps, and horizontal fan-out. |
| `DemoPhonePeProvider` | PhonePe production integration | Server-created payment request, signed callback/webhook verification, idempotency, reconciliation, refund status polling, and no trust in frontend return URLs. |
| `DemoWhatsAppProvider` | WhatsApp Business Platform | Approved templates, opt-in/opt-out, webhook delivery status, conversation mapping, retry/dead-letter behavior, and secret rotation. |
| Fixed demo OTP | Production phone verification provider | Rate limits, expiry, attempt limits, abuse controls, encrypted identifiers, session rotation, and auditable verification. |
| Mock jobs and `DemoClock` | Redis-backed workers and scheduler | Durable delayed jobs, retries with backoff, idempotency keys, dead-letter queues, monitoring, and timezone-aware schedules. |

## Proposed service boundaries

Keep one deployable FastAPI application initially, with clear modules rather than premature microservices:

- Identity: customer OTP, Owner MFA, KDS trusted devices, sessions, and revocation
- Catalog: products, modifier groups/options, pricing, and effective availability
- Cart and Quote: authoritative validation, discounts, points caps, tax/fees, and quote expiry
- Checkout and Payments: checkout session, order intent, PhonePe, reconciliation, and refunds
- Orders and Kitchen: acceptance, scheduler, ETA, KDS commands, fulfillment, and order events
- Loyalty and CRM: ledger, pending/available/reversed points, tier calculations, segments, campaigns, and referrals
- Conversations: support cases, in-app messages, WhatsApp provider messages, and delivery status
- Notifications: templates, channel policy, preferences, jobs, and provider adapters

## PostgreSQL transaction requirements

Use database transactions for these boundaries:

1. Quote acceptance and order-intent creation.
2. Verified payment transition and creation of the paid order candidate.
3. Owner/system acceptance and creation of the KDS-visible fulfillment state.
4. Fulfillment completion, loyalty-ledger release, CRM update, and outbox events.
5. Rejection/refund transition and loyalty reversal.
6. Availability changes and catalog/cart revalidation events.

Use optimistic version columns on cart, order, availability, loyalty wallet, and conversation aggregates. Store money in integer paise, never floating-point values.

## Events and reliable delivery

Implement a transactional outbox. A worker publishes committed events to Redis and external providers. Consumers must be idempotent.

Minimum production events include:

- `PAYMENT_STATUS_CHANGED`
- `ORDER_CREATED`, `ORDER_ACCEPTED`, `ORDER_STATUS_CHANGED`
- `ETA_UPDATED`, `KITCHEN_PROBLEM_REPORTED`
- `AVAILABILITY_CHANGED`
- `LOYALTY_UPDATED`, `CUSTOMER_UPDATED`
- `REFUND_STATUS_CHANGED`
- `CONVERSATION_UPDATED`, `NOTIFICATION_CREATED`

WebSocket clients should receive an event sequence/cursor and invalidate the same TanStack Query keys used by the prototype. On disconnect or a sequence gap, refetch the authoritative resource.

## PhonePe production rules

- Create and sign payment requests only on the backend.
- Treat the frontend redirect as non-authoritative.
- Verify webhook signatures and merchant/order identifiers.
- Use a unique idempotency key for payment creation, capture confirmation, refund creation, and reconciliation.
- Keep payment state distinct from order and fulfillment state.
- Reconcile pending payments and refunds with scheduled workers.
- Store no provider secrets in Vite variables or browser bundles.

## Security and access control

- Customer: short-lived access token plus rotated refresh/session token, scoped to the customer account.
- Owner: MFA, least-privilege permissions, audit logs, secure recovery, and elevated-action confirmation.
- KDS: store-bound trusted device, PIN unlock, short inactivity timeout, and no customer CRM/revenue/refund access.
- Enforce authorization in FastAPI dependencies and application services, not only in route components.
- Add CSRF strategy where cookies are used, strict CORS, rate limits, input schemas, secret management, and privacy/retention policies.

## Migration sequence

1. Freeze the approved API schemas and generate contract tests from current fixtures.
2. Create PostgreSQL migrations and import the deterministic seed into a non-production environment.
3. Implement FastAPI read endpoints, then cart/quote and availability commands.
4. Implement identity realms and server session enforcement.
5. Implement order/payment state machines with outbox and idempotency.
6. Add PhonePe sandbox, verified webhooks, refunds, and reconciliation.
7. Add Redis workers, WebSockets, scheduler, and polling fallback verification.
8. Add WhatsApp Business and push adapters behind feature flags.
9. Run parallel contract/e2e tests against the mock and FastAPI implementations.
10. Perform security, load, failure-recovery, observability, backup-restore, and provider certification testing before launch.

## Production acceptance gates

- No client-calculated commercial total is accepted by the backend.
- No operational order exists before authoritative payment confirmation.
- Duplicate callbacks, commands, and worker retries are harmless.
- A disconnected client recovers state without losing or duplicating events.
- Loyalty and refunds reconcile from ledgers, not mutable counters alone.
- Owner and KDS permissions are server-enforced and independently revocable.
- Provider outages surface actionable exceptions without corrupting order state.
- Metrics, traces, structured logs, alerting, audit history, backups, and restore drills are operational.

