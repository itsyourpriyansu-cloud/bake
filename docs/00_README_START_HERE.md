# The Pizza Wave — Prototype User Manual

This is the simplest guide for running, presenting, testing, resetting, and deploying The Pizza Wave prototype.

## 1. What this prototype demonstrates

The prototype shows one connected restaurant platform with three separate interfaces:

| Interface | URL | Used by |
| --- | --- | --- |
| Marketing website | `/` | New visitors |
| Customer app | `/app/` | Pizza Wave customers |
| Owner control centre | `/owner` | Founder/Owner |
| Kitchen KDS | `/kds` | Chef/kitchen team |
| Team placeholder | `/team` | Reserved for a future stage |

The customer can browse, customize food, order, pay through a simulated PhonePe screen, track the order, earn Wave Points, and use retention features. The Owner can manage paid orders, exceptions, availability, support, customers, and CRM demonstrations. The chef can manage the kitchen queue, preparation timing, ready status, and temporary item availability.

Everything uses fake, deterministic data. No real money, WhatsApp message, OTP, refund, or customer information is used.

## 2. Credentials

| Interface | Demo credential |
| --- | --- |
| Customer | Phone `9876543210`, OTP `123456` |
| Owner | Email `owner@pizzawave.demo`, password `PizzaWave@123`, verification code `654321` |
| KDS | PIN `2580`, trusted device `Kitchen Tablet #1` |

These credentials provide prototype access only. They are not production security.

## 3. Start the prototype locally

Open PowerShell and go to the project folder:

```powershell
cd C:\Users\priyansu\Downloads\pizza_wave_v1
npm install
npm run demo
```

Open the address printed by Vite. The configured address is normally:

```text
http://127.0.0.1:4173/
```

`npm run demo` starts the clean client-facing pitch mode. Developer buttons and debugging information are hidden.

If `npm` reports **Missing script: demo**, you are in the wrong folder. Run:

```powershell
Get-Location
npm run
```

Confirm that the folder contains this project's `package.json` and that `demo` appears in the script list.

## 4. Available running modes

### Client presentation mode

```powershell
npm run demo
```

- Uses deterministic demo data.
- Hides developer controls.
- Shows the convincing but clearly simulated PhonePe experience.
- Best choice for a client meeting.

### Internal demo mode

```powershell
npm run dev:demo
```

- Shows the developer toolbar.
- Allows Reset Demo, Advance Time, Payment Success, Payment Failure, Kitchen Load, KDS Offline, and Complete Order scenarios.
- Best choice for testing exceptional flows.

### Production-equivalent local preview

```powershell
npm run build:pitch
npm run preview:pitch
```

Open:

```text
http://127.0.0.1:4174/
```

This serves the optimized pitch bundle, including the customer PWA worker.

## 5. Recommended setup for a reliable demonstration

1. Use one Chrome or Edge browser profile.
2. Reset the demo before the meeting.
3. Open the Customer, Owner, and KDS links in that same browser profile.
4. For maximum reliability, demonstrate the interfaces sequentially in one tab. If using separate tabs, revisit or refresh a tab after an action if its latest state is not visible immediately.
5. Do not use private/incognito windows for one interface and a normal window for another; they do not share browser storage.
6. Do not use different physical devices for a synchronized flow. The prototype database is local to one browser profile.

The first visit to a data-powered interface can reload once while its correctly scoped mock service worker becomes active. This is expected.

## 6. Customer app manual

Open `/app/`.

### Choose Delivery or Pickup

1. Tap the fulfillment mode in the header.
2. Choose **Delivery** or **Pickup** in the bottom sheet.
3. If the cart already contains food, confirm the switch.
4. The cart remains, while the mock server refreshes fees, offers, timing, and the quote.

### Browse and search

- Use Home for personalized recommendations, categories, offers, rewards, and reorder sections.
- Open `/app/menu` to browse structured categories and collections.
- Use `/app/search` for searches such as `paneer`, `chicken`, `veg`, `spicy`, `cheese`, `shake`, `combo`, or `under 200`.
- Unavailable products are shown as unavailable rather than silently removed.

### Customize and add food

1. Open a product card.
2. Use **Customize** for pizza size, base, sauce, cheese, toppings, spice, and meal additions.
3. Required modifier groups must be completed before adding.
4. Use **Add to Cart**.
5. Use the floating cart pill to open `/app/cart`.

All pizza products support customization. Browse cards also support fast add where appropriate.

### Review the cart

