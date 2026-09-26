# Promotional Ideas — The Pizza Wave, Puri

A working strategy reference: who's actually ordering, the psychology behind why they choose
you, how to price against Swiggy/Zomato, concrete traction and automation ideas, and a
growth mechanic (Google Review → Wave Points) designed to be built directly on the existing
domain engine. This is a planning document, not frozen product spec — treat every number in
here as a directional assumption to pressure-test against real data, not a finished
market-research report.

---

## 1. Market context

Grand Road sits on the pilgrim route to the Jagannath Temple, so foot traffic is
structurally lumpy, not steady. The same block sees a devotee on a tight darshan schedule, a
local family on a Saturday, a hostel student between classes, and a tourist who's never
heard of the brand — often within the same hour. Puri is one of Hinduism's four Char Dham
sites, so vegetarian purity isn't a menu filter here — it's a trust prerequisite for a
meaningful share of walk-ins. And because events like Rath Yatra pull large, well-publicized
crowds through this exact corridor, demand isn't just seasonal — it's calendar-predictable,
which is a planning advantage almost no competitor is using operationally (see §4, Phase 3).

## 2. Six customer segments

Not a demographic slice — a decision profile. Each one is won by a different lever, not a
different discount.

| Segment | Who they are | Primary lever |
|---|---|---|
| **The Yatri Family** | Multi-generational, here for darshan, staying 1–2 nights near the temple. Tired, time-boxed, decided by the eldest. | Certainty over novelty — visible purity signal, familiar names, fast honest ETA. |
| **The Local Odia Family** | Puri residents. Comes for a weekend treat or a birthday, not a daily habit. Cross-shops the whole street. | Loss-averse value framing — bundles that visibly beat buying items separately. |
| **The Beach-Evening Crowd** | 16–25, students and young locals, post-beach or between classes. Orders in groups, splits the bill. | Novelty, scarcity and shareability — the cheese-pull is the marketing. |
| **The Beach-Road Tourist** | Domestic traveller doing temple-plus-beach, staying in a hotel along the coast. Doesn't know local brands. | Social proof and a signature story item, not a discount. |
| **The Habitual Regular** | Hostel, PG or working local ordering solo or for roommates. High frequency, low ticket. | Habit-loop convenience and visible progress toward the next tier. |
| **The Event Organiser** | Birthday, office lunch, temple-committee gathering. One large order, often by phone. | A promise they can repeat to their boss or family — and that holds. |

## 3. Eight psychological levers, with case studies

Each one is a studied effect, a real brand case, and the exact place it already lives (or
should live) in this build.

1. **Anchoring & price bracketing** — a high-priced item next to a mid-priced one makes the
   mid-price look like the smart choice, not the cheap one. *Case study:* the Cornell/Cheesecake
   Factory menu-engineering research, and Domino's India's Personal→Medium→Large ladder.
   *Applied here:* the **For Two** / **Family** smart collections — put the largest combo
   first so the two-person bundle reads as the deliberate choice.

2. **Endowed progress** — people finish things faster once they feel they've already started.
   *Case study:* Nunes & Drèze's car-wash stamp-card study — a card pre-stamped twice on a
   10-stamp goal finished faster than a blank 8-stamp card for the same distance.
   *Applied here:* the "2 orders + ₹880 to Platinum" progress bar on Home already does this —
   keep it visible everywhere an order is possible, and consider seeding new signups with a
   small starter balance instead of zero.

3. **Scarcity & exclusivity** — anything framed as limited is valued higher than the
   identical thing framed as always-available. *Case study:* Starbucks' Pumpkin Spice Latte,
   McDonald's periodic McRib returns. *Applied here:* the **Wave Exclusive** badge on
   Signature Kulhad Pizza — rotate a real seasonal item (a Rath Yatra special) instead of
   leaving "exclusive" permanently on one dish, which quietly stops meaning anything.

4. **Trust signalling in a temple town** — an ambiguous veg/non-veg answer isn't neutral
   here, it's a reason to walk to a competitor who made it obvious. *Case study:* Domino's
   India and McDonald's India built explicit 100%-vegetarian sub-menus with visibly separated
   prep specifically to win trust in religious markets; Haldiram's built pan-India trust the
   same way. *Applied here:* the veg/non-veg marker exists on every product card — for the
   Yatri Family, surface it a level higher (a "prepared in a dedicated vegetarian kitchen"
   line at the storefront and on packaging).

