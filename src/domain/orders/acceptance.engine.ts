import type { Capabilities } from '../store/store.types'
import type { CartQuote } from '../pricing/pricing.types'
import type { CartAvailabilityIssue } from '../availability/availability.engine'
import { scheduleOrder } from '../fulfillment/scheduler'
import type { ScheduleInput, ScheduleOutput } from '../fulfillment/fulfillment.types'

export type AcceptanceDecision = 'AUTO_ACCEPT' | 'OWNER_REVIEW' | 'REJECT'

export interface AcceptanceEvaluationInput {
  paymentConfirmed: boolean
  capabilities: Capabilities
  fulfillmentType: 'DELIVERY' | 'PICKUP' | 'STORE'
  availabilityIssues: CartAvailabilityIssue[]
  kdsOnline: boolean
  quote: CartQuote
  acceptanceMode: 'AUTO' | 'HYBRID' | 'MANUAL'
  schedule: Omit<ScheduleInput, 'fulfillmentType'>
}

export interface AcceptanceResult {
  decision: AcceptanceDecision
  reasons: string[]
  recommendation: ScheduleOutput
}

/**
 * evaluateOrderAcceptance — the only function allowed to decide whether a paid order goes
 * straight to the kitchen (AUTO_ACCEPT), waits for a founder call (OWNER_REVIEW), or is
 * rejected outright before it ever reaches KDS.
 */
export function evaluateOrderAcceptance(input: AcceptanceEvaluationInput): AcceptanceResult {
  const reasons: string[] = []
  const schedule = scheduleOrder({ ...input.schedule, fulfillmentType: input.fulfillmentType })

  if (!input.paymentConfirmed) {
    reasons.push('Payment is not confirmed.')
    return { decision: 'REJECT', reasons, recommendation: schedule }
  }
  if (!input.capabilities.storeOpen) reasons.push('Store is closed.')
  const fulfillmentEnabled = input.fulfillmentType === 'DELIVERY' ? input.capabilities.delivery.enabled
    : input.fulfillmentType === 'PICKUP' ? input.capabilities.pickup.enabled : input.capabilities.storeOrder.enabled
  if (!fulfillmentEnabled) reasons.push(`${input.fulfillmentType} is not currently enabled.`)
  if (!input.kdsOnline) reasons.push('Kitchen display system is offline.')
  if (!input.quote.valid) reasons.push('Cart quote is no longer valid.')
  for (const issue of input.availabilityIssues) reasons.push(`${issue.productName}: ${issue.reason}`)

  const hardBlockers = !input.capabilities.storeOpen || !fulfillmentEnabled || !input.kdsOnline || !input.quote.valid || input.availabilityIssues.length > 0
  if (hardBlockers) return { decision: 'REJECT', reasons, recommendation: schedule }

  if (schedule.reviewRequired) {
    reasons.push(schedule.reviewReason ?? 'Kitchen capacity requires founder review.')
    return { decision: 'OWNER_REVIEW', reasons, recommendation: schedule }
  }

  if (input.acceptanceMode === 'MANUAL') {
    reasons.push('Store is set to manual acceptance for every order.')
    return { decision: 'OWNER_REVIEW', reasons, recommendation: schedule }
  }

  return { decision: 'AUTO_ACCEPT', reasons, recommendation: schedule }
}
