# Frontend Handoff — Read This Before Building UI

You (the frontend agent) are building the Customer PWA, Founder Control Center and KDS.
The entire backend — domain rules, mock database, mock API, state machines, loyalty/
scheduling/acceptance/CRM engines, event bus, and demo scenarios — already exists. **Do not
re-implement business logic in components, hooks, or the MSW layer.** If a screen needs a
number or a decision, there is a service call that already produces it.

Bring in alongside this file: `17_MASTER_AGENT_CONTEXT.md`, `03_DESIGN_SYSTEM_AND_IMAGERY.md`,
`04_CUSTOMER_PWA_SCREEN_SPEC.md`, `12_COMPONENT_LIBRARY_AND_INTERACTIONS.md`, and
[`PROTOTYPE_ENGINE_README.md`](./PROTOTYPE_ENGINE_README.md) for the engine's own map.

## What already exists (don't rebuild it)

- **Every domain rule** — loyalty tiers/points/redemption, availability hierarchy, order
  acceptance (AUTO_ACCEPT / OWNER_REVIEW / REJECT), kitchen scheduling, chef prep overrides,
  refund state machine, CRM stage/activity/tag derivation, chat intent classification,
  support case routing, per-realm session policy. All in `src/domain/*`.
- **The mock backend** — `src/prototype/msw/handlers/*` serves `/api/v1/*` exactly like the
  future FastAPI backend will. `src/prototype/database/db.ts` is the Dexie/IndexedDB store.
  `src/prototype/seed/*` is the frozen demo data.
- **A typed, validated API client** — `src/services/api/*`, aggregated as `api` in
  `src/services/api/index.ts`. Every call is Zod-parsed against the real response shape.
- **Demo scenarios and reset** — `src/prototype/scenarios/*`, driven through
  `api.demo.loadScenario(name)` / `api.demo.resetDemo()`.
- **A working Stage 1 customer shell** — landing (`/`), `/app` home + menu (real data, add
  to cart, search, collections), bottom nav, floating cart pill, PWA boot/service worker.
  `/owner` and `/kds` are login-gated placeholder shells (demo credentials work; the screens
  past login are intentionally not built).

## What you should build

Per `02_ROUTES_INFORMATION_ARCHITECTURE.md`, the `/app/*` routes beyond home/menu
(search, product detail, build-your-pizza, cart, auth, checkout, payment, orders, rewards,
offers, refer, celebrations, family, favourites, saved-orders, wave-id, profile + subpages,
support) currently render `StagePlaceholderPage`. Replace each with a real screen backed by
the matching `api.*` call — the API surface below already covers all of them. Then build out
`/owner` (founder control center — order review/accept/reject, attention queue, availability
overrides, CRM) and the 3 KDS screens (`/kds`, `/kds/order/:orderId`, `/kds/availability`)
per `05_OWNER_CONTROL_CENTER_SPEC.md` and `06_KDS_EXACTLY_3_SCREENS.md`.

## How to query and mutate data

Import the aggregate client and call it inside TanStack Query hooks, same pattern the
existing `features/*/hooks/*.ts` already use:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'

const { data: menu } = useQuery({ queryKey: ['menu'], queryFn: api.catalog.getMenu })

const acceptOrder = useMutation({ mutationFn: (orderId: string) => api.owner.acceptOwnerOrder(orderId) })

