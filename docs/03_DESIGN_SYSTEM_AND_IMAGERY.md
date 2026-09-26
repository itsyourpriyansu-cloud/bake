# Design System and Imagery

## Brand principle
**Brand loud. Commerce quiet.**

Marketing surfaces can be expressive. Ordering, checkout, payment, tracking, owner operations, and KDS must remain calm and easy to understand.

## Colors
```css
--wave-orange: #FD7E3B;
--wave-burgundy: #4D0711;
--wave-yellow: #FDCC3B;
--wave-sky: #8BDFFA;
--wave-pink: #FAAEDC;
--wave-green: #C1CC52;
--wave-red: #BD1F17;
--wave-cream: #FEFEF6;
```

Use Cream for main app background, Burgundy for text/structure/primary CTA, Orange as brand accent, and secondary colors for campaigns/categories/rewards.

Avoid glassmorphism, neon, heavy gradients, generic AI-SaaS styling.

## Typography
Display: **Phudu**
UI/body: **Poppins**

Mobile scale:
- Hero 40–44px
- H1 34px
- H2 28px
- H3 22px
- Body 15–16px
- Small 13–14px
- Label 12–13px

## Radius
- 10px small
- 14px inputs
- 16px buttons
- 18px compact cards
- 24px standard cards
- 28–32px editorial cards
- 999px only for pills

## Motion
- micro 120–180ms
- cards 180–240ms
- bottom sheets 240–320ms
- reward moments 450–650ms

Use motion for add-to-cart, progress, reward count, tier-up, order-state transitions. Do not use scroll hijacking or long GSAP storytelling inside ordering flows.

## Functional icons
Use Lucide React:
- Home
- Search
- ShoppingBag
- Plus / Minus
- Heart
- MapPin
- Bike
- Store
- Clock
- Gift
- ReceiptText
- UserRound
- Bell
- ShieldCheck
- CakeSlice
- UsersRound
- SlidersHorizontal

Custom branded pictograms only for:
- Wave Points
- Build Pizza
- Referral
- Celebration
- Membership

## Image families
1. Product cutouts
2. Macro food imagery
3. Human lifestyle imagery
4. Subtle Puri/local lifestyle imagery

### Product cutout requirements
- real-looking menu item
- consistent camera angle
- clean edges
- same lighting direction
- no embedded text
- no fake impossible ingredients
- 1:1 master preferred

### Macro imagery
- cheese pull
- crust
- paneer
- mushroom/cheese
- peri fries
- kulhad cheese
- shake
- brownie

### Lifestyle
- students/friends
- family
- birthday group
- pickup customer
- subtle local/Puri context

## Color pairing
- Veg → Leaf Green
- Drinks → Sky
- Dessert/Celebration → Pink
- Value → Yellow
- Spicy → Red
- Main campaign → Orange
- Loyalty premium → Burgundy
- Commerce UI → Cream

## Dialog system
Use bottom sheets for:
- fulfillment
- modifiers
- addresses
- filters
- reward redemption
- support choices

Use center dialogs for:
- cancel
- reject
- refund
- destructive actions

Use full-screen flows for:
- pizza builder
- checkout
- payment verification
- order tracking

Every dialog:
1. short headline
2. 1–2 sentence explanation
3. primary action
4. secondary action

## Image asset manifest
Generate or source:
- 4 customer-home hero assets
- 12 product cutouts
- 8 macro images
- 5 lifestyle images
- simple loyalty/placeholder line illustrations

Asset path:
```text
/public/assets/
  brand/
  hero/
  products/
  macro/
  lifestyle/
  loyalty/
  placeholders/
```