5. **Shareability as marketing** — a dish that photographs or films well doesn't need an ad
   budget. *Case study:* the 2022 "Kulhad Pizza" video that went nationally viral in India
   turned an obscure regional format into a recognised category on the strength of the
   cheese-pull moment alone. *Applied here:* Signature Kulhad Pizza should anchor every Reel,
   every in-store photo spot, and every influencer sample — it's the one item that sells
   itself on sight.

6. **Variable reward** — a reward on an unpredictable schedule is more habit-forming than the
   same reward on a fixed schedule. *Case study:* Starbucks Rewards' random bonus-star drops;
   Skinner's variable-ratio reinforcement research (the slot-machine effect). *Applied here:*
   the frequency bonus (+25 points at 3 orders/30 days, +50 at 5) is already a real, earned
   mechanic — write the notification like a surprise, not a receipt line.

7. **Choice reduction** — more options can lower conversion, not raise it. *Case study:*
   Iyengar & Lepper's jam study — a 6-flavour table converted roughly 10x better than a
   24-flavour table of the same jam; Domino's India's fixed-price Pizza Mania menu applies
   the same logic commercially. *Applied here:* **Under ₹199** and **Quick Bites** already do
   this curation, and **Your Usual** on Home is the purest form — zero choices, one tap.

8. **The reliability premium** — for a time-pressured customer, a specific, honest promise
   beats a cheaper price. *Case study:* Domino's built its early identity on "30 minutes or
   it's free" — later retired for safety reasons, but the underlying lesson (a kept, specific
   promise builds trust) held. *Applied here:* the acceptance/scheduling engine already
   computes a real, load-aware promise window rather than a flat "30–45 min" — surface it
   pre-checkout, since it matters most to the Yatri Family and the Event Organiser.

## 4. Online vs offline playbook

**Online**
- Lapse-triggered nudges — the CRM engine already tags a customer `AT_RISK`/`DORMANT`; that's
  the moment for a win-back push, not a random weekly blast.
- Reels built around the cheese-pull, geo-tagged to Grand Road, Puri.
- WhatsApp reordering for customers who won't install an app.
- A review-collection prompt right after a completed order — tourists decide almost entirely
  on visible ratings.
- The referral mechanic ("Give ₹50, Get 60 points") — the youth segment's own network doing
  the acquisition work.

**Offline**
- Storefront and scent presence on the temple route — fresh dough/melting cheese is a proven
  impulse trigger for foot traffic that wasn't planning to stop.
- Wave ID linking in-store for pilgrims without the app — already a demo scenario, make it a
  10-second counter script.
- A staff upsell script anchored to the same For Two / Family bracketing used online.
- Festival-calendar staffing — Rath Yatra's demand spike is known months ahead; pre-raise
  kitchen capacity in config rather than absorbing it as unplanned Owner Review load.
- Table-tent QR codes routing dine-in/pickup into the same loyalty account the app uses.

### Rollout, in order

1. **Launch (first 30 days)** — earn trust before asking for loyalty: make the vegetarian-
   purity signal impossible to miss, ship the honest load-aware ETA, seed new signups with a
   small starter point balance.
2. **First 90 days** — turn first orders into habits: wire `AT_RISK`/`DORMANT` to real
   win-back nudges, launch the referral mechanic, start the review-collection prompt.
