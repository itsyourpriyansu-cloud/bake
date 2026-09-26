import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import { getStoreConfig, saveStoreConfig } from '../msw/handlers/_shared'
import { createAttentionItem } from '../../domain/attention/attention.engine'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'
import type { ScenarioSummary } from './scenario.types'

export async function loadKdsOffline(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  const now = demoClock.now()
  const config = await getStoreConfig()
  await saveStoreConfig({ ...config, kdsOnline: false })
  eventBus.emit('KDS_ONLINE_CHANGED', { kdsOnline: false })
  await db.attentionItems.add(createAttentionItem('KDS_OFFLINE', 'Kitchen display is offline', 'The KDS device has not been trusted-device signed in.', 'Ask the chef to sign back in on Kitchen Tablet #1.', now))
  return {
    id: 'kdsOffline', title: 'KDS Offline', appliedAt: now.toISOString(),
    description: 'Kitchen display is marked offline. New paid orders are rejected until KDS comes back online.',
  }
}
