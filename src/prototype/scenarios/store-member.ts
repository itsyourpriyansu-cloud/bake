import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import type { ScenarioSummary } from './scenario.types'

export async function loadReturningStoreMember(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  return {
    id: 'returningStoreMember', title: 'Returning Store Member', appliedAt: demoClock.now().toISOString(),
    description: 'Priyanshu (CUST001), Gold Wave, 182 available points, waveId WAVE-CUST001. Use My Wave ID or phone 9876543210 + OTP 123456 to link an in-store order.',
  }
}