3. **Ongoing/seasonal** — plan around the calendar Puri already gives you: pre-raise kitchen
   capacity ahead of known pilgrim peaks, rotate Wave Exclusive on a real cadence, re-run the
   segment mix each season (tourist share moves with the pilgrim calendar, youth share
   doesn't).

## 5. Traction ideas by funnel stage (AARRR)

**Acquisition**
- WhatsApp catalog/broadcast for pilgrims who'll never install an app.
- QR codes at hotels/dharamshalas along the beach road and temple route.
- Partnerships with local guides/travel operators who book pilgrim groups.
- Google Business Profile + local SEO around "food near Jagannath Temple."
- Campus/student-day promos for the Beach-Evening Crowd.

**Activation**
- Guest checkout — no forced signup before a first order.
- A 3-tap taste profile at signup (veg/non-veg, spice level) so personalization starts at
  order #1 instead of waiting on order history.
- Honest, load-aware ETA shown before payment, not after.

**Retention**
- Automated win-back messages the moment CRM flips a customer `AT_RISK`/`DORMANT`.
- A visible streak mechanic layered on the existing frequency-bonus math.
- A rotating "this week only" item.
- Fast, visible complaint resolution via the existing support-case engine.

**Referral**
- Ship the speced "Give ₹50, Get 60 points" flow — currently a UI link with no engine behind
  it yet.
- Auto-generate a shareable "I just built my own pizza" card after Build-Your-Pizza checkout.
- A split-bill/group-order mode for the Beach-Evening Crowd — a referral mechanic by
  necessity, since it pulls friends into the app to pay their share.

**Revenue**
- Pre-order/scheduled ordering for pilgrim groups planning a darshan time —
  `scheduledOrdersEnabled` already exists as a store capability but isn't surfaced in any
  screen yet. Probably the single highest-leverage unbuilt feature.
- Off-peak "surprise" free-delivery windows — smooths kitchen load into the scheduler's
  low-load bands, which is also an operational win, not just a promo.
- Cart-level upsell nudges using modifier groups that already exist in the catalog schema but
  aren't priced into cart totals yet.

## 6. Management automation ideas

The existing architecture already computes most of the signal needed — this is mostly about
wiring triggers to data that's already there:

- **Attention Queue as the owner's home screen**, not the order list — the engine already
  collapses every exception (review-needed orders, severe delays, refund failures,
  complaints, KDS offline) into one prioritized queue.
- **CRM-triggered messaging** — `customerStage`/`activityState` recompute on every completed
  order; auto-fire a WhatsApp/SMS the moment someone becomes `AT_RISK`, auto-flag `VIP`
  customers for priority support handling.
- **Pattern-detecting availability** — flag the owner when the same item gets marked
  unavailable 3+ times in a week (a supply/procurement signal), not just log each one-off
  chef toggle.
- **Load-pattern staffing signals** — if kitchen load consistently crosses the 76–90% band at
  the same time every week, surface that as its own recurring alert instead of rediscovering
  it order by order.
- **Tiered refund auto-approval** — low-risk categories under a rupee threshold could
  auto-resolve; food-quality and high-value complaints still escalate to the founder.
- **Calendar-driven config** — schedule kitchen-capacity increases and seasonal Wave
  Exclusive items ahead of known pilgrim peaks instead of manual same-day toggling.
- **Auto-generated daily/weekly digest** — every order/payment/refund/loyalty event is
  already logged immutably; a scheduled summary removes manual bookkeeping almost for free.

## 7. Pricing model vs Swiggy/Zomato

**How aggregators price:** a commission marketplace — typically 18–25% base commission for
orders on their own delivery fleet, often pushed toward 28–30% with ad/priority-placement
spend, plus ~2% payment gateway and 18% GST on the commission itself. Effective cut usually
lands around **28–35% of order value**. This is why chains price the same item 10–18% higher
on aggregators than on their own app — the price gap is the commission being passed through.

**Their customer-facing subscription** (Swiggy One / Zomato Gold, ~₹99–150/month) only works
economically because of network breadth — one subscription across thousands of restaurants.
That doesn't transfer to a single-outlet brand; a paid "Wave Pass" would mostly convert
people who were already going to order anyway, at a pure margin loss.

**Recommendation — hybrid model:**
- List on Swiggy/Zomato priced **~12–15% above the direct-channel price**, purely to absorb
  their commission — this is where one-off tourists and pilgrims discover the brand with zero
  effort.
- Every packaging insert / receipt / in-store prompt pushes the direct app or WhatsApp
  reorder, where price is lower and points accrue — converting one-time aggregator customers
  into direct-channel Habitual Regulars.
- Direct-channel delivery fee: flat **₹25–35**, waived above roughly **₹299–349** (maps to
  `StoreConfig.deliveryFeeFlat`, currently seeded at ₹0).
- No paid subscription — the free, tiered Wave Rewards program already built is the correct
  retention lever at this scale; revisit a paid plan only once there are multiple locations
  and "one membership, several of our stores" becomes a real network benefit.

## 8. WhatsApp / Meta cost reference

**Meta charges no platform fee** to connect to the Cloud API — only per-message, by category:

- **Customer support / doubt-clearance chat is free** — replying to a customer who messaged
  first falls inside Meta's ~24-hour customer service window, no charge.
- **Login OTP (Authentication category)** — paid, business-initiated, but India rates are
  among the cheapest globally (historically sub-₹0.50/message; confirm the live rate card,
  Meta restructured this pricing in 2025). One login ≈ one billed message, not a whole
  conversation, since the customer types the code into the app, not back into WhatsApp.
- **Order status updates (Utility category)** — paid, similarly cheap.
- **Marketing broadcasts** — paid, noticeably more than the other two — be deliberate here.

Because customer sessions last 30 days (`SESSION_POLICIES.customer.expiresInMs`), OTP volume
tracks new/returning-after-30-days logins, not order count — at a few hundred logins a
month, pure Meta cost for login is roughly **₹150–250/month**, negligible at this scale.

**Going direct against Meta's API** (skip a Business Solution Provider like AiSensy/
Interakt/WATI) avoids their ₹1,000–3,000+/month markup — the messaging/auth interfaces
(`services/messaging/MessagingProvider`, `services/auth/CustomerAuthProvider`) are already
built to swap a demo implementation for a real one without touching anything upstream, so
building directly against Meta is the more economical path here rather than paying a BSP for
tooling this codebase mostly already has.