- Increase or decrease quantity.
- Edit a customized item.
- Remove an item.
- Add a suggested side.
- Preview Wave Points and eligible redemption.
- Review subtotal, discount, points, delivery fee, and final total.

The final commercial total comes from the mock `/api/v1/cart/quote` service rather than being calculated only by the screen.

### Customer login and checkout

Browsing does not require login. Checkout does.

1. Continue from Cart to Checkout.
2. Enter phone `9876543210`.
3. Choose the fake WhatsApp OTP action.
4. Enter OTP `123456`.
5. For Delivery, enter the delivery details and instructions.
6. For Pickup, review the generated pickup slot and add an optional note.
7. Continue to the payment stage.

### Simulated PhonePe payment

1. Press **PAY SECURELY** in pitch mode.
2. No real payment is made.
3. The mock backend confirms the result.
4. The customer sees **Payment Received** and **Awaiting Acceptance**.

The frontend return screen is not treated as proof of payment; the mock backend payment state controls the outcome.

To demonstrate payment failure or a pending/reconciliation state, run `npm run dev:demo` and use the developer scenario controls. A failed payment keeps the cart and creates no KDS order.

### Track the order

Open `/app/orders` and select the active order.

- Owner acceptance changes the customer from awaiting acceptance to confirmed.
- Chef Start Prep changes it to Preparing.
- A chef time override updates the ETA.
- Mark Ready updates the customer tracking screen.
- The delivery-tracking prototype shows a map-style journey and delay information where applicable.
- Completion releases pending loyalty points and updates the customer experience.

### Customer rewards and retention

The customer app now starts in a true guest state. A guest can browse, customize, and build a cart, but the app does not show Priyanshu's name, wallet, orders, profile, or saved preferences. Opening a personal route sends the guest to the OTP screen and returns them to that route after verification.

Use the demo customer login:

```text
Phone: 9876543210
OTP:   123456
```

### Check Wave Points in a live cart

1. Reset the demo and confirm the header says **JOIN WAVE** rather than showing a Gold balance.
2. Add products to the cart as a guest. The rewards card should ask the visitor to sign in; it must not show Priyanshu or 182 points.
3. Sign in with the phone and OTP above. The cart remains intact and the header changes to **GOLD · 182**.
4. In Cart, note the server-provided **You'll earn +N points** preview.
5. Select **Use 50 points**. The bill must show **Wave Points −₹50** when the complete 50-point redemption is allowed, and the total must decrease by the exact server-approved amount.
6. Continue through checkout and choose **PAY SUCCESS**. The redeemed points leave the available balance once, while the newly earned points appear as pending.
7. Accept the order, complete it through KDS, then finish Delivery/Pickup. The pending points become available automatically.
8. Open `/app/rewards/history` to verify separate **REDEEM**, **EARN_PENDING**, and completed/available activity.

Wave Points rules in this prototype:

- 1 point = ₹1.
- A redemption request starts at 50 points and is capped at 20% of eligible food subtotal and the available wallet balance.
- Gold earns 4% of eligible food spend after the points discount; points are rounded down to a whole number.
- Delivery/pickup fees do not earn points.
- New points remain pending until fulfillment completes.
- If an order is rejected and fully refunded, its pending earn is reversed and any redeemed points are restored.

Example: with a ₹330 pickup subtotal, 50 points reduce the bill to ₹280. Eligible spend becomes ₹280, so a Gold customer earns `floor(₹280 × 4%) = 11` pending points. Starting from 182 available points, payment changes the available balance to 132 and adds 11 pending for this order. Completion releases those 11, producing 143 available points (before any separately applicable frequency bonus). The seed's older 19 pending points remain a separate ledger entry.

Useful demonstration routes include:

- `/app/rewards` — Wave Points and tier progress
- `/app/rewards/history` — point activity
- `/app/wave-id` — link a returning customer/store interaction
- `/app/saved-orders` — saved repeat orders
- `/app/favourites` — favourites
- `/app/refer` — referral states
- `/app/celebrations` — birthday automation preview
- `/app/support` — unified support conversation
- `/app/profile` — customer profile and preferences

The seeded customer is Priyanshu, a Gold Wave member with 182 starting points.

## 7. Owner control centre manual

Open `/owner` and sign in with the Owner credentials above.

The Owner realm is separate from both Customer and KDS sessions.

### Process a paid order

1. Find the paid order in the Owner live operations area.
2. Review its payment and acceptance state.
3. Accept the order.
4. The customer becomes confirmed and the order becomes available to KDS.

