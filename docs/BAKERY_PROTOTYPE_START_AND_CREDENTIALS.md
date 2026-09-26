# The Bakery Wave — Start, Credentials and Phase Guide

This guide is only for the parallel Bakery Wave prototype. Pizza Wave remains available on its existing routes.

## 1. Start the prototype

Open PowerShell or Command Prompt and go to:

```powershell
cd C:\Users\priyansu\Downloads\pizza_wave_v1
```

Install packages once:

```powershell
npm install
```

Start the presentation build locally:

```powershell
npm run demo
```

Open:

```text
http://127.0.0.1:4173/bakery
```

If port 4173 is already being used, close the earlier Vite terminal before starting this command.

## 2. Demo credentials

### Customer

```text
Phone: 9876543210
OTP:   123456
```

Browsing, searching, viewing products and designing a cake do not require login. Login is required at checkout and for personal pages.

### Founder

```text
Route:    /bakery/owner/
Email:    owner@bakerywave.demo
Password: BakeryWave@123
2FA:      654321
```

### Bakery production

```text
Route: /bakery/production/
PIN:   2580
Device: Kitchen Tablet #1
```

All credentials are fake and work only inside the local prototype.

## 3. Phase 1 — Visual foundation and discovery

Open these routes:

```text
/bakery
/bakery/app/
/bakery/app/cakes
/bakery/app/bakes
/bakery/app/search
```

Show the client:

1. The separate bakery identity and colour system.
2. Cakes organized by event and visual style.
3. Ready-today products separated from celebration cakes.
4. Quick ordering, personalization and bespoke ordering as different business paths.

## 4. Phase 2 — Product and custom cake studio

Status: implemented and responsive on customer mobile and desktop layouts.

Open:

```text
/bakery/app/product/cake-vintage-heart
/bakery/app/design/cake-vintage-heart
/bakery/app/bespoke
```

Recommended demonstration:

1. Open the Vintage Heart Cake.
2. Show the three predefined combinations for a fast customer.
3. Select **Personalise This Cake**.
4. Choose the event date.
5. Configure size, sponge, filling, finish, shape, decoration and celebration extras.
6. Enter a cake message.
7. Add the final cake to the Happy Box.
8. Show the separate bespoke request for wedding, sculpted or corporate work.

Phase 2 behaviours now available:

- Functional **Ready today**, **Eggless** and **Under ₹500** catalogue filters.
- Functional search phrases including `eggless`, `ready today` and `under 500`, with recent searches.
- Three fast predefined cake formats beside the full custom studio.
- Unavailable products cannot enter customization or the box.
- Builder progress navigation, required-choice feedback and an end-of-design summary.
- Occasion and event date follow a custom cake into the Happy Box.
- Human-readable customization labels and an **Edit design** route in the box.
- Intentional loading, error, empty and unavailable states.

## 5. Phase 3 — Cart, rewards and checkout

Open:

```text
/bakery/app/cart
/bakery/app/auth
/bakery/app/checkout
```

Recommended demonstration:

1. Change quantity in the cart.
2. Switch between Delivery and Pickup.
3. Enable 50 Sweet Points and show the server-shaped quote update.
4. Continue to checkout.
5. Sign in with the customer phone and OTP above.
6. Select the event date and fulfilment slot.
7. Continue to the fake PhonePe screen.

## 6. Phase 4 — Payment and order journey

On the fake PhonePe screen choose one of:

```text
PAY SUCCESS
PAY FAILURE
KEEP PENDING
```

For the complete happy path choose **PAY SUCCESS**.

The customer will see:

```text
PAYMENT RECEIVED
AWAITING ACCEPTANCE
```

The prototype does not claim that the order is confirmed until the founder accepts it.

## 7. Phase 5 — Founder acceptance

Open the founder route in another tab:

```text
http://127.0.0.1:4173/bakery/owner/
```

Sign in with the founder credentials. Under **Paid & In Production**, accept the awaiting order.

Also demonstrate:

- Cake calendar
- Bespoke request queue
- Customer 360
- Birthday and second-order opportunities
- Production health

## 8. Phase 6 — Bakery production

Open:

```text
http://127.0.0.1:4173/bakery/production/
```

Sign in with PIN `2580`.

Move the accepted order through:

```text
SCHEDULED
→ MIXING
→ BAKING
→ COOLING
→ DECORATING
→ PACKING
→ READY
→ COMPLETED
```

Open the production order to show the prominent cake message, eggless/size/shape instructions and promise timer.

Use `/bakery/production/availability` to temporarily disable a product. The customer catalogue uses the same bakery data.

## 9. Customer personalization and retention

After signing in, demonstrate:

```text
/bakery/app/celebrations
/bakery/app/rewards
/bakery/app/orders
/bakery/app/profile
/bakery/app/support
/bakery/app/saved-designs
/bakery/app/refer
```

The seeded customer is Priyanshu with Gold membership and 182 available Sweet Points.

## 10. Reset the bakery demo

The bakery database is isolated from Pizza Wave. To reset only Bakery Wave, open the browser console on any `/bakery/app/` page and run:

```js
fetch('/api/bakery/v1/demo/reset', { method: 'POST' }).then(() => location.reload())
```

This restores:

- Catalogue availability
- Empty cart
- Empty bakery order list
- 182 Sweet Points
- Founder state
- Production queue
- Bespoke requests

It does not reset or modify Pizza Wave.

## 11. Validation commands

From the project folder:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build:pitch
```

To preview the production build:

```powershell
npm run preview:pitch
```

Then open `http://127.0.0.1:4174/bakery`.

## Prototype-only integrations

- OTP is simulated.
- PhonePe is simulated.
- WhatsApp is simulated.
- Data is stored locally through an isolated browser database.
- Cake inspiration upload is presentation-only.
- Cake preview is a visual style guide, not an AI or 3D production rendering.
- No real payment, message, order or production request leaves the browser.
