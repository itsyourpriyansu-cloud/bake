# Build Sequence, Agent Rules and QA

## Build sequence

### Phase 0 — Foundation
- Vite/React/TS
- Tailwind
- router
- fonts/tokens
- shared components
- MSW
- Dexie
- TanStack Query
- Zustand
- PWA scope

### Phase 1 — Customer Commerce
- app shell
- fulfillment
- Home
- Menu
- Product
- Build Pizza
- Cart
- Auth
- Checkout
- payment simulator

### Phase 2 — Order State
- order intent
- payment state
- awaiting acceptance
- order events
- tracking

### Phase 3 — Owner
- fake owner auth
- dashboard
- paid review
- accept/reject
- availability
- attention queue

### Phase 4 — KDS
- fake KDS auth
- queue
- prep
- availability
- prep override

### Phase 5 — Real-Time Simulation
- event bus
- realtime adapter
- synchronized customer/owner/KDS

### Phase 6 — Loyalty / Store Linking
- wallet
- tiers
- Wave ID
- store customer link

### Phase 7 — Chat / Support
- guided chat
- conversation history
- complaint case
- owner inbox
- WhatsApp simulation

### Phase 8 — Visual Polish
- generated imagery
- motion
- empty/error/offline states
- pitch seed data

## Agent rules

### Never
- change frozen business logic
- add extra KDS screens
- hardcode business data inside UI
- mix auth realms
- connect real PhonePe in prototype
- connect real WhatsApp in prototype
- allow unpaid order into KDS
- let chef reject/refund
- let founder manually assign tier
- use loyalty tier to prioritize kitchen
- silently alter customer cart

### Always
- use typed API service
- keep `/api/v1` contracts
- emit events for major state changes
- preserve route boundaries
- explain destructive actions
- build loading/error/empty states
- keep customer mobile-first
- owner desktop/tablet-first
- KDS touch/tablet-first

## Acceptance checklist

### Routing
- [ ] `/`
- [ ] `/app`
- [ ] `/owner`
- [ ] `/kds`
- [ ] customer cannot access owner auth realm
- [ ] KDS cannot access owner
- [ ] PWA scoped to `/app`

### Customer
- [ ] browse without login
- [ ] Delivery/Pickup
- [ ] modifiers
- [ ] cart quote
- [ ] OTP
- [ ] fake PhonePe success/fail/pending
- [ ] awaiting acceptance
- [ ] tracking
- [ ] points
- [ ] Wave ID
- [ ] support

### Owner
- [ ] service mode controls
- [ ] acceptance modes
- [ ] accept/reject
- [ ] refund simulation
- [ ] availability
- [ ] customer CRM
- [ ] attention queue
- [ ] support case

### KDS
- [ ] exactly 3 screens
- [ ] paid+accepted only
- [ ] start prep
- [ ] override time
- [ ] ready
- [ ] temporary availability
- [ ] owner hierarchy

### Loyalty
- [ ] pending before fulfillment
- [ ] available after
- [ ] tier rates
- [ ] progress
- [ ] frequency bonus
- [ ] reversal

### Demo safety
- [ ] no real secrets
- [ ] no real payment
- [ ] no real messages
- [ ] reset seed works