## 9. Unit economics reference (5,000 orders/month)

Illustrative model, not real financials — replace every line with actual supplier/rent/
payroll numbers once available.

| | Conservative | Base | Optimistic |
|---|---|---|---|
| AOV | ₹280 | ₹300 | ₹330 |
| Food cost % | 36% | 32% | 28% |
| Contribution margin/order | ₹152 (54.3%) | ₹171 (57.0%) | ₹200 (60.6%) |
| Monthly gross contribution | ₹7,60,000 | ₹8,55,000 | ₹10,00,000 |
| Fixed costs (staff, rent, utilities, infra, marketing) | ₹2,36,000 | ₹2,36,000 | ₹2,36,000 |
| **Net profit/month** | **₹5,24,000** | **₹6,19,000** | **₹7,64,000** |
| **Net margin** | **34.9%** | **39.7%** | **45.6%** |

Real-world execution (wastage, discount drift, peak-hour inefficiency, any aggregator
volume) will compress this — **plan around 20–30% net margin**, not the clean-model ceiling.

**Menu pricing notes:**
- Classic Veg Pizza stays at ₹110 despite the thinnest pizza margin — its job is to be the
  low-friction anchor, not to maximize per-unit profit.
- Signature Kulhad Pizza (₹199) is underpriced relative to its "Wave Exclusive," highly
  shareable positioning — room to move to ₹219–229.
- Sides/drinks/desserts carry the highest contribution margins (72–80%); the lever there is
  attach rate via upsell prompts, not repricing an already price-sensitive impulse item.

## 10. Growth mechanic: Google Review → Wave Points

**Compliance note first:** Google's review policies restrict incentivizing reviews — rewards
must be for the *act* of engaging with feedback, never conditioned on a positive review or
shown only to happy customers. The flow below is designed around that constraint, not around
proving a specific customer wrote a specific review (which Google's API doesn't expose
anyway — reviewer identity is never linked to a phone number, email, or order).

1. **Trigger** — a couple of hours after `ORDER_COMPLETED`, prompt: "Leave us a review and
   earn Wave Points," linking straight to the business's Google review box
   (`search.google.com/local/writereview?placeid=<Place ID>`).
2. **Self-reported claim** — customer taps "Done, I left a review," creating a pending claim
   (`customerId`, `orderId`, `claimedAt`, `status: PENDING_REVIEW`).