await api.kds.updatePrepTime(orderId, 28, 'Kitchen busier than expected')
```

Full surface (`src/services/api/index.ts` → `api.<group>.<fn>`):

| Group | Functions |
|---|---|
| `catalog` | `getCategories`, `getProducts`, `getProduct`, `getMenu`, `getRecommendations`, `searchProducts` |
| `cart` | `getCart`, `addCartItem`, `updateCartItem`, `removeCartItem`, `quoteCart` |
| `checkout` | `createOrderIntent`, `getOrderIntent` |
| `payment` | `initiatePayment`, `getPaymentStatus`, `confirmPaymentDemo`, `failPaymentDemo` |
| `orders` | `getOrders`, `getOrder`, `getOrderEvents`, `completeOrder` |
| `owner` | `getOwnerOrders`, `acceptOwnerOrder`, `rejectOwnerOrder`, `getAttentionQueue`, `resolveAttentionItem`, `getOwnerCustomer` |
| `kds` | `getKitchenQueue`, `startPrep`, `updatePrepTime`, `markReady`, `reportKitchenProblem` |
| `loyalty` | `getLoyalty`, `getLoyaltyWallet`, `getByWaveId` |
| `chat` | `sendChatMessage`, `getConversationMessages`, `getConversation` |
| `support` | `getSupportCases`, `createSupportCase`, `resolveSupportCase` |
| `refund` | `getRefunds`, `processRefund` |
| `auth` | `requestCustomerOtp`, `verifyCustomerOtp`, `ownerLogin`, `kdsLogin` |
| `crm` | `listCrmCustomers`, `getCrmCustomer` |
| `config` | `getCapabilities`, `getStoreConfig`, `patchStoreConfig`, `patchDemoCapabilities` |
| `availability` | `getAvailability`, `setOwnerAvailability`, `setChefAvailability`, `clearChefAvailability` |
| `demo` | `resetDemo`, `listScenarios`, `loadScenario`, `setCustomerLoggedIn` |

**The checkout → payment → order flow, concretely:**

```ts
const intent = await api.checkout.createOrderIntent({ fulfillmentType: 'DELIVERY' })
const { redirectUrl, payment } = await api.payment.initiatePayment(intent.id)
// Stage 1 has no real PhonePe UI — go straight to confirm to simulate the webhook:
const { order } = await api.payment.confirmPaymentDemo(payment.merchantOrderId)
// order.acceptanceStatus is now AWAITING_ACCEPTANCE briefly, then ACCEPTED / REVIEW_REQUIRED / REJECTED
```

`order.paymentStatus` / `order.acceptanceStatus` / `order.fulfillmentStatus` /
`order.refundStatus` are separate fields — never collapse them into one "status" in the UI;
show them as the independent tracks they are (this mirrors `08_ORDER_PAYMENT_...md`).

## Realtime / live updates

Don't poll. Subscribe to the event bus:

```ts
import { demoController } from '../../../prototype/demo/demo-controller'