### Reject and refund demonstration

1. Create a successful payment from the customer flow.
2. Reject the paid order from Owner instead of accepting it.
3. Refund processing begins in the prototype.
4. The customer and conversation history update.
5. No kitchen ticket is created.

### Availability

- An Owner-disabled product is authoritative and appears locked in KDS.
- The chef cannot re-enable an Owner-disabled item.
- A chef's temporary disable appears to Owner with its remaining duration.
- Customer menu and affected carts revalidate after availability changes.

### Founder attention and support

- Meaningful unresolved issues appear in **Needs Your Attention**.
- Routine order activity does not create unnecessary alerts.
- Customer Missing Item support can create a Founder case.
- A simulated item refund updates the same conversation used for in-app and WhatsApp history.
- Delivery delay information appears in Owner tracking/operations where applicable.

### CRM and retention

Use the Owner CRM areas to demonstrate:

- Second Order Pending
- Inactive customers
- Points Expiring
- Birthday Upcoming
- Near Gold or Platinum
- Dormant Gold or Platinum
- Campaign preview for In-App, WhatsApp Simulation, and Push Simulation
- Referral progress and customer personalization

No real campaign or WhatsApp message is sent.

## 8. Kitchen KDS manual

Open `/kds` and unlock it with PIN `2580`.

KDS intentionally has exactly three screens:

1. `/kds` — Kitchen Queue
2. `/kds/order/:orderId` — Order Preparation
3. `/kds/availability` — Availability

### Kitchen Queue

- Orders appear only after payment and Owner/system acceptance.
- Tickets are grouped into Start Now, Start Soon, Preparing, and Ready.
- The system decides queue order; chefs cannot drag or reorder tickets.
- Open an order and press **Start Prep**.

### Order Preparation

- Read the target-ready time and high-visibility timer.
- Review items, sizes, bases, modifiers, and kitchen notes.
- Critical instructions such as **NO ONION** or **EXTRA CHEESE** are visually prominent.
- Keep the suggested time or add 5/10 minutes.
- A custom override requires a reason and updates the system ETA.
- Report ingredient, delay, equipment, or other problems when needed.
- Press **Mark Ready** when preparation finishes.

### Availability

- Search products and modifiers.
- Temporarily disable an item for 30 minutes, 1 hour, today, or until manually enabled.
- Customer availability and cart validation update.
- Owner-disabled products show **Disabled by Owner** and cannot be enabled by the chef.

## 9. Complete delivery demonstration

Use this sequence for an 8–12 minute client presentation:

1. Open `/` and explain direct ordering, rewards, pickup, and delivery.
2. Enter `/app/` and select Delivery.
3. Browse Menu, open a pizza, customize it, and add it to Cart.
4. Show server-shaped pricing and the points preview.
5. Authenticate with the customer phone and OTP.
6. Complete delivery details and simulated PhonePe payment.
7. Stop briefly at **Awaiting Acceptance** to explain that payment does not automatically promise an order.
8. Open Owner, show the paid order, and accept it.
9. Open KDS, start preparation, and add 10 minutes.
10. Return to customer tracking and show the revised ETA.
11. Return to KDS and mark the order ready.
12. In internal demo mode, use **Complete Order** to show points becoming available, CRM updates, and the next-order retention loop.

## 10. Pickup demonstration

1. Reset the demo.
2. Choose Pickup in the customer header.
3. Add and customize food.
4. At checkout, show the generated pickup slot, phone, and note.
5. Complete the simulated payment.
6. Accept the order in Owner.
7. Start and mark it ready in KDS.
8. Complete the pickup scenario in internal demo mode.
9. Show released loyalty points.

## 11. Other useful test scenarios

### Payment failure

Run internal demo mode, choose Payment Failure, and verify:

- No operational order is created.
- No KDS ticket appears.
- The customer cart is preserved.

### Temporary ingredient problem

1. In KDS Availability, temporarily disable Mushroom.
2. Revisit the customer product/cart.
3. The customer is asked to update or remove the affected item.
4. Owner sees the chef's temporary override.

### Owner permanent disable

1. Disable a product from Owner.
2. Customer sees it as unavailable.
3. KDS shows it locked.
4. Chef cannot re-enable it.

### KDS offline

Run internal demo mode and enable **KDS Offline**. Owner should receive an operational alert. Restore it after the demonstration.

### Support case

1. Open customer Support and report a Missing Item.
2. Open Owner and find the case.
3. Use the prototype refund action.
4. Return to the customer thread and show the unified update.

