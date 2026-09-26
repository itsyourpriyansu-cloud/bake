# Pizza Wave — Prototype Domain Engine

This is the internal engine behind The Pizza Wave prototype: domain models, business
engines, a mock database, a mock `/api/v1` backend, demo scenarios, and tests. It exists so
a frontend agent (Codex) can build the Customer PWA, Founder Control Center and KDS by
calling stable, typed services — without inventing any business logic itself.

Read [`CODEX_FRONTEND_HANDOFF.md`](./CODEX_FRONTEND_HANDOFF.md) before starting frontend work.

## Folder map

```text
src/
  domain/            pure business logic — no React, no Dexie, no MSW, no I/O
    store/           StoreConfig, Capabilities + capability.engine
    customer/        Customer, DemoCustomerView (Stage 1 UI adapter)
    catalog/         Category, Product, ModifierGroup + filterMenuProducts
    cart/             Cart/CartItem + buildCartSnapshot
    pricing/          CartQuote + pricing.engine (the only place totals are computed)
    availability/     AvailabilityRecord + availability.engine (owner/chef/system hierarchy)
    loyalty/          LOYALTY_TIERS + loyalty.engine (tier, points, redemption, bonuses)
    payment/          PaymentAttempt + payment.machine (state machine, idempotent confirm)
    orders/           Order/OrderIntent/OrderEvent + order.machine, order.logic, acceptance.engine
    fulfillment/       scheduler.ts (prep-time + load-based promise calculation)
    kitchen/          kitchen.logic.ts (queue, start prep, override prep time, mark ready)
    refunds/          Refund + refund.machine (state machine)
    crm/              crm.engine (stage/activity/tags derivation)
    attention/         AttentionItem + attention.engine (founder's exception queue)
    conversation/      ChatIntent + intent.engine (deterministic keyword classifier)
    support/           SupportCase + support.logic
    auth/              DEMO_CREDENTIALS + session.policy (per-realm sessions)
    shared/            ids.ts, clock.ts (DemoClock — never read Date.now() directly)

  services/
    api/               the ONE import surface for the frontend — see below
    realtime/          RealtimeTransport interface + DemoRealtimeTransport (event bus adapter)
    payment/           PaymentProvider interface + DemoPhonePeProvider (fake PhonePe)
    messaging/         MessagingProvider interface + DemoWhatsAppProvider (fake WhatsApp)
    auth/              CustomerAuthProvider interface + DemoCustomerAuthProvider (fake OTP)

  prototype/
    database/db.ts      Dexie/IndexedDB schema — every entity the engine persists
    seed/                frozen demo data (store, customers, catalog, orders, loyalty, ...)
    msw/handlers/         the mock /api/v1 — thin: validates input, calls domain/*, persists
    scenarios/            one-click demo state loaders (see below)
    automation/            periodic sweep: expires availability overrides, stale intents
    events/                typed event bus all state changes emit through
    demo/                  demo-controller (façade), reset-demo, demo-clock

  surfaces/ + features/    the existing Stage 1 UI (unchanged in spirit — see handoff doc)
```

## Domain models (Zod-first)

Every domain folder follows the same pattern: a `*.schema.ts` file is the single source of
truth (a Zod schema), and `*.types.ts` re-exports `z.infer<>` types from it. Nothing
hand-duplicates a shape that already has a schema. Engines (`*.engine.ts` / `*.logic.ts` /
`*.machine.ts`) are pure functions — they take plain data and a `Date`/`Clock`, and return
plain data. They never touch Dexie or `fetch` directly, which is what keeps them unit-testable
and swappable when the real FastAPI backend replaces MSW.

Key models: `StoreConfig`/`Capabilities`, `Customer`, `Category`/`Product`/`ModifierGroup`,
`Cart`/`CartItem`/`CartQuote`, `AvailabilityRecord`, `LoyaltyTier`/`LoyaltyTransaction`,
`OrderIntent`/`Order`/`OrderEvent`, `PaymentAttempt`, `Refund`, `AttentionItem`,
`Conversation`/`ChatMessage`, `SupportCase`, `CustomerSession`/`OwnerSession`/`KdsSession`
(server-side, in `domain/auth` — distinct from the Stage 1 browser sessionStorage shapes in
`shared/types/domain.ts`, see the handoff doc).

## State machines

- **Payment** (`domain/payment/payment.machine.ts`): `NOT_STARTED → PENDING → CONFIRMED |
  FAILED | RECONCILING`. `confirmPayment()` is idempotent — confirming an already-CONFIRMED
  attempt returns it unchanged instead of throwing or re-emitting `PAYMENT_CONFIRMED`.
- **Order acceptance** (`domain/orders/order.machine.ts`): `NOT_APPLICABLE →
  AWAITING_ACCEPTANCE → ACCEPTED | REVIEW_REQUIRED → ACCEPTED | REJECTED`. `REJECTED` and
  `ACCEPTED` are terminal. `isVisibleToKitchen()` is the single predicate for "can KDS see
  this order" — always `paymentConfirmed && acceptanceStatus === 'ACCEPTED'`.
