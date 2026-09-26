# Bakery Wave UI/UX implementation plan

## 1. Product direction

Bakery Wave should feel like one operating system expressed through two purpose-built surfaces:

- **Bake KDS** is a fast, high-contrast production instrument. It answers: _What must I make next, what must not be missed, and what action do I take now?_
- **Founder Control** is a calm exception-and-capacity cockpit. It answers: _What needs my judgment, is the bakery on promise, and what decision protects the customer and the business?_

The customer app, KDS, and Founder Control must share one order truth. Status, availability, production risk, and customer promise cannot be reinterpreted differently by each surface.

### North-star principles

1. **Promise first.** Every operational view is organized around the customer promise, not database creation time.
2. **Exceptions before analytics.** Founder attention and at-risk work appear before revenue or growth numbers.
3. **One obvious next action.** Every ticket and decision panel has one visually dominant primary action.
4. **Critical details survive scanning.** Eggless, allergens, weight, message, photo/fondant, event time, and handoff type never depend on opening a hidden panel.
5. **State is explicit.** Loading, empty, stale, offline, saving, succeeded, failed, and permission-blocked states are designed—not implied.
6. **Touch first for production; responsive desktop first for founder.** KDS targets a landscape kitchen tablet. Founder Control targets desktop, with a focused mobile command view.
7. **Bakery logic, not restaurant decoration.** Reuse the pizza app's proven operational patterns, then adapt them to multi-stage cake production, cooling time, decoration, reference assets, and scheduled promises.

## 2. Current-state audit

### What is already strong

- Separate customer, production, and founder routes already exist.
- Bakery-specific stages exist: scheduled, mixing, baking, cooling, decorating, packing, ready, completed.
- Founder Control already exposes attention, calendar, bespoke requests, customers, growth, and configuration.
- KDS already supports PIN access, ticket progression, problem reporting, and temporary product availability.
- Cross-surface query invalidation and periodic refresh provide a working prototype of shared state.
- Responsive rules, focus-visible styles, dialogs, loading, error, and empty states have a useful base.

### Core gaps to correct

| Area | Current behavior | Required behavior |
| --- | --- | --- |
| KDS queue | Three vertically stacked lanes based largely on status | Four scanable urgency lanes driven by recommended start time and promise risk |
| Start logic | Every scheduled order appears under “Start now” | Separate `Start now`, `Start soon`, `In production`, and `Ready`; sort deterministically within each lane |
| Ticket hierarchy | Order number, due time, and items are present, but urgency and critical constraints are weak | Promise risk, countdown, stage, constraints, item count, handoff, and primary action are readable in a three-second scan |
| Production detail | Stage progression works, but the experience is mostly a status changer | Make-line checklist, stage timer, reference asset, critical instructions, event history, exception impact, and guarded completion |
| Availability | Product-level pause/enable only | Product and ingredient/component impact, expiry, reason, owner lock, affected orders, and customer-channel propagation |
| Founder Today | Useful metrics and order list, but attention is a count rather than a work queue | Ranked decision inbox with reason, deadline, impact, owner, and resolution action |
| Order acceptance | Accept/reject lacks visible capacity evidence and consequence copy | Capacity-aware recommendation, promise confidence, rejection/refund consequence, note, and confirmation feedback |
| Calendar | Seven-day counts only | Capacity heatmap plus promised workload, stage load, conflicts, and drill-down |
| Bespoke | Review and quote states exist, but context and history are thin | Structured brief, reference assets, feasibility, internal note, quote expiry, status history, and customer communication state |
| Customers/growth | Summary cards and campaign previews | Searchable customer detail and actionable, consent-aware segments with explicit preview/schedule states |
| Feedback | Mutations mostly rely on the UI eventually refreshing | Immediate pending state, success confirmation, rollback/error recovery, audit entry, and cross-surface reconciliation |
| Architecture | Founder and production screens are large single files; Bakery CSS is highly coupled | Feature-level components, domain projections, shared operational primitives, and scoped style modules/layers |

## 3. Information architecture

### Bake KDS

Primary navigation:

1. **Queue** — live production command board.
2. **Availability** — product and ingredient/component controls.
3. **Shift** — device health, sync status, signed-in baker, shift summary, and end-shift action. On wide screens this can be a status drawer rather than a permanent tab.

Queue structure:

