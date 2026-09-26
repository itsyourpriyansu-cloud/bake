import type { ScheduleInput, ScheduleOutput } from './fulfillment.types'

function pickupStart(slot: string | undefined, now: Date): Date | undefined {
  const match = slot?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return undefined
  let hour = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hour += 12
  const result = new Date(now)
  result.setHours(hour, Number(match[2]), 0, 0)
  if (result <= now) result.setDate(result.getDate() + 1)
  return result
}

/**
 * Pure and deterministic given its inputs (no Date.now() reads) so it stays unit-testable
 * and reusable by both the acceptance engine and KDS "what if" previews.
 *
 * Load bands (percent of kitchenCapacityCount currently active):
 *   0-50%   -> +0 min
 *   51-75%  -> +5 min
 *   76-90%  -> +10 min
 *   >90%    -> reviewRequired = true (Owner Review), no auto schedule promise
 */
export function scheduleOrder(input: ScheduleInput): ScheduleOutput {
  const basePrepMinutes = Math.max(...input.items.map((item) => item.prepMinutes), 0)
  const complexityMinutes = input.items.reduce((total, item) => total + (item.complexity - 1) * item.quantity, 0)
  const loadPercent = input.kitchenCapacityCount > 0 ? Math.round((input.activeOrderCount / input.kitchenCapacityCount) * 100) : 0

  let loadPadding = 0
  let reviewRequired = false
  let reviewReason: string | undefined
  if (loadPercent > 90) {
    reviewRequired = true
    reviewReason = `Kitchen load at ${loadPercent}% exceeds safe auto-accept threshold.`
  } else if (loadPercent > 75) {
    loadPadding = 10
  } else if (loadPercent > 50) {
    loadPadding = 5
  }

  const systemPrepMinutes = basePrepMinutes + complexityMinutes + loadPadding + input.packingMinutes
  const scheduledPickupAt = input.fulfillmentType === 'PICKUP' ? pickupStart(input.pickupSlot, input.now) : undefined
  const targetReadyAt = scheduledPickupAt
    ? new Date(scheduledPickupAt.getTime() - input.pickupBufferMinutes * 60_000)
    : new Date(input.now.getTime() + systemPrepMinutes * 60_000)
  const prepStartAt = scheduledPickupAt
    ? new Date(targetReadyAt.getTime() - systemPrepMinutes * 60_000)
    : input.now

  let dispatchTargetAt: Date | undefined
  let promiseWindowStart: Date
  let promiseWindowEnd: Date

  if (input.fulfillmentType === 'DELIVERY') {
    dispatchTargetAt = new Date(targetReadyAt.getTime() + input.deliveryBufferMinutes * 60_000)
    promiseWindowStart = new Date(dispatchTargetAt.getTime())
    promiseWindowEnd = new Date(dispatchTargetAt.getTime() + 15 * 60_000)
  } else {
    promiseWindowStart = scheduledPickupAt ?? new Date(targetReadyAt.getTime() + input.pickupBufferMinutes * 60_000)
    promiseWindowEnd = new Date(promiseWindowStart.getTime() + 10 * 60_000)
  }

  return {
    systemPrepMinutes, prepStartAt: prepStartAt.toISOString(), targetReadyAt: targetReadyAt.toISOString(),
    dispatchTargetAt: dispatchTargetAt?.toISOString(),
    promiseWindowStart: promiseWindowStart.toISOString(), promiseWindowEnd: promiseWindowEnd.toISOString(),
    loadPercent, reviewRequired, reviewReason,
  }
}
