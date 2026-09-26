# Automation, CRM, Events and Data Management

## Automation goal
Normal day:
customer pays → system verifies → system accepts safe order → scheduler → chef → customer updates → completion → loyalty/CRM.

Founder does nothing.

Exception:
system detects problem → Needs Your Attention → founder makes one decision → system executes consequences.

## Fully automated
- payment state/reconciliation
- safe hybrid acceptance
- kitchen scheduling
- ETA recalculation
- customer order progress
- milestone messaging
- temporary availability expiry
- cart revalidation
- loyalty earning
- tiering
- frequency bonus
- point expiry
- point reversal
- CRM tagging
- segmentation
- daily summary
- weekly summary
- routine support answers
- refund reconciliation

## Owner exception types
```text
ORDER_REVIEW
SEVERE_DELAY
PAYMENT_ISSUE
REFUND_FAILURE
COMPLAINT
KDS_OFFLINE
AVAILABILITY_CONFLICT
```

## KDS heartbeat
Prototype supports demo online/offline toggle.
- offline >2m → owner alert
- extended offline → pause safe auto-accept

## Customer lifecycle
Stage:
- NEW
- FIRST_ORDER
- SECOND_ORDER
- REPEAT
- LOYAL
- VIP

Activity:
- ACTIVE
- AT_RISK
- DORMANT

Prototype:
- Active: <=14d since order
- At Risk: 15–30d
- Dormant: >30d

Tier is separate from stage/activity.

## CRM segments
- New
- Second Order Pending
- Repeat
- Silver
- Gold
- Platinum
- Near Gold
- Near Platinum
- Dormant Gold
- Dormant Platinum
- Points Expiring
- High AOV
- Delivery Regular
- Pickup Regular
- In-store Regular
- Cross-channel
- Pizza Lover
- Weekend Buyer
- Birthday Upcoming

## Events
Important operational events:
```text
PAYMENT_CONFIRMED
ORDER_REVIEW_REQUIRED
ORDER_ACCEPTED
ORDER_REJECTED
FULFILLMENT_SCHEDULED
PREP_DUE
PREP_STARTED
PREP_TIME_OVERRIDDEN
ORDER_READY
ORDER_DISPATCHED
ORDER_COMPLETED
CANCELLATION_REQUESTED
REFUND_REQUESTED
REFUND_COMPLETED
COMPLAINT_CREATED
COMPLAINT_RESOLVED
AVAILABILITY_CHANGED
TIER_CHANGED
POINTS_CREDITED
```

## Data layers
### Transactional source of truth
- customers
- payments
- orders
- loyalty
- refunds

### Event history
- order_events
- payment_events
- support_events
- campaign_events
- audit_logs

### Derived/rebuildable
- customer_stats
- segments
- recommendations
- kitchen metrics
- dashboard aggregates

## Owner daily summary
Auto-generated demo:
- revenue
- orders
- repeat %
- AOV
- complaints
- refunds
- peak hour
- most ordered product
- tier upgrades
- reactivation opportunities

## Weekly summary
- revenue trend
- retention
- first→second conversion
- tier movement
- refund rate
- complaint rate
- kitchen prep average
- ETA accuracy
- campaign performance