3. **Background verification sweep** — a scheduled job (same pattern as the existing
   availability-expiry sweep) periodically pulls the business's review list via the Google
   Business Profile API and fuzzy-matches reviewer display names against pending claims.
   - Confident match → auto-verify, credit points immediately, no human involved.
   - No match after the claim window (e.g. 7 days) → auto-expire, no points.
   - Ambiguous match → routes to the existing Attention Queue as a one-tap approve/reject,
     rather than guessing — Google reviewer names are often just first names or generic, so a
     purely automated matcher will sometimes be wrong, and this keeps it honest.
4. **Fraud guardrails** — one claim per completed order; one rewarded review per customer per
   rolling window (e.g. 90 days), not per order; reward amount never scales with star rating
   and isn't gated on a positive review; a burst of claims without matching real orders
   routes to the Attention Queue instead of auto-approving.
5. **Dashboard reflection** — once verified, it's a standard `BONUS` loyalty transaction,
   reusing the exact machinery the frequency bonus already uses — no new loyalty math, just a
   new transaction source.

**Where this lives in the codebase (not yet built):**
- `domain/reviews/` — `ReviewClaim` type/schema + pure matching logic.
- `services/reviews/GoogleBusinessProfileProvider` — interface + demo implementation, same
  swap-later pattern as payments/messaging/auth.
- A second task alongside the existing sweep in `prototype/automation/jobs.ts`.
- A new `AttentionType` (`REVIEW_VERIFICATION`) added to the existing union.
- Two new event types on the existing bus (`REVIEW_CLAIMED`, `REVIEW_VERIFIED`).

---

## 11. Audit — what's already live in the app, and its expected impact

Re-checked directly against the current build (the customer surfaces have moved well past
Stage 1 since this doc was started — a real "Stage 2" home/menu exists now). This is what's
actually shipping today, not aspirational.

| System | What it does today | Lever it pulls | Expected impact |
|---|---|---|---|
| **Badge system** (`Bestseller`, `New`, `Veg`, `Spicy`, `Wave Exclusive`, `Customizable`) | Shown on every product card | Social proof + trust signalling | Steers undecided browsers toward low-risk choices; the `Veg` badge specifically matters more here than in a generic city market |
| **Smart collections** (Under ₹199, Best Sellers, Veg Favourites, Cheese Lovers, For Two, Family, Quick Bites, Something Sweet) | Filter chips on Menu, deep-linked from Home | Choice reduction / curation | Cuts a 12-item menu down to a decision in one tap — this is doing real work, not decoration |
| **Personalized vs. Popular recommendation split** | Logged-in customers see "Picked for [Name]"; logged-out see "Popular in Puri" | Personalization + social proof | Correctly segments the Habitual Regular from the first-time Beach-Road Tourist without asking either of them a question |
| **"Your Usual" + Reorder Preview** | Reconstructs the last completed order, one-tap re-add to cart | Habit loop / least effort | The single highest-frequency-driving feature already shipped — removes the entire decision from a repeat order |
| **Wave Rewards tier progress bar** | "182 points · 2 orders + ₹880 to Platinum" on Home | Endowed progress | Textbook implementation of the stamp-card effect — visible on the page that matters most |
| **Kulhad Pizza feature spotlight** (logged-out Home) | Dedicated hero section with lifestyle photography | Scarcity + shareability | Correctly leads with the one item that photographs and converts best for a first-time visitor |
| **Group deals section** (For Two / Family, with lifestyle imagery) | Visual entry points into the two bundling collections | Anchoring / bundling | Good discovery surface — see §12 for why this still isn't a true combo yet |
| **Natural-language search** (`searchCatalogProducts`) | Understands "under 200," "below 200," and "combo" as intents, not just literal text | Reduced search friction | A small but real edge — most small-business search boxes are literal-string-only |
| **Fulfillment Sheet** (Delivery/Pickup switch) | Capability-gated, re-quotes the cart, warns before switching a non-empty cart | Trust / no-surprise pricing | Prevents the classic "price changed after I switched delivery mode" complaint before it happens |
| **Referral card UI** ("Give ₹50, Get 60 points") | Visible on Home, links to `/app/refer` | Reciprocity / referral | **UI-only right now** — the route is still a placeholder screen, no referral engine behind it yet |
| **Offers teaser card** ("Your Gold-Wave Pick") | Visible on Home, links to `/app/offers` | Personalized urgency | **UI-only right now** — same placeholder-route situation as referral |
| **Order history data layer** (`useOrders`) | Already fetching real order data to power "Your Usual" and the reorder preview | — | The data plumbing is done, but `/app/orders` itself (the order-tracking screen customers would actually visit) is still a placeholder — a real gap between what Home *promises* and what tapping through *delivers* |
| **Modifier groups** (Size, Base, Cheese, Toppings, Spice) | Fully modeled in the product schema for every pizza | Upsell / customization | Not yet priced into the cart — see §12, this is the single most valuable near-term build on this list |
| **`recommendedPairings` field** | Already on every `Product` (e.g., Classic Veg Pizza → Cold Coffee) | Cross-sell | **Built but never read anywhere in the UI** — pure unused plumbing, cheapest possible win in this whole document |

