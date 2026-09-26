import type { LoyaltyTransaction, TierStatus } from '../../domain/loyalty/loyalty.types'

export const loyaltyTransactionSeed: LoyaltyTransaction[] = [
  { id: 'LOY-SEED-001', customerId: 'CUST001', orderId: 'ORDER-HIST-001', type: 'EARN_AVAILABLE', status: 'AVAILABLE', points: 9, createdAt: '2026-09-02T18:40:00.000Z', expiresAt: '2027-03-01T18:40:00.000Z' },
  { id: 'LOY-SEED-002', customerId: 'CUST001', orderId: 'ORDER-HIST-002', type: 'EARN_AVAILABLE', status: 'AVAILABLE', points: 13, createdAt: '2026-08-24T13:40:00.000Z', expiresAt: '2027-02-20T13:40:00.000Z' },
  { id: 'LOY-SEED-003', customerId: 'CUST001', type: 'BONUS', status: 'AVAILABLE', points: 167, createdAt: '2026-07-01T09:00:00.000Z', expiresAt: '2026-12-28T09:00:00.000Z', note: 'Welcome Wave balance' },
  { id: 'LOY-SEED-FREQUENCY', customerId: 'CUST001', type: 'BONUS', status: 'AVAILABLE', points: 25, createdAt: '2026-09-02T18:41:00.000Z', expiresAt: '2027-03-01T18:41:00.000Z', note: 'Frequency bonus' },
  { id: 'LOY-SEED-REDEEM', customerId: 'CUST001', orderId: 'ORDER-PW1321', type: 'REDEEM', status: 'REDEEMED', points: -50, createdAt: '2026-08-30T19:10:00.000Z', note: 'Redeemed on PW1321' },
  { id: 'LOY-SEED-PICKUP', customerId: 'CUST001', orderId: 'ORDER-PW1298', type: 'EARN_AVAILABLE', status: 'AVAILABLE', points: 18, createdAt: '2026-08-12T13:40:00.000Z', expiresAt: '2027-02-08T13:40:00.000Z', note: 'Pickup order' },
  { id: 'LOY-SEED-004', customerId: 'CUST001', orderId: 'ORDER-ACTIVE-1384', type: 'EARN_PENDING', status: 'PENDING', points: 24, createdAt: '2026-09-10T12:08:00.000Z', note: 'Available when PW1384 is delivered' },
]

export const tierStatusSeed: TierStatus[] = [
  { customerId: 'CUST001', tier: 'GOLD', since: '2026-06-15T00:00:00.000Z' },
]
