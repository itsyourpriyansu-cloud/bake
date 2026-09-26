# Bakery Wave — standalone Vercel prototype

This folder is a self-contained Bakery Wave frontend. It does not require a Python, Node, database, payment or messaging backend.

## Local use

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run demo
```

Open `http://127.0.0.1:4173/`. The domain root shows the Bakery Wave landing page.

Production verification:

```bash
npm run check
npm run build:vercel
npm run preview
```

## Vercel deployment

1. Extract this directory.
2. Upload it to a new Git repository, or select this directory as the Vercel project root.
3. Import the project in Vercel.
4. Keep the detected framework as **Vite**.
5. Deploy. `vercel.json` supplies `npm ci`, `npm run build:vercel`, `dist`, SPA rewrites and service-worker headers.

No environment variables or backend services are required for this prototype.

## Routes

- `/` — Bakery Wave landing page
- `/bakery/app/` — customer PWA
- `/bakery/app/cakes` — cakes
- `/bakery/app/bakes` — daily bakes
- `/bakery/app/cart` — cart
- `/bakery/app/auth` — customer demo login
- `/bakery/owner` — founder control
- `/bakery/production/` — bakery production board

All nested product, builder, checkout, payment, order, account and availability routes are preserved.

## Demo credentials

Customer:

- Phone: `9876543210`
- OTP: `123456`

Founder:

- Email: `owner@bakerywave.demo`
- Password: `BakeryWave@123`
- 2FA: `654321`

Production:

- PIN: `2580`

## How the backend-free prototype works

- MSW provides the browser-side API under `/api/bakery/v1`.
- Dexie stores seeded products, cart, orders, availability and requests in IndexedDB.
- The service worker provides API interception and the customer-shell cache.
- Payment, WhatsApp and OTP are simulations. No money, message or credential leaves the browser.

The source seed is in `src/prototype/bakery/bakery.seed.ts`. IndexedDB is initialized by `src/prototype/bakery/bakery.db.ts`.

## Resetting the demo

Open browser developer tools, go to **Application → Storage**, clear site data, and reload `/bakery/app/`. The exact bakery seed is recreated automatically.

## Prototype limitations

Data belongs to one browser profile and is not shared between different devices. Replacing MSW and Dexie with a real API/database is required before production use.
