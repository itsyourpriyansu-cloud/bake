# Vercel deployment — The Pizza Wave prototype

The repository is configured to deploy the pitch build as a Vite single-page application. `vercel.json` installs locked dependencies with `npm ci`, runs the pitch-mode build, publishes `dist`, preserves static worker/assets, and sends application routes to `index.html` for direct-link support.

## Deploy from the Vercel dashboard

1. Push this folder to a Git repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Leave the detected framework as **Vite**.
4. Keep the repository root as the project root.
5. Deploy. The checked-in `vercel.json` supplies the install, build, output, rewrite, and worker-header settings.

The pitch build reads `.env.pitch`, so no secret or production credential is required. If matching variables already exist in the Vercel project, use these values:

```text
VITE_APP_MODE=prototype
VITE_API_BASE=/api/v1
VITE_ENABLE_MSW=true
VITE_ENABLE_DEMO_TOOLS=false
VITE_PITCH_MODE=true
VITE_PWA_SCOPE=/app/
```

## Deploy from the command line

From the repository root:

```powershell
npm ci
npm run build:pitch
npx vercel
npx vercel --prod
```

The first Vercel command creates or links the project. The second publishes the production deployment.

## URLs to verify

Replace `YOUR-DOMAIN` with the Vercel deployment domain.

```text
https://YOUR-DOMAIN/                 Marketing landing
https://YOUR-DOMAIN/app/            Customer home
https://YOUR-DOMAIN/app/menu        Menu
https://YOUR-DOMAIN/app/search      Search
https://YOUR-DOMAIN/app/cart        Cart
https://YOUR-DOMAIN/app/orders      Customer orders
https://YOUR-DOMAIN/owner           Owner login
https://YOUR-DOMAIN/kds             Kitchen login and queue
https://YOUR-DOMAIN/kds/availability Kitchen availability
https://YOUR-DOMAIN/team            Not Available Yet page
```

Customer OTP: phone `9876543210`, OTP `123456`.

KDS PIN: `2580` on Kitchen Tablet #1.

Use the owner demo credentials shown on the owner login screen.

## Prototype behavior online

- Customer, Owner, and KDS mock APIs work over HTTPS through scoped service workers.
- Data remains deterministic and browser-local in IndexedDB.
- Open Customer, Owner, and KDS in tabs of the same browser profile for the synchronized pitch flow.
- Different browsers or physical devices do not share live state until the planned FastAPI/PostgreSQL/WebSocket backend replaces the prototype persistence.
- If an older deployment appears after an update, close all Pizza Wave tabs, clear the site's storage/service workers once, and reopen `/app/`.

## Custom domain

After the deployment passes verification, open **Project Settings → Domains**, add the domain, and follow Vercel's displayed DNS records. HTTPS is provisioned automatically after DNS verification.