- **Order fulfillment**: `NOT_STARTED → SCHEDULED → PREP_DUE → PREPARING → READY →
  DISPATCHED → DELIVERED` (or `→ PICKED_UP` / `→ STORE_COMPLETED` from READY).
- **Refund** (`domain/refunds/refund.machine.ts`): `REQUESTED → APPROVED → SUBMITTED →
  PROCESSING → SUCCESS | FAILED`, with `FAILED → REVIEW_REQUIRED → APPROVED` for retries.

All four machines reject invalid transitions by throwing (`InvalidPaymentTransitionError`,
`InvalidOrderTransitionError`, `InvalidRefundTransitionError`) rather than silently
coercing state.

## The acceptance pipeline (payment → kitchen)

1. `POST /payment/:merchantOrderId/confirm` is the simulated PhonePe webhook. It's the ONLY
   place a payment becomes `CONFIRMED`, and it's idempotent (replays return the same result).
2. On a genuinely new confirmation, `_orderProcessing.ts#confirmPaymentAndCreateOrder`:
   - creates the `Order` from the `OrderIntent` (also idempotent, keyed on `orderIntentId` —
     see `domain/orders/order.logic.ts#createOrderFromIntent`)
   - records a `PAYMENT_CONFIRMED` event and an `EARN_PENDING` loyalty transaction
   - validates cart availability (`domain/availability/availability.engine.ts`)
   - runs `domain/orders/acceptance.engine.ts#evaluateOrderAcceptance`, which checks payment,
     store/fulfillment capability, KDS online, availability, and asks the scheduler
     (`domain/fulfillment/scheduler.ts`) whether kitchen load allows a safe promise
   - applies the result: `AUTO_ACCEPT` (schedule + `ORDER_ACCEPTED`), `OWNER_REVIEW`
     (creates an `ORDER_REVIEW` `AttentionItem`), or `REJECT` (creates a `Refund`)
3. An unpaid order can never reach `AUTO_ACCEPT`/`OWNER_REVIEW` — `paymentConfirmed: false`
   is a hard `REJECT` before anything else is evaluated.
4. A rejected order's `fulfillmentStatus` is set to `CANCELLED` in the same transition, so
   it can never appear in `getKitchenQueue()` (which additionally filters on
   `acceptanceStatus === 'ACCEPTED'`).

Owner manual accept/reject (`POST /owner/orders/:id/accept|reject`) reuses the same
`scheduleOrder`/`acceptOrder`/`rejectOrder` functions and the same live kitchen-load count
(`getActiveKitchenOrderCount()`) as the automatic path, so a founder overriding a review
queue sees the same reality the engine did.

## Loyalty

`domain/loyalty/loyalty.tiers.ts` is the single source of truth for tiers and configuration:

- Tiers: Member (2%), Silver (3 orders / ₹1000, 3%), Gold (6 / ₹2500, 4%), Platinum (10 /
  ₹4500, 5%) — `calculateTier()` requires **both** the order-count and spend thresholds.
- Qualification window 120 days, downgrade grace 30 days, points expiry 180 days.
- Redemption: minimum 50 points, capped at 20% of eligible subtotal, further capped at
  points available (`calculateRedemption()`).
- Frequency bonus: +25 at 3 completed orders / rolling 30 days, +50 at 5 (highest band
  wins, not cumulative).
- Points are **pending** on payment confirmation (`applyPendingEarnOnPayment`) and only
  become **available** on fulfillment completion (`applyOrderCompletion`, called from
  `_fulfillmentCompletion.ts#completeOrderFulfillment` — the single settlement point that
  also recalculates CRM stage/activity/tags and tier). A refund reverses the linked order's
  points (`applyRefundReversal`) via `refund.handlers.ts`.

## Availability hierarchy

`domain/availability/availability.engine.ts#getEffectiveAvailability` resolves, in order:
**OWNER** override → catalog `product.available === false` (also owner-level) → **CHEF**
temporary disable → **SYSTEM** disable → `AVAILABLE`. An owner override always wins even
over a live chef temp-unavailable record. Chef disables carry an `expiresAt` (30 min / 60
min / rest of day) and the automation sweep (`prototype/automation/automation.engine.ts`)
clears expired records periodically — nothing needs to poll for "did this expire yet."

## Mock API (`prototype/msw/handlers`)

Routes are grouped by resource (`catalog`, `config`, `availability`, `cart`, `checkout`,
`payment`, `orders`, `owner`, `kds`, `loyalty`, `crm`, `chat`, `support`, `refund`, `auth`,
`demo`) and aggregated in `handlers/index.ts`. Handlers are intentionally thin: parse the
request, call into `domain/*`, persist via Dexie, emit an event. The only real orchestration
lives in `_orderProcessing.ts` and `_fulfillmentCompletion.ts` because it spans multiple
domains (payment + acceptance + loyalty, or fulfillment + loyalty + CRM) — everything else
should stay a one-to-one mapping from route to domain call.

`prototype/msw/browser.ts` is used by the Vite app (`CustomerDataBoundary`);
`prototype/msw/server.ts` (Node) is available for future server-side/integration tests.

