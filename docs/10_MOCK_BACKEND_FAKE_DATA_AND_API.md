# Mock Backend, Fake Data and API Contracts

## Goal
The prototype must behave as though a FastAPI backend already exists.

Use:
- MSW
- typed API client
- Dexie
- fake event bus
- deterministic timers

## API base
`/api/v1`

## Demo store
```json
{
  "id": "STORE-PURI-GRAND-ROAD",
  "name": "The Pizza Wave",
  "city": "Puri",
  "open": true,
  "acceptanceMode": "HYBRID",
  "deliveryEnabled": true,
  "pickupEnabled": true,
  "storeOrderEnabled": true
}
```

## Demo customer
```json
{
  "id": "CUST001",
  "firstName": "Priyanshu",
  "phone": "+919876543210",
  "tier": "GOLD",
  "pointsAvailable": 182,
  "pointsPending": 19,
  "rolling120Orders": 8,
  "rolling120Spend": 3620,
  "lifetimeOrders": 14,
  "lifetimeValue": 6891,
  "averageOrderValue": 492,
  "preferredCategory": "Pizza",
  "tags": ["Gold Wave","Pizza Lover","Weekend Buyer","Repeat Customer"]
}
```

## Demo menu
Prototype/demo values only; replace later with verified live menu.

| ID | Product | Category | ₹ | Veg | Prep | Complexity |
|---|---|---|---:|---|---:|---:|
| PIZZA-VEG-001 | Classic Veg Pizza | Pizza | 110 | Yes | 14 | 2 |
| PIZZA-PANEER-001 | Paneer Cheese Pizza | Pizza | 229 | Yes | 16 | 2 |
| PIZZA-MUSH-001 | Mushroom Cheese Pizza | Pizza | 199 | Yes | 16 | 2 |
| PIZZA-CHK-001 | Chicken Tikka Pizza | Pizza | 249 | No | 18 | 3 |
| KULHAD-001 | Signature Kulhad Pizza | Kulhad Pizza | 199 | Yes | 20 | 3 |
| BURGER-001 | Paneer Crunch Burger | Burger | 149 | Yes | 10 | 1 |
| WRAP-001 | Chicken Tikka Wrap | Wrap | 179 | No | 10 | 1 |
| FRIES-001 | Peri Peri Fries | Sides | 99 | Yes | 6 | 1 |
| GARLIC-001 | Cheesy Garlic Bread | Sides | 129 | Yes | 8 | 1 |
| SHAKE-001 | Oreo Thick Shake | Shakes | 149 | Yes | 4 | 1 |
| COFFEE-001 | Cold Coffee | Beverages | 119 | Yes | 4 | 1 |
| BROWNIE-001 | Chocolate Brownie | Desserts | 99 | Yes | 2 | 1 |

## Demo modifiers
Pizza:
- Size: Regular / Medium / Large
- Base: Normal / Whole Wheat / Multigrain
- Cheese: Regular / Extra
- Toppings: Paneer / Mushroom / Corn / Olives / Jalapeño
- Spice: Mild / Medium / Spicy

## Seed orders
At minimum:
- 2 PREPARING
- 1 READY
- 1 SCHEDULED
- 1 REVIEW_REQUIRED paid order
- 3 COMPLETED
- 1 REFUND PROCESSING

## Core API routes

### Auth
```text
POST /auth/customer/request-otp
POST /auth/customer/verify-otp
POST /auth/customer/logout
POST /auth/owner/login
POST /auth/owner/logout
POST /auth/kds/pin
POST /auth/kds/logout
```

### Capabilities
`GET /capabilities`

### Catalog
```text
GET /menu
GET /categories
GET /products
GET /products/:id
GET /recommendations
GET /search?q=
```

### Cart
```text
GET /cart
POST /cart/items
PATCH /cart/items/:itemId
DELETE /cart/items/:itemId
POST /cart/quote
```

### Checkout / Payment
```text
POST /checkout/session
POST /checkout/order-intent
POST /payments/phonepe/initiate
GET /payments/:paymentId
POST /demo/payments/:paymentId/succeed
POST /demo/payments/:paymentId/fail
```

### Orders
```text
GET /orders
GET /orders/:id
GET /orders/:id/events
POST /orders/:id/reorder
```

### Owner
```text
GET /owner/dashboard
GET /owner/attention
GET /owner/orders/live
POST /owner/orders/:id/accept
POST /owner/orders/:id/reject
GET /owner/customers/search
GET /owner/customers/:id
GET /owner/customers/:id/timeline
POST /owner/customers/:id/points-adjustment
GET /owner/config
PATCH /owner/config
```

### KDS
```text
GET /kds/orders
GET /kds/orders/:id
POST /kds/orders/:id/start
POST /kds/orders/:id/ready
POST /kds/orders/:id/prep-time
POST /kds/orders/:id/problem
PATCH /kds/availability/:entityId
```

### Loyalty
```text
GET /loyalty
GET /loyalty/history
POST /loyalty/redeem-preview
POST /customer/wave-id
```

### Support
```text
GET /conversations
POST /conversations
GET /conversations/:id
POST /conversations/:id/messages
POST /conversations/:id/intents
POST /orders/:id/cancellation-request
GET /refunds/:id
```

## Rule
UI components never call `fetch()` directly. Use typed service functions.
