# MASTER AGENT CONTEXT — THE PIZZA WAVE PROTOTYPE

You are building a pitch-ready fake-data prototype for **The Pizza Wave**.

Read every Markdown file in this folder before coding. Treat them as frozen product requirements.

## Product surfaces
- `/` marketing landing page
- `/app` customer PWA
- `/owner` founder control center
- `/kds` chef KDS
- `/team` reserved
- `/api/v1` future backend namespace

## Stack
React 19, Vite 8, TypeScript, React Router v7, Tailwind CSS v4, Framer Motion, Lucide React, Axios, TanStack Query, Zustand, React Hook Form, Zod, Dexie, MSW, vite-plugin-pwa/Workbox.

Future backend: FastAPI, PostgreSQL, Redis, WebSockets, workers, PhonePe, WhatsApp Business Platform.

## Non-negotiable logic
1. Customer may browse without login.
2. Customer chooses Delivery or Pickup.
3. Cart/quote are server-shaped.
4. Fake PhonePe payment happens before operational order creation.
5. Backend-shaped mock confirms payment.
6. Confirmed payment enters `AWAITING_ACCEPTANCE`.
7. HYBRID acceptance is default.
8. Safe orders may auto-accept.
9. Exceptions require owner review.
10. Owner may Accept or Reject paid review orders.
11. Reject triggers refund simulation.
12. KDS receives only paid + accepted orders.
13. KDS has exactly three screens.
14. System recommends queue/timing.
15. Chef may change prep timing with reason.
16. Customer sees kitchen progress and ETA changes immediately.
17. Owner can globally disable products/modes.
18. Chef can set temporary availability only within permissions.
19. Owner availability override has highest authority.
20. One customer identity spans Delivery, Pickup and Store.
21. Store customer linking uses dynamic Wave ID or phone+OTP.
22. Loyalty wallet/tier is shared across all channels.
23. Tier is calculated, never manually assigned.
24. Chat + WhatsApp simulation share the same conversation engine.
25. Routine support questions are automated.
26. Founder primarily handles exceptions.
27. Every important state transition emits an event.
28. No screen hardcodes business state; use typed services + mock `/api/v1`.
29. No real payment or messaging integration in prototype.
30. No production secrets.

## Loyalty
- 1 Wave Point = ₹1
- Wave Member 2%
- Silver 3%: 3 orders + ₹1,000 / rolling 120d
- Gold 4%: 6 orders + ₹2,500 / rolling 120d
- Platinum 5%: 10 orders + ₹4,500 / rolling 120d
- 30d downgrade grace
- 180d point expiry
- min redemption 50
- max redemption 20% of eligible food subtotal
- points pending until fulfillment completion
- 3 orders/30d → +25 bonus
- 5 orders/30d → +50 additional bonus

## Design
Colors:
- Orange #FD7E3B
- Burgundy #4D0711
- Yellow #FDCC3B
- Sky #8BDFFA
- Pink #FAAEDC
- Green #C1CC52
- Red #BD1F17
- Cream #FEFEF6

Fonts:
- Phudu display
- Poppins UI/body

Principle:
**Brand loud. Commerce quiet.**

Do not use glassmorphism, neon, excessive gradients, generic SaaS dashboards, long scroll animation, or unnecessary visual gimmicks.

## Demo credentials
Customer:
- phone `9876543210`
- OTP `123456`

Owner:
- `owner@pizzawave.demo`
- `PizzaWave@123`
- 2FA `654321`

KDS:
- PIN `2580`

## Build order
Foundation → Customer Commerce → Payment/Order State → Owner → KDS → Realtime Simulation → Loyalty/Store Linking → Chat/Support → Image Integration → Polish/QA.

When a detail is unclear, prefer the rule that:
**the system automates normal work, the chef controls kitchen reality, and the founder controls policy and exceptions.**
