import { http } from 'msw'
import { API, boot, getCapabilities, getStoreConfig, json, saveStoreConfig } from './_shared'
import type { StoreConfig } from '../../../domain/store/store.types'
import { eventBus } from '../../events/event-bus'

export const configHandlers = [
  http.get(`${API}/capabilities`, async () => { await boot(); return json(await getCapabilities()) }),

  http.get(`${API}/config/store`, async () => { await boot(); return json(await getStoreConfig()) }),

  http.patch(`${API}/config/store`, async ({ request }) => {
    await boot()
    const patch = await request.json() as Partial<StoreConfig>
    const current = await getStoreConfig()
    const next = { ...current, ...patch }
    await saveStoreConfig(next)
    eventBus.emit('CAPABILITIES_CHANGED', patch)
    return json(next)
  }),

  /** Legacy Stage-1 shortcut kept for the current DemoToolbar; patches capability-affecting flags directly. */
  http.patch(`${API}/demo/capabilities`, async ({ request }) => {
    await boot()
    const patch = await request.json() as Partial<Pick<StoreConfig, 'deliveryEnabled' | 'pickupEnabled' | 'isOpen' | 'kdsOnline'>>
    const current = await getStoreConfig()
    const next = { ...current, ...patch }
    await saveStoreConfig(next)
    eventBus.emit('CAPABILITIES_CHANGED', patch)
    return json(await getCapabilities())
  }),
]