## 12. Tactical corrections to increase sales — menu, logistics, combos, frequency

Organized by lever, each tied to the specific persona it moves and a real precedent for why
it works.

### Menu

**Ship the size-upsell prompt — it's the highest-value small build available.**
The Size modifier (Regular / Medium +₹80 / Large +₹150) already exists in the schema for
every pizza, but nothing in the cart flow prices it yet. This is literally "would you like to
make that large" — the single most studied upsell script in QSR, and every rupee of it is
near-pure margin on a purchase the customer already committed to. Default the picker to
highlight Medium as **"Most Popular"** rather than leaving all three options visually equal —
labeling a middle option as popular is a distinct, separately-documented effect from price
anchoring (it's default-bias, not price comparison), and the two stack.
*Moves:* every segment, but especially the **Local Odia Family** and **Habitual Regular**,
who are price-anchored enough to notice a decoy but not price-sensitive enough to refuse a
Medium once it's framed as the normal choice.

**Apply real menu engineering once order data exists.**
The classic hospitality tool here is the Kasavana & Smith matrix: classify every item by
popularity × profitability into Stars (keep prominent, never discount), Plowhorses (high
volume, thinner margin — protect, don't discount further, bundle instead), Puzzles (high
margin, low visibility — needs better placement or renaming), and Dogs (candidates for
retiring). This can't be done honestly from badges alone — it needs real order-line
frequency, which the order/CRM engine already logs. Worth building as a monthly
auto-computed report for the owner once there's live data, rather than guessing now.

**Write richer, more sensory descriptions.**
Current copy is functional ("Onion, tomato, capsicum, corn and mozzarella on a golden
crust"). Brian Wansink's restaurant menu-labeling research found descriptive labels lifted
sales roughly 27% over plain ones in a widely cited study, purely from language — no price or
recipe change. Signature Kulhad Pizza and the Chicken Tikka items are the highest-value
targets for this, since they're already the emotionally-driven, story-worthy purchases.

**Lead with veg in a temple town.**
Given the trust dynamics already established for the **Yatri Family**, consider defaulting
the menu's browse order to veg-first rather than a mixed list — reinforcing the purity signal
at the moment of browsing, not only via a small badge after the fact.

### Logistics

**Surface the honest ETA before checkout, not after.**
The scheduling engine already computes a real, load-aware promise window — it just isn't
shown pre-payment yet. This is the single highest-trust, zero-marginal-cost fix on this whole
list, because the data already exists; it only needs a UI slot. Matters most to the
time-boxed **Yatri Family** and the **Event Organiser**, who are both deciding against a
clock they don't control.

**Build the free-delivery threshold — it doesn't exist yet.**
`StoreConfig.deliveryFeeFlat` is real config now, but the cart quote applies it
unconditionally — there's no "spend ₹X more, delivery's free" logic in the pricing engine
yet. This is one of the best-documented basket-size levers in e-commerce (Amazon and
Instacart both see customers deliberately add an item specifically to cross a free-shipping
line) and it's a small, contained addition to `pricing.engine.ts`.

**Plan a "Festival Mode" config preset ahead of Rath Yatra and similar processions.**
This is a genuinely Puri-specific logistics constraint worth naming directly: during major
processions, delivery vehicles can be restricted from the temple route entirely. The store
config already supports flipping `deliveryEnabled` off and leaning on pickup — the missing
piece is pre-scheduling that switch (with clear customer-facing messaging explaining why)
ahead of known dates, instead of discovering the conflict on the day.

**Use pickup incentives to shape demand toward operationally easier fulfillment during
congestion.**
A small pickup-specific perk (a points bonus, a skip-the-queue promise) during known
high-congestion windows shifts demand toward the fulfillment mode your logistics can actually
support that day — the same demand-shaping logic ride-hailing and airline pricing use at much
larger scale, applied here as a simple, honest incentive rather than a price hike.

### Combos

**Turn "For Two" and "Family" into real priced bundles, not just filtered views.**
Right now these collections just filter the existing menu — there's no bundle SKU with its
own bundle price. Filtering helps *discovery*; it doesn't create the "buy this set and save"
anchoring moment, which is the stronger lever (see the Family Combo math in §9 — pricing a
₹468 basket at ₹419 keeps a ~64% contribution margin while reading as generous). This needs a
small new domain concept — a bundle offer that bundles specific products at a set price — and
it's worth more than any amount of extra filter tuning.

**Surface `recommendedPairings` — it's already fully built and completely unused.**
Every product already carries a list of what pairs well with it (Classic Veg Pizza → Cold
Coffee, for instance). Nothing in the UI reads this field. Showing "Goes well with…" on the
product detail page and right at the cart-add moment is the cheapest possible combo win in
this entire document — it's a UI read of data that already exists, not a new build.

**Time combo visibility to kitchen load, not just the calendar.**
Since the scheduler already computes real-time load percent, auto-surfacing a discounted
combo specifically during the low-load band (under 50%) pulls demand into hours the kitchen
has spare capacity for — the same underlying idea as the off-peak free-delivery window in
§5, extended to combos specifically, and automatable off data the engine already produces.

### Frequency & state machines

**Make the frequency bonus visible — right now it's invisible.**
The +25-points-at-3-orders / +50-at-5-orders (rolling 30 days) mechanic is real and already
computing correctly server-side, but nothing in the UI shows progress toward it — the tier
progress bar on Home tracks the 120-day tier window, a completely different, longer horizon.
A mechanic nobody can see doesn't change behavior; it needs its own small, distinct widget.
*Moves:* the **Beach-Evening Crowd** and **Habitual Regular** hardest — they're the two
segments actually capable of hitting a 3-in-30-days cadence.

**Turn point expiry into an active win-back trigger, not silent breakage.**
Every loyalty transaction already carries an `expiresAt` (180 days). Right now that's just a
background field — nothing surfaces "12 points expire in 9 days" to the customer. Adding that
nudge inside a defined pre-expiry window converts what is currently pure loss (breakage) into
a loss-aversion-driven reactivation moment, and it plugs directly into the CRM automation
already speced in §6 — the data to build this already exists in full.

**Show all three order-status tracks honestly, not one collapsed "status."**
Payment, acceptance, and fulfillment are deliberately separate state machines in this engine.
The order-tracking screen should show that — "Payment confirmed → Accepted → Preparing →
Ready" as a real, visible progression — because a first-time customer's confidence in a
second order is set almost entirely by how trustworthy the *first* one felt. This is the
highest-churn window in any repeat-purchase business (the CRM engine's own
`NEW → FIRST_ORDER → SECOND_ORDER` staging exists precisely because this transition is the
one most businesses lose the most customers on), so treat the order-tracking UI as a
retention feature, not a convenience feature.

**Differentiate win-back messaging by *which* CRM transition is happening, not one generic
blast.**
- `NEW`/`FIRST_ORDER` customer going quiet → the single most urgent, highest-value outreach
  available. Losing someone before their second order loses them as a lifetime-value case
  entirely, not just one order.
- A long-time `LOYAL`/`VIP` customer flipping `AT_RISK` → a different problem, and a generic
  discount code is often the wrong tool here — it can read as cheapening a relationship that
  was never price-driven to begin with. A personal acknowledgment ("we've missed you, Gold
  Wave member") outperforms a blanket coupon for this specific segment.
- Both of these are just different message templates keyed off state the CRM engine already
  computes on every order — no new logic, only new message content per transition.
