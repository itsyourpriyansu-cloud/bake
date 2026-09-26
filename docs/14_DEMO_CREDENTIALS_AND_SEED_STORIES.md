# Demo Credentials and Seed Stories

## Prototype-only credentials
Never reuse in production.

### Customer
Phone:
`9876543210`

OTP:
`123456`

Seed customer:
- Priyanshu
- Gold Wave
- 182 available
- 19 pending
- 8 qualifying orders / 120d
- ₹3,620 qualifying spend

### Owner
Email:
`owner@pizzawave.demo`

Password:
`PizzaWave@123`

Prototype 2FA:
`654321`

### KDS
Chef PIN:
`2580`

Trusted device:
`Kitchen Tablet #1`

## Payment simulator
Must support:
- Success
- Failure
- Pending

Suggested pitch total:
`₹486`

## Required seed stories

### Story A — Happy Delivery
- paid
- auto-accepted
- KDS
- chef starts
- customer sees preparing
- chef marks ready
- dispatch
- complete
- points available

### Story B — Owner Review
- paid
- capacity conflict
- owner must Accept or Reject

### Story C — Chef Delay
- chef changes +10 min
- customer ETA updates
- owner sees change
- simulated WhatsApp delay message

### Story D — Product Unavailable
- chef disables Mushroom for 60 min
- customer menu updates
- existing cart gets revalidation dialog

### Story E — Returning In-Store Member
- open Wave ID
- owner scans
- Gold account linked
- store order built
- fake PhonePe
- same loyalty wallet updated

### Story F — Complaint
- customer selects Missing Item
- case created
- owner gets Needs Your Attention
- owner chooses simulated item refund
- refund updates customer conversation

### Story G — Payment Failure
- payment fails
- no real order
- nothing enters KDS
- cart remains

## Demo reset
Development-only `Reset Demo Data` restores every seed.