## Demo credentials

| Realm | Credential |
|---|---|
| Customer | phone `9876543210`, OTP `123456` |
| Owner | `owner@pizzawave.demo` / `PizzaWave@123` / 2FA `654321` |
| KDS | PIN `2580` |

(The current Stage 1 `OwnerPage`/`KdsPage` shells still check these directly against
`sessionStorage`; `domain/auth` + `/auth/*` MSW routes are the production-shaped version
for Codex's rebuilt Owner/KDS login flows.)

## Demo scenarios

`POST /demo/scenario/:name` (or `demoController.loadScenario(id)`) resets the database and
puts the engine into one of nine states, listed at `GET /demo/scenarios`:

| Scenario | What it sets up |
|---|---|
| `happyDelivery` | Clean slate — next paid order auto-accepts |
| `ownerReview` | Kitchen at 100% load (8/8) — next paid order requires founder review |
| `chefDelay` | One order already preparing at 18 min, ready for a prep-time override demo |
| `unavailableItem` | Mushroom Cheese Pizza chef-disabled for 60 minutes |
| `returningStoreMember` | Highlights CUST001 (Gold Wave, 182 pts) for Wave ID / phone+OTP linking |
| `complaintRefund` | Open MISSING_ITEM support case + attention item on a completed order |
| `paymentFailure` | Next payment initiated fails at the (fake) provider |
| `paymentPending` | Next payment stays PENDING until manually resolved |
| `kdsOffline` | KDS marked offline — new paid orders are rejected until it's back |

Every scenario starts from `resetDemoDatabase()`, so scenarios compose predictably and are
safe to click through repeatedly in a live pitch.

## Resetting the demo

`POST /demo/reset` (`api.demo.resetDemo()`) or `demoController.reset()`. This clears every
Dexie table and reseeds from `prototype/seed/*` — store config, two customers (CUST001
"Priyanshu", Gold Wave, and a fresh CUST002), 5 categories / 12 products, one active demo
cart, two historical completed orders (for loyalty/CRM continuity), loyalty transactions,
and tier status. `ensureDemoDatabase()` (called by every handler via `boot()`) auto-resets
once if the database is ever empty, so a wiped IndexedDB self-heals on the next request.

## How the frontend should consume this

Import `{ api }` from `src/services/api` and call `api.<resource>.<method>()` —
e.g. `api.catalog.getMenu()`, `api.cart.quoteCart()`, `api.owner.acceptOwnerOrder(orderId)`,
`api.kds.updatePrepTime(orderId, 28, reason)`. Every function is a thin, Zod-validated axios
call. See [`CODEX_FRONTEND_HANDOFF.md`](./CODEX_FRONTEND_HANDOFF.md) for the full breakdown.

## How mocks get replaced by the real backend later

Nothing in `domain/*` changes. `services/payment/DemoPhonePeProvider` becomes
`PhonePeProvider`, `services/messaging/DemoWhatsAppProvider` becomes `WhatsAppCloudChannel`,
`services/auth/DemoCustomerAuthProvider` becomes a real OTP adapter, and
`services/realtime/DemoRealtimeTransport` becomes a `WebSocketTransport` — all behind the
same interfaces. `prototype/msw/*` is deleted; `services/api/*` keeps calling the same
`/api/v1/*` routes, now served by FastAPI instead of MSW. `prototype/database` (Dexie) is
replaced by the real Postgres-backed API responses — the frontend never notices, because it
only ever spoke to `services/api`.

## Known limitations (Stage 1 prototype, by design)

- **Delivery fee and kitchen capacity are per-store config, not yet editable from any UI.**
  `StoreConfig.deliveryFeeFlat` (default ₹0) and `StoreConfig.kitchenCapacityCount`
  (default 8) feed the pricing engine and scheduler respectively — they're real config
  fields now (not magic numbers in a handler), but nothing calls
  `api.config.patchStoreConfig()` to change them yet. Delivery fee is still flat (no
  per-distance/zone model).
- **Modifier pricing isn't applied to cart totals** — `CartItem.modifiers` and
  `unitPriceSnapshot` exist in the schema, but the MSW cart handlers still price at
  `product.basePrice` only (Stage 1's cart UI doesn't yet send modifier selections).
- **Chat/support engines are deterministic keyword classifiers**, not NLU — intentional
  per the "backend facts, not AI chat" rule, but they will feel rigid compared to a real
  support bot.
- **No WebSocket/SSE transport** — `DemoRealtimeTransport` is an in-memory event bus.
  Multiple browser tabs will not see each other's events (each has its own IndexedDB and
  event bus instance, which also matches how a prototype without a live backend should
  behave).
- **The Stage 1 UI (`surfaces/*`, `features/*`) has not been rebuilt** to use the full
  domain shapes — it still renders the flatter "legacy view" shapes
  (`LegacyProductView`, `LegacyCart`) that mirror the original Stage 1 spec, adapted from
  the domain models via `catalog.view.ts` / `customer.view.ts`. This is deliberate: Codex
  owns the frontend rebuild, and rewriting `surfaces/*` here would be scope creep into
  Codex's job.
