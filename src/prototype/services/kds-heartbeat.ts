import { createAttentionItem, resolveAttentionItem } from '../../domain/attention/attention.engine'
import { deriveCapabilities } from '../../domain/store/capability.engine'
import type { StoreConfig } from '../../domain/store/store.types'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'

export async function setKdsHeartbeat(online: boolean, at: Date) {
  const record = await db.config.get('storeConfig')
  const current = record?.value as StoreConfig
  const next = { ...current, kdsOnline: online }
  await db.config.put({ key: 'storeConfig', value: next })
  await db.config.put({ key: 'capabilities', value: deriveCapabilities(next) })
  await db.config.put({ key: 'kdsHeartbeat', value: { online, device: 'Kitchen Tablet #1', lastSeenAt: at.toISOString() } })
  const openAlerts = (await db.attentionItems.where('type').equals('KDS_OFFLINE').toArray()).filter((item) => !item.resolvedAt)
  if (online) {
    await Promise.all(openAlerts.map((item) => db.attentionItems.put(resolveAttentionItem(item, at))))
  } else if (!openAlerts.length) {
    await db.attentionItems.add(createAttentionItem('KDS_OFFLINE', 'Kitchen display is offline', 'Kitchen Tablet #1 stopped sending its trusted-device heartbeat.', 'Restore the KDS shift before accepting more paid orders.', at))
  }
  eventBus.emit('KDS_ONLINE_CHANGED', { kdsOnline: online, device: 'Kitchen Tablet #1' })
  eventBus.emit('ATTENTION_CHANGED', { type: 'KDS_OFFLINE', online })
  return { online, device: 'Kitchen Tablet #1' as const, lastSeenAt: at.toISOString() }
}
