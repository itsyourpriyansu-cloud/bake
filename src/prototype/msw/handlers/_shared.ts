import { HttpResponse } from 'msw'
import { db } from '../../database/db'
import { deriveCapabilities } from '../../../domain/store/capability.engine'
import { demoClock } from '../../../domain/shared/clock'
import { eventBus } from '../../events/event-bus'
import { createId } from '../../../domain/shared/ids'
import type { Capabilities, StoreConfig } from '../../../domain/store/store.types'
import type { Order, OrderEventType } from '../../../domain/orders/order.types'
import { ensureDemoDatabase } from '../../demo/reset-demo'

/** Orders actively occupying kitchen capacity for scheduler load-percent purposes. */
export const ACTIVE_KITCHEN_STATUSES: Order['fulfillmentStatus'][] = ['SCHEDULED', 'PREP_DUE', 'PREPARING']

export const API = '*/api/v1'
export const json = <T,>(value: T, status = 200) => HttpResponse.json(value as never, { status })
export const error = (message: string, status = 400) => HttpResponse.json({ message } as never, { status })

let bootInFlight: Promise<void> | null = null

/**
 * Every customer query can arrive together on the first render. Keep the seed/migration
 * transaction single-flight so parallel handlers cannot all decide the database is empty
 * and reset it over one another. The reference is released after each check so a later
 * cleared or upgraded database can still repair itself.
 */
export async function boot(): Promise<void> {
  if (bootInFlight) return bootInFlight
  const currentBoot = ensureDemoDatabase()
  bootInFlight = currentBoot
  try {
    await currentBoot
  } finally {
    if (bootInFlight === currentBoot) bootInFlight = null
  }
}

export async function getStoreConfig(): Promise<StoreConfig> {
  const record = await db.config.get('storeConfig')
  return record?.value as StoreConfig
}

export async function saveStoreConfig(config: StoreConfig): Promise<void> {
  await db.config.put({ key: 'storeConfig', value: config })
  await db.config.put({ key: 'capabilities', value: deriveCapabilities(config) })
}

export async function getCapabilities(): Promise<Capabilities> {
  const record = await db.config.get('capabilities')
  if (record) return record.value as Capabilities
  const config = await getStoreConfig()
  const capabilities = deriveCapabilities(config)
  await db.config.put({ key: 'capabilities', value: capabilities })
  return capabilities
}

export async function nextOrderSequence(): Promise<number> {
  const record = await db.config.get('orderSequence')
  const next = ((record?.value as number) ?? 0) + 1
  await db.config.put({ key: 'orderSequence', value: next })
  return next
}

export async function logOrderEvent(orderId: string, type: OrderEventType, actor: 'CUSTOMER' | 'OWNER' | 'CHEF' | 'SYSTEM', metadata?: Record<string, unknown>) {
  const now = demoClock.now()
  await db.orderEvents.add({ id: createId('EVT-ORDER'), orderId, type, actor, at: now.toISOString(), metadata })
  eventBus.emit(type, metadata, { orderId })
}

export function now() {
  return demoClock.now()
}

/** Same load count the auto-accept path uses — owner manual-accept must see the same kitchen reality. */
export async function getActiveKitchenOrderCount(): Promise<number> {
  const override = await getDemoKitchenLoadPercent()
  if (override !== undefined) {
    const store = await getStoreConfig()
    return Math.ceil(override / 100 * store.kitchenCapacityCount)
  }
  const orders = await db.orders.toArray()
  return orders.filter((order) => ACTIVE_KITCHEN_STATUSES.includes(order.fulfillmentStatus)).length
}

export async function getDemoKitchenLoadPercent(): Promise<number | undefined> {
  const record = await db.config.get('demoKitchenLoadPercent')
  return typeof record?.value === 'number' ? record.value : undefined
}

/** One-shot flag scenarios set to steer the very next payment (see scenarios/payment-failure.ts etc). */
export async function getAndClearNextPaymentOutcome(): Promise<'AUTO_CONFIRM' | 'STAY_PENDING' | 'FAIL'> {
  const record = await db.config.get('nextPaymentOutcome')
  if (record) await db.config.delete('nextPaymentOutcome')
  return (record?.value as 'AUTO_CONFIRM' | 'STAY_PENDING' | 'FAIL' | undefined) ?? 'AUTO_CONFIRM'
}
