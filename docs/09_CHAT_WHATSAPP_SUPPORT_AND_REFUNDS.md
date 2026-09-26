# Chat, WhatsApp, Support, Cancellation and Refunds

## One conversation engine
Channels:
- PWA_CHAT
- WHATSAPP_SIM
- SYSTEM
- OWNER

Production later swaps WHATSAPP_SIM for real WhatsApp Business Platform.

## Guided entry options
- Order Food
- Track My Order
- Change / Cancel
- Report a Problem
- Offers & Wave Points
- Menu Question
- Refund Status
- Talk to Us

## Intent IDs
```text
START_ORDER
CHOOSE_DELIVERY
CHOOSE_PICKUP
VIEW_MENU
PRODUCT_QUESTION
CUSTOMIZE_PRODUCT
VIEW_CART
CHECKOUT
TRACK_ORDER
CANCEL_ORDER
CANCELLATION_STATUS
REPORT_PROBLEM
REFUND_REQUEST
REFUND_STATUS
LOYALTY_HELP
OFFER_HELP
TALK_TO_HUMAN
```

Use intent IDs, not visible button text, for logic.

## Conversational ordering
Chat may:
- select fulfillment
- browse category
- choose product
- customize
- build draft cart

Final:
`REVIEW & PAY` → secure PWA checkout → fake PhonePe.

## Auto-resolvable questions
System handles:
- order status
- ETA
- points
- tier
- product availability
- standard cancellation eligibility
- refund status
- store mode
- current offers from mock rules

## Complaint flow
Options:
- Wrong Item
- Food Quality
- Missing Item
- Damaged / Spilled
- Late Delivery
- Payment Issue
- Other

Case statuses:
- OPEN
- AUTO_RESOLVED
- FOUNDER_REVIEW
- WAITING_CUSTOMER
- RESOLVED
- CLOSED

## Escalate to owner
- food quality
- wrong item
- replacement
- post-prep cancellation
- unusual refund
- unresolved/unknown issue

Do not escalate routine status questions.

## Cancellation
Before prep:
- policy may auto-approve
- refund begins

After prep:
- owner review required

## Refund state
```text
REQUESTED
APPROVED
SUBMITTED
PROCESSING
SUCCESS
FAILED
REVIEW_REQUIRED
```

## Refund consequences
One owner action should:
1. create refund
2. simulate provider processing
3. update order financial state
4. reverse points if applicable
5. notify customer
6. update CRM timeline
7. escalate only if fake refund fails

## Automated milestone messages
- Payment received
- Order accepted
- Meaningful delay
- Ready for pickup
- Dispatched
- Completed + points
- Refund started
- Refund completed

Avoid messaging every kitchen micro-state.
