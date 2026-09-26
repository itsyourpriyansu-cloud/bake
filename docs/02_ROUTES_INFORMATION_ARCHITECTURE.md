# Routes and Information Architecture

## Marketing
`/`
- Hero
- Food preview
- Build Your Pizza
- Wave Rewards teaser
- Pickup / Delivery explanation
- Location
- CTA → `/app`

## Customer PWA
`/app`

Routes:
```text
/app
/app/menu
/app/search
/app/product/:productId
/app/build/:productId
/app/cart
/app/auth
/app/checkout
/app/payment
/app/orders
/app/orders/:orderId
/app/rewards
/app/rewards/history
/app/offers
/app/refer
/app/celebrations
/app/family
/app/favourites
/app/saved-orders
/app/wave-id
/app/profile
/app/profile/preferences
/app/profile/addresses
/app/profile/notifications
/app/support
```

Bottom nav:
Home / Menu / Rewards / Orders / You

Floating cart pill appears above bottom nav when cart contains items.

## Owner
`/owner`

Primary control center with drawer-based details.

Optional deep links:
```text
/owner/orders/:orderId
/owner/customers/:customerId
/owner/support/:caseId
/owner/config
```

## KDS
Exactly 3 screens:
```text
/kds
/kds/order/:orderId
/kds/availability
```

## Future staff
`/team`
Reserved only.

## PWA scope
Customer PWA manifest:
```text
start_url: /app/
scope: /app/
```

Customer service worker must not control `/owner`, `/kds`, `/team`, or `/api`.