- **Start now** — work whose recommended start time has arrived or whose promise is at risk.
- **Start soon** — the next staged work window; ingredients can be prepared, but production should not start yet.
- **In production** — active work, displaying the current bakery stage and elapsed/remaining stage time.
- **Ready** — packed work waiting for pickup, dispatch, or completed handoff.

Do not create separate top-level screens for mixing, baking, cooling, decorating, and packing. Those are stage filters and ticket states inside the command board; forcing bakers to navigate between them would hide the complete promise picture.

### Founder Control

Primary navigation:

1. **Today** — ranked decisions, at-risk promises, capacity, and live production.
2. **Orders** — searchable operational order ledger and detail/history.
3. **Calendar** — capacity planning across days and time slots.
4. **Bespoke** — custom request pipeline and quoting.
5. **Customers** — customer 360, celebrations, preferences, and service history.
6. **Growth** — actionable retention segments and campaign history.
7. **Settings** — fulfillment, auto-acceptance, capacity, roles, and device policy.

On mobile, show **Today, Orders, Calendar, Bespoke**, plus a **More** entry. Do not squeeze all seven destinations into a persistent top strip.

## 4. Screen specifications

### 4.1 KDS sign-in and shift start

- Keep the numeric pad and trusted-device language.
- Show store, station/device, current date/time, network status, and last successful sync.
- Make PIN entry masked and auto-submit after four digits; keep an explicit submit action for keyboard/accessibility fallback.
- After three failed attempts, show a cooldown state and founder recovery path.
- Start a named shift session with baker/device identity and an auditable timestamp.
- End shift requires a summary sheet if active tickets remain.

### 4.2 KDS queue

Desktop/tablet layout:

- Sticky 72–80 px header with brand, Queue/Availability, sync heartbeat, current time, and shift control.
- Four equal-width lanes at 1280 px and above; two lanes at medium landscape widths; one lane with a sticky lane switcher on portrait/mobile.
- Lane header includes count, plain-language rule, and oldest/most urgent risk.
- Avoid unused whitespace: lanes fill the available height and scroll internally when the viewport allows it.

Ticket anatomy, in order:

1. Risk rail: late/critical, due soon, on track, ready.
2. Public order number plus pickup/delivery.
3. Promise time and live countdown.
4. Product lines with quantity.
5. Always-visible critical tags: eggless/allergen, size/weight, shape, photo/fondant, written message.
6. Current stage and stage timer for active work.
7. System recommendation in one sentence.
8. Primary action: start, open/resume, or hand off.

Interaction rules:

- Minimum 48 px targets; primary production actions should be 56 px or larger.
- Do not use color alone. Every urgency color is paired with an icon and label.
- A mutation locks only the affected ticket, not the full board.
- Successful actions produce an immediate state transition and a short undo window only where reversal is safe.
- If server reconciliation fails, restore the prior state and show an anchored retry message on that ticket.
- Keep the board usable offline for already-synced tickets; clearly mark queued actions and last sync time.

### 4.3 KDS production ticket

Header:

- Back to queue, order number, fulfillment, promise countdown, current risk, and stage.

Main pane:

- Make-line checklist by item and quantity.
- Critical details appear before ordinary modifiers.
- Customer message is rendered as exact production copy, never mixed into a paragraph.
- Reference image/photo is zoomable and has a text fallback.
- Stage steps show completed, current, and upcoming states with timestamps.

Action rail:

- One primary stage action: `Start mixing`, `Move to oven`, `Start cooling`, `Start decorating`, `Pack`, `Mark ready`, or `Complete handoff`.
- Secondary actions: report problem, add internal note, adjust stage estimate (role-gated).
- Require a confirmation only for irreversible or customer-visible transitions such as ready/handover; ordinary stage moves should remain fast.
- Prevent impossible transitions in the domain layer, not only through disabled buttons.

Problem flow:

1. Select type: ingredient unavailable, capacity delay, equipment issue, damaged/rework, customer clarification, other.
2. Select affected item/order.
3. Set severity and estimated delay.
4. Add concise detail or photo if supported.
5. Preview impact: founder attention, recommended new promise, and affected availability.
6. Submit and show the created attention item ID/status.

### 4.4 KDS availability

