# Customer PWA Screen Specification

## Global shell
Header:
```text
DELIVERY TO / PICKUP FROM / AT PIZZA WAVE
location/context
                         GOLD · 182
```

Bottom nav:
Home / Menu / Rewards / Orders / You

Floating cart:
`3 items · ₹648 →`

## 1. Home
Guest:
- fulfillment selector
- search
- dynamic hero
- Popular in Puri
- Pizza Under ₹199
- Kulhad Pizza
- Build Your Pizza
- Best Sellers
- Group Deals

Returning customer:
- Your Usual
- points summary
- next tier progress
- recommendations
- relevant offer
- saved order
- referral teaser

Active order:
replace major campaign hero with current order status.

## 2. Fulfillment Selector
Bottom sheet:
- Delivery
- Pickup

If switching with cart, preserve items and re-quote. Warn only if offer/fee changes.

## 3. Menu
- sticky categories
- smart collections
- fast-add product cards
- cutout imagery
- badges: Bestseller / New / Veg / Spicy / Wave Exclusive / Customizable

Smart collections:
- Under ₹199
- Best Sellers
- Veg Favourites
- Cheese Lovers
- For Two
- Family
- Quick Bites
- Something Sweet

## 4. Search
Demo matching for paneer, cheese, veg, spicy, shake, combo, chicken, under ₹200.

## 5. Product Detail
- image
- title
- short description
- price
- variant/modifier groups
- pair-with suggestions
- points preview
- sticky Add to Cart

## 6. Build Your Pizza
Steps:
1. Size
2. Base
3. Sauce
4. Cheese
5. Toppings
6. Spice
7. Complete the Meal

Show live price and validation.

## 7. Cart
- items
- edit modifiers
- smart add-ons
- one meaningful threshold
- loyalty status
- points redemption
- offer
- bill
- checkout CTA

## 8. Auth
Fake WhatsApp OTP:
- phone
- Send OTP
- OTP
- success

Prototype OTP: `123456`

Browsing remains guest-accessible.

## 9. Checkout
Three visible stages:
`DETAILS → PAYMENT → DONE`

Delivery:
- address
- instructions
- ETA
- PhonePe

Pickup:
- generated pickup slot
- phone
- note
- PhonePe

## 10. Payment Verification
States:
- checking
- confirmed
- failed
- reconciling

Do not say “Order confirmed” before acceptance.

## 11. Awaiting Acceptance
After successful fake payment:
```text
PAYMENT RECEIVED ✓
We're confirming your order with Pizza Wave…
```

Accepted:
`ORDER CONFIRMED`

Rejected:
`WE COULDN'T ACCEPT THIS ORDER — REFUND STARTED`

## 12. Order Tracking
Customer stages:
- Payment received
- Order accepted
- Kitchen scheduled
- Preparing
- Ready
- On the way / Ready for pickup
- Completed

Show live ETA, pending points, help.

## 13. Rewards
- tier card
- available points
- pending points
- next-tier progress
- monthly frequency bonus
- benefits
- point history

## 14. My Wave ID
- dynamic demo QR
- 60-second refresh
- first name
- tier
- points

## 15. Orders
Tabs: Active / Past
Reorder button on completed orders.

## 16. Saved Orders / Favourites
Support named bundles such as “Saturday Night” or “My Usual”.

## 17. Referral
`Give ₹50. Get 60 Wave Points.`

## 18. Celebrations
Birthday / Anniversary / Custom with relation and date.

## 19. Family
Store demo preferences per person.

## 20. Profile
- summary
- tier
- Wave ID
- preferences
- addresses
- family
- celebrations
- notification preferences
- support
- logout

## 21. Support
Guided options:
- Order Food
- Track My Order
- Change / Cancel
- Report a Problem
- Offers & Wave Points
- Menu Question
- Refund Status
- Talk to Us

## Required UX states
- empty cart
- no favourites
- no orders
- no rewards
- item unavailable
- delivery paused
- pickup paused
- payment failed
- payment pending
- offline
- delay
- refund pending
