import { loadHappyDelivery } from './happy-delivery'
import { loadOwnerReview } from './owner-review'
import { loadChefDelay } from './chef-delay'
import { loadUnavailableItem } from './unavailable-item'
import { loadReturningStoreMember } from './store-member'
import { loadComplaintRefund } from './complaint-refund'
import { loadPaymentFailure } from './payment-failure'
import { loadPaymentPending } from './payment-pending'
import { loadKdsOffline } from './kds-offline'
import type { ScenarioSummary } from './scenario.types'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'

const registry = {
  happyDelivery: loadHappyDelivery,
  ownerReview: loadOwnerReview,
  chefDelay: loadChefDelay,
  unavailableItem: loadUnavailableItem,
  returningStoreMember: loadReturningStoreMember,
  complaintRefund: loadComplaintRefund,
  paymentFailure: loadPaymentFailure,
  paymentPending: loadPaymentPending,
  kdsOffline: loadKdsOffline,
} as const

export type ScenarioId = keyof typeof registry
export const scenarioIds = Object.keys(registry) as ScenarioId[]

export async function loadScenario(id: ScenarioId): Promise<ScenarioSummary> {
  const summary = await registry[id]()
  await db.config.put({ key: 'activeScenario', value: id })
  eventBus.emit('DEMO_SCENARIO_LOADED', summary)
  return summary
}

export type { ScenarioSummary }