- Default to `Products`; add `Ingredients/components` when the data model supports it.
- Search, category filters, live/off/expiring filters, and affected-order count.
- Show source of truth: baker pause, founder lock, automatic stock rule, or scheduled expiry.
- A baker can create a temporary pause with reason and expiry.
- A founder lock cannot be overridden by a baker; explain who changed it and what to do next.
- Before pausing, show affected products and accepted orders. Never imply that hiding a product resolves an already-accepted order.
- After changing availability, confirm propagation to the customer catalog and record the change in history.

### 4.5 Founder Today

Top region:

- Greeting and operating date are secondary.
- Primary content is **Decision inbox**, not KPI cards.
- Global store health includes KDS online/stale, ordering mode, next promise, capacity risk, and unresolved critical exceptions.

Decision card contract:

- Why it needs the founder.
- Decision deadline.
- Customer/promise impact.
- System recommendation with evidence.
- Primary and secondary actions.
- Owner/assignee and audit history.

Rank in this order:

1. Promise already at risk.
2. Paid order awaiting acceptance.
3. KDS-reported production exception.
4. Capacity or availability conflict.
5. Bespoke request nearing response SLA.
6. Non-urgent growth opportunity.

Metrics such as revenue, paid orders, and production health remain visible below the decision inbox. Use trends or comparisons; avoid large numbers without context.

### 4.6 Founder order acceptance and exception resolution

Acceptance drawer shows:

- Product complexity and critical details.
- Required stages and estimated active/cooling time.
- Promise time, recommended start, and capacity overlap.
- Current availability conflicts.
- Recommended decision: safe to accept, accept with adjusted promise, or reject.

Actions:

- `Accept promise` is primary when safe.
- `Propose new time` opens a slot selector and customer-message preview.
- `Reject and start refund` clearly states payment consequences and requires a reason.
- Every result creates an audit entry and sends the order to the correct KDS/customer state.

### 4.7 Founder Orders

- Add a dedicated Orders destination; the live list on Today is not a substitute.
- Search by order number, customer, phone suffix, and product.
- Filter by promise date, fulfillment, payment, production stage, and risk.
- Order detail combines timeline, payment, production, customer context, notes, and exceptions.
- Actions are permission- and state-aware. Invalid transitions are never offered.

### 4.8 Founder Calendar and capacity

- Replace count-only day cards with a day/week heatmap.
- Show capacity used versus capacity available per time band.
- Include active production stages, scheduled starts, promise windows, and bespoke holds.
- Selecting a day reveals orders in promise order and the source of any conflict.
- Capacity changes preview which future orders or auto-acceptance rules will be affected.

### 4.9 Bespoke, customers, growth, and settings

**Bespoke**

- Kanban/list toggle for New, Reviewing, Awaiting customer, Quoted, Won, Lost.
- Structured brief, attachments/reference imagery, servings, event, budget, due date, feasibility, owner, and response SLA.
- Separate internal notes from customer-visible quote copy.
- Quote includes line items, deposit, validity, revisions, and delivery/pickup assumptions.

**Customers**

- Searchable list and customer detail drawer.
- Show lifetime value only beside order count, last order, upcoming celebration, saved designs, preferences, and service issues.
- Mask phone/contact data until needed and role-authorized.

**Growth**

- Keep the current “useful, not noisy” principle.
- A segment card includes audience definition, exclusions, consent/channel eligibility, expected action, and preview.
- Distinguish draft, scheduled, sending, completed, and failed campaigns.

**Settings**

- Use labeled switches for binary settings; do not use generic buttons that only read `ON` or `OFF`.
- Explain `ON`, `OFF`, and `HYBRID` auto-acceptance before the founder changes it.
- High-impact changes use a review sheet showing affected customer and production behavior.
- Capacity has bounds, unit definition, effective date, and conflict preview.

## 5. Shared design system

### Visual hierarchy

- Preserve the Bakery Wave chocolate, cream, yellow, coral, green, blue, and lavender palette.
- Reserve yellow for active/primary controls, coral/red for risk, green for ready/success, blue for informational/system state, and lavender for scheduled/planned work.
- Use the display face for page and lane titles only. Operational body copy, times, IDs, and controls use the highly legible body face.
- Use tabular numerals for timers, money, order numbers, and capacity.
- Reduce all-caps usage in paragraphs and dense ticket content; retain it for short labels.

### Token and component layer

Create operational tokens for:

