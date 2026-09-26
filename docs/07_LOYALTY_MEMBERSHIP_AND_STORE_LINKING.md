# Loyalty, Membership and Store Linking

## One wallet across all channels
Delivery, Pickup, Store Self, and Store Assisted all contribute to the same customer:
- points
- tier
- order history
- CRM
- preferences

## Wave Points
- 1 point = ₹1
- earned on eligible food spend
- PENDING until order completion
- AVAILABLE after fulfillment
- REVERSED on refund where applicable
- minimum redemption 50
- max redemption 20% of eligible food subtotal
- expiry 180 days

## Tiers

| Tier | Rolling 120-day qualification | Earn rate |
|---|---|---:|
| Wave Member | Verified account | 2% |
| Silver Wave | 3 completed orders + ₹1,000 spend | 3% |
| Gold Wave | 6 completed orders + ₹2,500 spend | 4% |
| Platinum Wave | 10 completed orders + ₹4,500 spend | 5% |

30-day grace before downgrade.

## Frequency bonus
- 3 completed orders / rolling 30d → +25
- 5 completed orders / rolling 30d → +50 additional

## Eligible spend
Do not reward:
- delivery fee
- redeemed points
- refunded value
- cancelled value

## Membership UI
Home:
`Gold Wave · 182 pts`

Product:
`+8 pts`

Cart:
`This order earns +19`

Payment confirmed:
`+19 pending`

Completion:
`+19 available`

Rewards:
full wallet/tier/progress/history.

## Next-tier progress
Example:
```text
GOLD WAVE

Orders  8 / 10
Spend   ₹3,620 / ₹4,500

2 orders + ₹880 to Platinum
```

## My Wave ID
Route: `/app/wave-id`

Dynamic QR:
- short-lived
- one-time demo token
- refresh every 60 sec
- never embed raw phone/customer ID

## In-store linking
Preferred:
1. customer opens My Wave ID
2. owner scans
3. temporary store session attaches customer

Alternative:
1. owner enters phone
2. only masked customer summary appears
3. fake WhatsApp OTP
4. after verification attach customer

## Store session
```text
store_session:
  customer_id
  method: DYNAMIC_QR | PHONE_OTP | STORE_QR
  status: CONNECTED | EXPIRED | CANCELLED
  created_at
  expires_at
```

Do not permanently bind customer to a store device.

## Owner loyalty controls
Owner may:
- add goodwill points
- remove points with reason
- inspect history

Owner may not:
- set tier manually
- rewrite tier history

All adjustments create audit records.
