# The Pizza Wave — Final Pitch QA

Validated: 14 September 2026

## Release status

The pitch build is a deterministic, browser-local prototype. Customer, Owner, and KDS use the same typed domain services and IndexedDB dataset. The automated acceptance suite covers Delivery, Pickup, rejection/refund, payment failure, availability authority, Wave ID store linking, support, loyalty, PWA scope, and session-realm isolation.

The recommended client build uses `VITE_PITCH_MODE=true`. This hides developer controls and debug affordances while retaining seeded data and the simulated payment experience.

## Credentials

| Surface | Credential |
| --- | --- |
| Customer | Phone `9876543210`; OTP `123456` |
| Owner | Email `owner@pizzawave.demo`; password `PizzaWave@123`; code `654321` |
| KDS | PIN `2580`; trusted device `Kitchen Tablet #1` |

All credentials are fixed prototype data and provide no production security.

## Routes

### Public

- `/` — marketing landing page
- `/team` — not-available-yet page

### Customer PWA

- `/app/` — personalized home
- `/app/menu`, `/app/search`
- `/app/product/:productId`, `/app/build/:productId`
- `/app/cart`, `/app/auth`, `/app/checkout`, `/app/payment/:paymentId`
- `/app/orders`, `/app/orders/:orderId`
- `/app/rewards`, `/app/rewards/history`, `/app/wave-id`
- `/app/saved-orders`, `/app/favourites`
- `/app/profile`, `/app/profile/preferences`, `/app/profile/addresses`
- `/app/family`, `/app/celebrations`, `/app/notifications`
- `/app/support`, `/app/refer`, `/app/offers`

### Owner and KDS

- `/owner` — isolated Owner control center
- `/kds` — Kitchen Queue
- `/kds/order/:orderId` — Order Preparation
- `/kds/availability` — Availability

The KDS intentionally has exactly three screens.

## Primary pitch flow

1. Open `/app/`, choose Delivery, and browse Menu.
2. Open a pizza, customize it, add it to the cart, and review the server-shaped quote.
3. Continue to checkout. If starting as a guest, verify `9876543210` with OTP `123456`.
4. Enter Delivery details, continue to payment, and press **PAY SECURELY** in pitch mode. The view is visibly identified as a secure demo and never contacts PhonePe.
5. Show the customer in **Payment received — Awaiting Acceptance**.
6. Open `/owner`, authenticate, find the paid order, and accept it.
7. Open `/kds`, authenticate with PIN `2580`, start preparation, add ten minutes, and mark the order ready.
8. Return to the customer tracking route to show the revised ETA and Ready status.
9. Complete fulfillment from the controlled development scenario when demonstrating the post-delivery loop; pending points become available and CRM/notification state updates automatically.

Use the same browser profile. For the most reliable pitch, demonstrate the three surfaces sequentially in one tab. Browser storage is shared across tabs, but the prototype realtime event bus is process-local; an independently opened tab can require navigation or a refetch to display the newest state.

## Additional validated scenarios

### Pickup

Pickup creates a system-generated slot, uses the same payment and Owner acceptance boundary, enters KDS, completes as `PICKED_UP`, and releases loyalty points.

### Rejection and refund

A paid order rejected in Owner enters refund processing and then refund success. The customer is notified and no KDS ticket is created.

### Payment failure

Failure leaves the cart intact, creates no operational order, and creates no KDS ticket. Use the visible failure control in development-demo mode.

### Availability authority

A chef temporary disable is reflected in the customer catalog and cart revalidation, and Owner sees the timed override. An Owner disable is authoritative: KDS shows it locked and the chef cannot re-enable it.

### Store linking

Customer Wave ID resolves to Priyanshu, Gold Wave, and 182 starting points. A store order paid with the simulated PhonePe provider updates the same loyalty wallet after `STORE_COMPLETED`.

### Support

A Missing Item case appears in Founder attention. An item refund updates the unified customer conversation and emits the same conversation update used by simulated WhatsApp/in-app history.

### Authentication isolation

Customer, Owner, and KDS session keys and guards are separate. A customer session grants no Owner or KDS access; a chef session grants no Owner access.

## PWA checks

- Customer manifest: `/app.webmanifest`
- Manifest `start_url` and `scope`: `/app/`
- Composite customer service worker: `/sw.js`, registered with `/app/` scope
- `/api/v1` is excluded from PWA caching
- `/`, `/owner`, `/kds`, and `/team` do not mount the customer manifest and cannot be controlled by the `/app/` worker
- Offline support is an application-shell demonstration, not offline ordering or payment synchronization

Installability should be demonstrated from the production preview on localhost. Clear older service-worker registrations when switching between earlier local builds.

## Reset instructions

- Development demo: run `npm run dev:demo`, then use **Reset Demo** in the developer toolbar.
- Pitch mode: while a customer/Owner/KDS data surface is loaded, press `Ctrl+Alt+Shift+R`. The reset is intentionally invisible; wait for the page to reload.
- A reset restores the seeded customer, 182 points, orders, catalog availability, cart, sessions, payments, Owner/KDS operational state, support, conversations, and demo clock.

## Exact run commands

From `C:\Users\priyansu\Downloads\pizza_wave_v1`:

```powershell
npm install
npm run demo
```

Open `http://localhost:5173/` (or the exact URL printed by Vite).

For the production-equivalent pitch bundle:

```powershell
npm run build:pitch
npm run preview:pitch
```

Open `http://localhost:4174/`.

For internal scenario controls:

```powershell
npm run dev:demo
```

## Known limitations

- MSW, IndexedDB, simulated realtime, fixed OTP, PhonePe, WhatsApp, push, jobs, distance, and courier movement are prototype-only.
- Data is local to the browser profile and is not shared across devices.
- Realtime fan-out is deterministic in the active application process; truly independent tabs/devices require the production WebSocket service.
- Offline mode caches the customer shell only. Catalog writes, checkout, payment, and fulfillment are not production-grade offline workflows.
- Payment failure, pending/reconciliation, refund failure, kitchen load, KDS offline, time advance, and fulfillment completion remain developer scenarios and are hidden in pitch mode.
- Owner Wave ID scanning is a convincing internal simulation; camera/device integration is not included.
- No real credentials, payment calls, WhatsApp calls, push sends, or production secrets exist.

## Production replacement summary

The UI contracts and domain state machine are designed to remain. Replace transport and persistence in this order: FastAPI/PostgreSQL and migrations; server-enforced authentication and authorization; idempotent order/payment services; PhonePe webhook verification; Redis-backed jobs and realtime fan-out; WhatsApp Business and push providers; production monitoring, security, backups, and reconciliation. The detailed plan is in `PRODUCTION_BACKEND_HANDOFF.md`.