- urgency colors and contrast-safe foregrounds;
- spacing and density modes;
- 48/56/64 px touch targets;
- sticky header/action rail offsets;
- focus rings, disabled, pending, stale, and offline states;
- ticket, lane, decision card, status chip, risk badge, timer, and sync badge variants.

Shared primitives:

- `OperationalShell`
- `SyncStatus`
- `StatusChip`
- `RiskBadge`
- `PromiseTimer`
- `CriticalTags`
- `ActionFeedback`
- `ConfirmSheet`
- `EmptyState`, `ErrorState`, `OfflineState`, `StaleState`
- `AuditTimeline`

## 6. Domain and state contract required by the UX

The interface cannot become precise if it only receives a broad production status. Add or derive:

- `recommendedStartAt`
- `targetReadyAt` and explicit promise timezone
- `riskLevel` and `riskReason`
- `currentStageStartedAt`
- stage estimates/history for mixing, baking, cooling, decorating, and packing
- `remainingMinutes` derived from a shared clock
- structured critical instructions and allergen flags
- exception type, severity, delay estimate, owner, status, and resolution
- availability source, expiry, affected products, and affected accepted orders
- order event/audit history
- mutation version/idempotency key for conflict-safe actions
- device last-seen and sync state

Create pure projection functions for KDS lanes and founder attention ranking. UI components consume these projections; they must not independently calculate operational truth.

## 7. Implementation architecture

### Refactor targets

Split the current monoliths:

- `BakeryProductionPages.tsx` into shell, login, queue, ticket, availability, shift status, and focused dialog components.
- `BakeryOwnerPage.tsx` into shell/navigation plus Today, Orders, Calendar, Bespoke, Customers, Growth, and Settings feature folders.
- Break the coupled Bakery stylesheet into token/base, shared components, KDS, founder, and responsive layers.

Suggested feature structure:

```text
src/surfaces/bakery/
  operations/
    components/
    feedback/
  production/
    shell/
    queue/
    order/
    availability/
    shift/
  founder/
    shell/
    today/
    orders/
    calendar/
    bespoke/
    customers/
    growth/
    settings/
src/domain/bakery/
  production.machine.ts
  production.projection.ts
  attention.engine.ts
  capacity.engine.ts
  availability.engine.ts
  audit.types.ts
```

### Data behavior

- Prefer event-driven cache updates for order and availability changes; keep polling as a fallback.
- Use optimistic updates only for reversible, deterministic actions.
- Use server-confirmed transitions for acceptance, rejection/refund, ready, and handoff.
- Preserve user context after refresh, error, or reconnect.
- Every action has a stable pending, success, failure, and retry presentation.

## 8. Phased delivery plan

### Phase 0 — Operational contract

Deliver:

- production transition matrix;
- urgency and lane projection rules;
- founder attention ranking rules;
- capacity calculation definition;
- exception and availability schemas;
- audit event schema;
- route/permission matrix.

Gate: fixture-based tests prove that the same order maps to one KDS lane, one risk state, and the correct founder attention priority.

### Phase 1 — Design system and shells

Deliver:

- operational tokens and shared primitives;
- responsive Founder and KDS shells;
- sync/offline/stale feedback;
- accessible dialogs, sheets, navigation, and action feedback;
- Storybook-equivalent component fixtures or a local pattern page.

Gate: components pass keyboard, focus, contrast, 200% zoom, and reduced-motion checks at target breakpoints.

### Phase 2 — KDS core

Deliver:

- shift sign-in;
- four-lane projected queue;
- scan-optimized tickets;
- stage-aware production detail and guarded transitions;
- structured problem reporting;
- product availability with expiry and source ownership.

Gate: a baker can complete happy-path and delayed orders without leaving the KDS, losing critical instructions, or creating an invalid status.

### Phase 3 — Founder core

Deliver:

- ranked decision inbox;
- capacity-aware acceptance/rejection;
- dedicated orders ledger and detail;
- live production health;
- capacity calendar;
- KDS exception resolution.

Gate: every founder attention item can be understood and resolved from one decision drawer, with a visible consequence and audit entry.

### Phase 4 — Bespoke and customer intelligence

Deliver:

- bespoke pipeline and structured quotes;
- customer detail and service history;
- consent-aware growth segments and campaign lifecycle;
- settings guardrails and impact previews.

Gate: custom work and retention actions no longer rely on modal-only summaries or untracked state changes.

