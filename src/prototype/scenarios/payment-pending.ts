import { db } from '../database/db'
import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import type { ScenarioSummary } from './scenario.types'

export async function loadPaymentPending(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  await db.config.put({ key: 'nextPaymentOutcome', value: 'STAY_PENDING' })
  return {
    id: 'paymentPending', title: 'Payment Pending', appliedAt: demoClock.now().toISOString(),
    description: 'The next payment initiated stays PENDING (simulating a slow UPI confirmation) until resolved via the payment status/confirm endpoint.',
  }
}
