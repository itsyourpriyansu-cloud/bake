# KDS — Exactly 3 Screens

## Role principle
System recommends.
Chef controls kitchen reality.
Founder controls commercial policy.

## Screen 1 — Kitchen Queue
Route: `/kds`

Sections:
- START NOW
- START SOON
- PREPARING
- READY

Cards show:
- order number
- Delivery/Pickup/Store
- recommended start
- target ready
- timer/risk
- item summary

Actions:
- Start Prep
- Open Order

No drag/reorder.

## Screen 2 — Order Preparation
Route: `/kds/order/:orderId`

Show:
- order
- fulfillment
- target ready
- remaining time
- items
- variants
- modifiers
- kitchen note
- system prep estimate
- effective prep estimate

Actions:
- Start Prep
- Keep Estimate
- +5 min
- +10 min
- Custom
- Report Problem
- Mark Ready

Critical modifiers must be visually dominant:
- NO ONION
- NO MUSHROOM
- EXTRA CHEESE

### Timing override
Store:
```text
system_prep_minutes
chef_override_minutes
effective_prep_minutes
override_reason
override_by
override_at
```

Changing timing automatically updates:
- customer ETA
- owner dashboard
- downstream queue
- meaningful WhatsApp delay message
- audit/event history

## Screen 3 — Availability
Route: `/kds/availability`

Chef can temporarily disable:
- product
- variant
- modifier

Duration:
- 30 min
- 60 min
- rest of today
- until manually enabled

Chef cannot re-enable OWNER_DISABLED.

## Report Problem
- Ingredient unavailable
- Kitchen delay
- Equipment issue
- Other

Creates owner attention only when needed.

## KDS Auth
Prototype:
- trusted device
- chef PIN
- fake 12-hour shift session

Chef has no CRM, refund, acceptance, or price control.