### Phase 5 — Hardening and polish

Deliver:

- offline/reconnect and stale-data recovery;
- concurrency conflict handling;
- real-time performance tuning;
- device/browser matrix;
- analytics instrumentation;
- visual regression coverage;
- usability fixes from bakery-floor observation.

Gate: release checklist below passes with production-scale fixtures.

## 9. Prioritized backlog

### P0 — required for a trustworthy operational core

- Shared promise-time, risk, lane, and attention projections.
- Four-lane KDS and deterministic order sorting.
- Critical-detail normalization and visibility.
- Validated production state machine.
- Founder decision inbox and capacity-aware acceptance.
- Structured exception workflow linking KDS and founder.
- Action pending/success/failure/retry feedback.
- Offline/stale/sync visibility.
- Dedicated founder Orders view.
- Audit history for all operational mutations.

### P1 — required for daily efficiency

- Capacity calendar and time-band drill-down.
- Ingredient/component availability and impact preview.
- Stage estimates and timers.
- Bespoke pipeline and quote structure.
- Customer search/detail.
- Mobile founder command mode.
- Keyboard shortcuts for safe KDS navigation.

### P2 — optimization after the core is reliable

- Campaign scheduling and performance.
- Advanced workload forecasting.
- Multi-station KDS views.
- Reference-image annotation.
- Role administration and additional device management.
- Operational analytics and comparative trends.

## 10. Verification matrix

### Functional journeys

1. Paid order → founder review → accepted → scheduled → start now → all bakery stages → ready → handoff → customer completion.
2. Paid order exceeds capacity → recommended new time → founder proposes adjustment → customer state updates.
3. Ingredient becomes unavailable → impacted products and accepted orders identified → customer catalog updates → founder attention created where required.
4. Baker reports equipment delay → risk recalculates → founder resolves promise/customer action → KDS reflects resolution.
5. KDS loses network → cached board remains readable → actions queue safely → reconnect reconciles without duplicate transitions.
6. Two devices act on one ticket → version conflict is detected → latest truth and recovery action are shown.
7. Bespoke request → review → quote → status history and customer-visible outcome.

### Viewports

- KDS: 1280×800 primary, 1024×768 supported, portrait fallback.
- Founder: 1440×900 and 1280×800 primary; 768 px tablet; 390/430 px mobile command mode.
- Test browser zoom at 100%, 125%, and 200%.

### Accessibility

- WCAG 2.2 AA contrast.
- Complete keyboard path for founder and fallback keyboard path for KDS.
- Visible focus not obscured by sticky headers/action rails.
- Live regions for mutation results, connectivity changes, and newly urgent tickets without excessive announcement.
- Dialog focus trap, Escape behavior, and return focus.
- Icons always have text or accessible names where they communicate state/action.

### Performance targets

- First useful operational content under 2 seconds on the target local network/device.
- Ticket action feedback begins within 100 ms.
- Queue updates do not re-render or lock unrelated tickets.
- Smooth lane scrolling with at least 50 active tickets in fixtures.
- No layout shift when counts, timers, tags, or error feedback change.

## 11. Release acceptance criteria

The Bakery Wave operational UI is ready when:

- a baker identifies the next correct ticket and its critical constraints in three seconds or less;
- no scheduled order appears in `Start now` solely because it has a scheduled status;
- every stage transition is valid, timestamped, and visible across KDS and founder views;
- a founder's first screen contains a ranked, resolvable decision queue rather than only a count;
- acceptance and rejection show capacity and payment/customer consequences before commitment;
- availability changes identify their source, expiry, propagation, and accepted-order impact;
- offline, stale, failed, empty, and reconnect states are test-covered;
- all major tasks work at the target viewports and 200% zoom;
- the full lint, typecheck, unit, integration, accessibility, and visual regression suites pass.

## 12. Immediate implementation order

Start with these five work packets:

1. Build `production.machine`, `production.projection`, `attention.engine`, and fixtures/tests.
2. Extract shared operational tokens and feedback/status primitives from the current Bakery UI.
3. Rebuild the KDS queue and ticket detail on the new projections.
4. Rebuild Founder Today as a decision inbox and add the Orders destination.
5. Connect structured exceptions, availability impact, audit history, and cross-surface reconciliation.

Do not begin growth polish, advanced customer cards, or decorative animation until those five packets pass their gates.
