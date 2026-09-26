# Order, Payment, Fulfillment and Scheduler

## Separate state dimensions

### payment_status
- NOT_STARTED
- PENDING
- CONFIRMED
- FAILED
- RECONCILING

### acceptance_status
- NOT_APPLICABLE
- AWAITING_ACCEPTANCE
- REVIEW_REQUIRED
- ACCEPTED
- REJECTED

### fulfillment_status
- NOT_STARTED
- SCHEDULED
- PREP_DUE
- PREPARING
- READY
- DISPATCHED
- PICKED_UP
- DELIVERED
- STORE_COMPLETED
- CANCELLED

### refund_status
- NONE
- REQUESTED
- APPROVED
- SUBMITTED
- PROCESSING
- SUCCESS
- FAILED
- REVIEW_REQUIRED

## Normal Delivery
```text
CART
→ ORDER_INTENT
→ PAYMENT_PENDING
→ PAYMENT_CONFIRMED
→ AWAITING_ACCEPTANCE
→ ACCEPTED
→ SCHEDULED
→ PREP_DUE
→ PREPARING
→ READY
→ DISPATCHED
→ DELIVERED
→ POINTS_AVAILABLE
```

## Normal Pickup
```text
CART
→ ORDER_INTENT
→ PAYMENT_CONFIRMED
→ ACCEPTED
→ SCHEDULED
→ PREPARING
→ READY
→ PICKED_UP
→ POINTS_AVAILABLE
```

## Rejection
```text
PAYMENT_CONFIRMED
→ REVIEW_REQUIRED
→ REJECTED
→ REFUND_REQUESTED
→ PROCESSING
→ SUCCESS
```

No KDS entry.

## Prototype PhonePe simulator
Outcomes:
- SUCCESS
- FAILURE
- PENDING

Success:
- 2 sec payment pending
- confirm mock backend

Failure:
- cart remains intact

Pending:
- show reconciling
- demo control resolves later

## Backend-authoritative rule
Frontend payment redirect is never final proof.
Only mocked backend status creates `PAYMENT_CONFIRMED`.

## Idempotency model
Reserve unique:
- merchant_order_id
- provider_transaction_id

Repeated success event must not create duplicate order.

## Scheduler input
- fulfillment type
- ASAP/scheduled
- product prep time
- order complexity
- station
- current kitchen load
- capacity
- delivery buffer
- packing buffer
- availability

## Product operational metadata
```text
prepMinutes
complexity
station: PIZZA | FRY | BEVERAGE | ASSEMBLY
```

## Simple prototype load logic
- 0–50% load: +0 min
- 51–75%: +5 min
- 76–90%: +10 min
- >90%: owner review

## Timing fields
```text
system_prep_minutes
chef_override_minutes
effective_prep_minutes
prep_start_at
actual_prep_started_at
target_ready_at
actual_ready_at
dispatch_target_at
promised_at
```

## Pickup slots
Only system-generated slots such as:
- 8:00–8:10
- 8:15–8:25
- 8:30–8:40

Never allow arbitrary free-text pickup times.

## Chef override
Chef may adjust timing with reason.
Backend recalculates:
- customer ETA
- downstream schedule
- owner state
- delay notification
- event log

## Delay thresholds
Prototype defaults:
- 3m late start → KDS warning
- 5m → ETA recalc
- 8m → customer delay message
- 10m+ → owner attention

Keep thresholds configurable.
