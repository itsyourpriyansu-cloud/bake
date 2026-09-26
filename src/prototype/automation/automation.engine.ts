import { db } from '../database/db'
import { expireAvailabilityOverrides } from '../../domain/availability/availability.engine'
import { eventBus } from '../events/event-bus'
import { createId } from '../../domain/shared/ids'
import { processRefundAutomation } from '../services/refund-automation'
import { runCelebrationAutomation } from '../services/retention-automation'

/**
 * Sweep run periodically (see jobs.ts) so temporary chef/owner availability overrides and
 * stale order intents clear themselves without any UI interaction — mirrors what a backend
 * cron/worker would do in production.
 */
export async function runAutomationSweep(now: Date): Promise<void> {
  const records = await db.availability.toArray()
  const live = expireAvailabilityOverrides(records, now)
  if (live.length !== records.length) {
    const expiredIds = records.filter((record) => !live.includes(record)).map((record) => record.id)
    await db.availability.bulkDelete(expiredIds)
    eventBus.emit('AVAILABILITY_CHANGED', { expiredIds })
  }

  const intents = await db.orderIntents.where('status').equals('OPEN').toArray()
  const expired = intents.filter((intent) => new Date(intent.expiresAt) <= now)
  for (const intent of expired) await db.orderIntents.update(intent.id, { status: 'EXPIRED' })

  const scheduled = (await db.orders.where('fulfillmentStatus').equals('SCHEDULED').toArray()).filter((order) => order.prepStartAt && new Date(order.prepStartAt) <= now)
  for (const order of scheduled) {
    await db.orders.update(order.id, { fulfillmentStatus: 'PREP_DUE', recommendedStartAt: order.prepStartAt })
    await db.orderEvents.add({ id: createId('EVT-ORDER'), orderId: order.id, type: 'PREP_DUE', actor: 'SYSTEM', at: now.toISOString() })
    eventBus.emit('PREP_DUE', { recommendedStartAt: order.prepStartAt }, { orderId: order.id, customerId: order.customerId })
  }

  const requestedRefunds = await db.refunds.where('status').equals('REQUESTED').toArray()
  for (const refund of requestedRefunds) await processRefundAutomation(refund, now)
  await runCelebrationAutomation(now)
}
