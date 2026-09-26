import { db } from '../database/db'
import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import type { ScenarioSummary } from './scenario.types'

export async function loadPaymentFailure(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  await db.config.put({ key: 'nextPaymentOutcome', value: 'FAIL' })
  return {
    id: 'paymentFailure', title: 'Payment Failure', appliedAt: demoClock.now().toISOString(),
    description: 'The next payment initiated will fail at the provider. No order is created — the cart remains untouched for retry.',
  }
}