useEffect(() => demoController.subscribe((event) => {
  if (event.type === 'PREP_TIME_OVERRIDDEN' && event.orderId === myOrderId) refetchOrder()
}), [])
```

Event types: see `src/prototype/events/event-types.ts` — order lifecycle events
(`PAYMENT_CONFIRMED`, `ORDER_ACCEPTED`, `ORDER_REJECTED`, `FULFILLMENT_SCHEDULED`,
`PREP_STARTED`, `PREP_TIME_OVERRIDDEN`, `ORDER_READY`, `ORDER_COMPLETED`,
`REFUND_REQUESTED`, `REFUND_COMPLETED`, `POINTS_CREDITED`, `TIER_CHANGED`,
`AVAILABILITY_CHANGED`, ...) plus `CART_UPDATED`, `DEMO_RESET`, `DEMO_SCENARIO_LOADED`,
`KDS_ONLINE_CHANGED`, `CAPABILITIES_CHANGED`. This is what a future WebSocket would carry —
`services/realtime/DemoRealtimeTransport` already wraps the same bus if you'd rather depend
on the `RealtimeTransport` interface than the concrete demo controller.

## Demo scenario controls

Build the "click a scenario" panel the blueprint describes (extend `DemoToolbar` or build a
dedicated panel, env-gated behind `VITE_ENABLE_DEMO_TOOLS` like the existing toolbar):

```ts
const scenarios = await api.demo.listScenarios()
// ['happyDelivery','ownerReview','chefDelay','unavailableItem','returningStoreMember',
//  'complaintRefund','paymentFailure','paymentPending','kdsOffline']
const summary = await api.demo.loadScenario('ownerReview')
// summary: { id, title, description, appliedAt }
```

Each call fully resets and reseeds the database — safe to click repeatedly mid-demo.

## Image assets

`Product.imageKey` (domain) / `LegacyProductView.image` (Stage 1 view, already
`/assets/products/<imageKey>`) follow `<folder>/<slug>.webp`, matching
`13_IMAGE_ASSET_MANIFEST_FOR_NEXT_STEP.md`'s product list exactly (same 12 products, same
order). Folders under `public/assets/products/`: `pizza/`, `kulhad/`, `burger/`, `wrap/`,
`sides/`, `drinks/`, `desserts/` — currently empty (`.gitkeep` only). `ProductCard`
(`features/product/components/ProductCard.tsx`) already falls back to a branded placeholder
via `getProductAsset()` when an image 404s, so missing art never breaks the UI — drop real
assets in as they're generated, no code changes needed.

## Auth surfaces — three separate realms, on purpose

`domain/auth/session.policy.ts` has the production-shaped session model
(`CustomerSession`/`OwnerSession`/`KdsSession`, each with its own expiry policy — customer
30 days, owner 12h session + 30min idle lock, KDS 12h shift) and `/auth/*` MSW routes to
match. The **current** `OwnerPage`/`KdsPage` Stage 1 shells check credentials inline against
`sessionStorage` directly (lowercase `realm: 'owner'|'kds'`, see
`shared/types/domain.ts`'s `OwnerSession`/`KdsSession` — deliberately kept separate from
`domain/auth`'s uppercase-realm server types). When you rebuild these screens, prefer
calling `api.auth.ownerLogin(...)`/`api.auth.kdsLogin(...)` and storing the returned
server-shaped session, rather than re-checking `DEMO_CREDENTIALS` client-side — but don't
feel obligated to unify the two session shapes; they're intentionally decoupled (UI-local
sessionStorage convenience vs. the backend's session record).

## Things you must not rewrite

- Anything under `src/domain/*` — if a screen needs new business logic, it belongs there,
  not inlined in a component or hook.
- `src/prototype/msw/handlers/*` — extend with new routes if truly needed, but the existing
  ones should not change shape (the response schemas in `services/api/*.api.ts` depend on
  them exactly as-is).
- `src/prototype/seed/*` — frozen demo data (see `14_DEMO_CREDENTIALS_AND_SEED_STORIES.md`).
  If a screen needs more seed variety, add scenarios instead of mutating the base seed.

## Things you're free to change

- Everything under `src/surfaces/*` and `src/features/*` (hooks/components) — this is your
  layer. The existing `useMenu`/`useCart`/`useCapabilities`/`useLoyalty` hooks are a
  reasonable pattern to keep extending (thin TanStack Query wrappers over `api.*`).
- `src/shared/components/index.tsx` — the shared component library
  (`PrimaryButton`, `QuantityStepper`, `BottomSheet`, `RadioCard`, etc. — see
  `12_COMPONENT_LIBRARY_AND_INTERACTIONS.md`) is a starting point, not a frozen contract.

## Remaining frontend work (rough order)

1. Cart, auth (OTP), checkout, payment (simulate PhonePe via `confirmPaymentDemo`), order
   tracking (`/app/orders`, `/app/orders/:orderId` with realtime updates).
2. Rewards (`/app/rewards`, `/app/rewards/history`), profile + subpages, favourites,
   saved-orders, Wave ID / in-store linking (`returningStoreMember` scenario is built for
   demoing this).
3. Support/chat (`/app/support`) wired to `api.chat.sendChatMessage` /
   `api.support.createSupportCase`.
4. Founder Control Center (`/owner`): order queue + accept/reject, attention queue,
   availability overrides, CRM customer view.
5. KDS's exact 3 screens (`/kds`, `/kds/order/:orderId`, `/kds/availability`): queue, prep
   start/override/ready, availability toggles.
6. Demo scenario picker UI.

## Known engine limitations that affect UI decisions

See "Known limitations" in `PROTOTYPE_ENGINE_README.md` — notably: delivery fee is always
₹0 in the current cart quote (don't build delivery-fee-dependent UI expecting a nonzero
number yet), and modifier price deltas aren't applied to cart totals yet (the modifier
picker can be built, but its price impact won't show up in the quote until the cart handler
is extended — flag this back rather than silently computing modifier pricing client-side).
