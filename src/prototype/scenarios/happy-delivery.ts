import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import type { ScenarioSummary } from './scenario.types'

export async function loadHappyDelivery(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  return {
    id: 'happyDelivery', title: 'Happy Delivery', appliedAt: demoClock.now().toISOString(),
    description: 'Clean slate: store open, delivery + pickup enabled, KDS online, kitchen load normal. The next paid order auto-accepts.',
  }
}
