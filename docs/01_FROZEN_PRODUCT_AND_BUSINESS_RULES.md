# Frozen Product and Business Rules

## Product definition
The Pizza Wave is a direct-ordering + retention + loyalty + CRM + kitchen platform for a QSR in Puri.

## One customer identity
A customer has one account across:
- Delivery
- Pickup
- Store self-order
- Store assisted order

Shared:
- phone
- points
- tier
- order history
- preferences
- CRM timeline

Returning in-store customers connect by:
1. dynamic My Wave ID QR, or
2. phone lookup + WhatsApp OTP.

Never attach a customer profile from phone number alone without verification.

## Payment-first rule
No operational order exists until backend payment confirmation.

```text
CART
→ CHECKOUT_SESSION
→ ORDER_INTENT
→ PAYMENT_PENDING
→ PAYMENT_CONFIRMED
→ AWAITING_ACCEPTANCE
```

Only accepted orders enter KDS.

## Acceptance modes
- AUTO
- HYBRID — prototype default
- MANUAL

HYBRID auto-accepts safe orders and sends exceptions to owner review.

Review triggers:
- kitchen overload,
- unavailable product after payment,
- delivery not serviceable,
- service mode disabled,
- impossible ETA,
- KDS offline,
- payment/quote mismatch.

Owner may Accept or Reject. Reject triggers refund flow.

## Fulfillment
Primary:
- DELIVERY
- PICKUP

Also support:
- STORE

## Kitchen authority
System recommends queue and timing.
Chef can:
- start prep,
- mark ready,
- change prep estimate,
- report problem,
- set temporary availability.

Chef cannot:
- accept/reject paid orders,
- refund,
- access CRM,
- override owner-disabled items,
- manually reorder queue.

## Availability priority
1. OWNER_DISABLED
2. STORE / DAYPART RULE
3. INGREDIENT DEPENDENCY
4. CHEF_TEMP_UNAVAILABLE
5. SYSTEM_CAPACITY_RULE
6. AVAILABLE

## Loyalty
- 1 Wave Point = ₹1
- Wave Member: 2%
- Silver Wave: 3 orders + ₹1,000 eligible spend / rolling 120d → 3%
- Gold Wave: 6 orders + ₹2,500 / rolling 120d → 4%
- Platinum Wave: 10 orders + ₹4,500 / rolling 120d → 5%
- downgrade grace: 30d
- point expiry: 180d
- minimum redemption: 50
- max redemption: 20% of eligible food subtotal
- points are PENDING until fulfillment completes
- 3 completed orders / rolling 30d → +25 bonus
- 5 completed orders / rolling 30d → +50 additional bonus

Owner cannot manually set tier.

## Founder principle
Founder manages exceptions, policy, complaints, exceptional refunds, and growth decisions. Routine work is automated.

## Auth realms
Customer: phone + WhatsApp OTP; persistent 30d session.
Owner: email/password + 2FA in production; shorter secure session.
KDS: trusted device + chef PIN; shift session.
Future Team: separate RBAC.
