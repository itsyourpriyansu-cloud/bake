import type { Referral } from '../../domain/retention/retention.types'

const createdAt = '2026-08-18T10:00:00.000Z'

/** One deterministic row for every documented state makes the pitch flow inspectable. */
export const referralSeed: Referral[] = [
  { id: 'REF-INVITED', referrerCustomerId: 'CUST001', friendName: 'Riya', maskedPhone: '•••• 1042', status: 'INVITED', rewardPoints: 0, createdAt, updatedAt: createdAt },
  { id: 'REF-SIGNED', referrerCustomerId: 'CUST001', friendName: 'Kabir', maskedPhone: '•••• 2271', status: 'SIGNED_UP', rewardPoints: 0, createdAt, updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: 'REF-PENDING', referrerCustomerId: 'CUST001', referredCustomerId: 'CUST002', friendName: 'Mira', maskedPhone: '•••• 4480', status: 'FIRST_ORDER_PENDING', rewardPoints: 0, createdAt, updatedAt: '2026-08-24T10:00:00.000Z' },
  { id: 'REF-QUALIFIED', referrerCustomerId: 'CUST001', friendName: 'Arjun', maskedPhone: '•••• 7615', status: 'QUALIFIED', rewardPoints: 0, createdAt, updatedAt: '2026-09-01T10:00:00.000Z', qualifiedAt: '2026-09-01T10:00:00.000Z' },
  { id: 'REF-REWARDED', referrerCustomerId: 'CUST001', friendName: 'Diya', maskedPhone: '•••• 8934', status: 'REWARDED', rewardPoints: 60, createdAt, updatedAt: '2026-09-06T10:00:00.000Z', qualifiedAt: '2026-09-05T10:00:00.000Z', rewardedAt: '2026-09-06T10:00:00.000Z' },
]