### Wave ID/store customer link

1. Open `/app/wave-id` and show Priyanshu's identifier.
2. Use the Owner store-customer linking flow.
3. Show Gold Wave and 182 points.
4. Demonstrate that store-assisted activity uses the same loyalty wallet.

## 12. Reset the complete prototype

### Visible reset

Run:

```powershell
npm run dev:demo
```

Open the developer toolbar and choose **Reset Demo**.

### Hidden pitch reset

While a Customer, Owner, or KDS data screen is open, press:

```text
Ctrl + Alt + Shift + R
```

Wait for the page to reload.

Reset restores the seeded customer wallet (182 points), orders, cart, payments, menu availability, Owner state, KDS state, support cases, conversations, and demo clock. It also clears all authenticated sessions, so the customer restarts as a guest and Owner/KDS require their own credentials again.

## 13. PWA installation and offline behavior

- The installable customer app is scoped only to `/app/`.
- Open the deployed HTTPS version or production preview and use the browser's **Install App** option when available.
- Owner, KDS, Landing, and Team are not part of the customer PWA.
- Offline support demonstrates the customer application shell only.
- Ordering, payment, synchronization, and updates are not production-grade offline features.

Customer PWA files:

```text
/app.webmanifest
/sw.js
```

## 14. Deploy to Vercel

The repository already contains `vercel.json` with the Vite build, SPA rewrites, output folder, and service-worker headers.

### Vercel dashboard

1. Push this project to a Git repository.
2. In Vercel, select **Add New → Project**.
3. Import the repository.
4. Keep **Vite** as the framework.
5. Keep the project root as the root directory.
6. Click **Deploy**.

No real secret is needed. The deployment uses `.env.pitch`.

### Vercel command line

```powershell
cd C:\Users\priyansu\Downloads\pizza_wave_v1
npm ci
npm run build:vercel
npx vercel
npx vercel --prod
```

After deployment, replace `YOUR-DOMAIN` below:

```text
https://YOUR-DOMAIN/
https://YOUR-DOMAIN/app/
https://YOUR-DOMAIN/owner
https://YOUR-DOMAIN/kds
```

Different devices will not share prototype state. Use one browser profile for the connected pitch flow. A real FastAPI/PostgreSQL/WebSocket backend is required for live multi-device synchronization.

## 15. Quality-check commands

Run these before an important presentation or deployment:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build:vercel
```

Expected result: lint and type checking finish without errors, all automated tests pass, and Vite creates the `dist` folder.

## 16. Troubleshooting

### A screen says something went wrong

1. Refresh once so the correct scoped service worker can activate.
2. If it remains, use the complete demo reset.
3. If an older build is cached, close Pizza Wave tabs, clear site data/service workers for that origin, and reopen `/app/`.

### Customer, Owner, and KDS do not show the same state

- Confirm they use the exact same domain, protocol, port, and browser profile.
- Do not mix `localhost` with `127.0.0.1`.
- Revisit or refresh the stale interface.
- For the most reliable presentation, demonstrate sequentially in one tab.

### A direct online link returns 404

Confirm the deployment includes the root `vercel.json`. Its SPA rewrite sends application links to `index.html`.

### The old version is still visible after deployment

Vercel may be serving the new files while the previous service worker still controls the browser. Clear the site's stored data once, then reopen the deployment.

### The configured port is busy

Use the alternate address printed by Vite. Always use that exact origin for every prototype interface.

## 17. Important prototype limitations

- Data is stored in IndexedDB inside the browser, not in a shared production database.
- MSW acts as the prototype API instead of a deployed FastAPI service.
- Realtime transport, PhonePe, WhatsApp, push, OTP, refunds, maps/courier movement, and background jobs are simulations.
- No real customer, payment, messaging, or production credential should be entered.
- Separate devices do not synchronize.
- Clearing browser data removes the current scenario; reset restores the deterministic seed.

## 18. How the architecture will move to production

The screens and typed API contracts are designed to remain. After client approval:

```text
MSW mock API              → FastAPI
Dexie/IndexedDB data      → PostgreSQL
DemoRealtimeTransport     → WebSockets and Redis
DemoPhonePeProvider       → PhonePe production API and verified webhooks
DemoWhatsAppProvider      → WhatsApp Business Platform
Fixed demo OTP            → Production phone verification
DemoClock/mock jobs       → Redis-backed workers and scheduler
```

The detailed production plan is in `docs/PRODUCTION_BACKEND_HANDOFF.md`.
