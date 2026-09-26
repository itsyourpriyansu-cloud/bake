import { http } from 'msw'
import { db } from '../../database/db'
import { getEffectiveAvailability, setChefTemporaryAvailability, setOwnerAvailability, type ChefUnavailableDuration } from '../../../domain/availability/availability.engine'
import type { AvailabilityEntityType } from '../../../domain/availability/availability.types'
import { API, boot, json, now } from './_shared'
import { eventBus } from '../../events/event-bus'
import { propagateAvailabilityIssue } from '../../services/availability-propagation'

export const publicAvailabilityHandlers = [
  http.get(`${API}/availability`, async () => { await boot(); return json(await db.availability.toArray()) }),
]

export const ownerAvailabilityHandlers = [
  http.patch(`${API}/owner/availability/:entityId`, async ({ params, request }) => {
    await boot()
    const body = await request.json() as { entityType: AvailabilityEntityType; available: boolean; reason?: string }
    const record = setOwnerAvailability(String(params.entityId), body.entityType, body.available, now(), body.reason)
    await db.availability.put(record)
    eventBus.emit('AVAILABILITY_CHANGED', record)
    if (!body.available) await propagateAvailabilityIssue(record.entityId, record.reason ?? record.entityId, now())
    return json(record)
  }),
]

export const kdsAvailabilityHandlers = [
  http.get(`${API}/kds/availability`, async () => {
    await boot()
    const [products, records] = await Promise.all([db.products.toArray(), db.availability.toArray()])
    const current = now()
    const productRows = products.map((product) => {
      const effective = getEffectiveAvailability(product.id, records, current, product)
      return {
        entityId: product.id, entityType: 'PRODUCT' as const, name: product.name,
        effectiveStatus: effective.status, source: effective.source, reason: effective.reason,
        startsAt: effective.record?.startsAt, expiresAt: effective.record?.expiresAt,
        locked: effective.status === 'OWNER_DISABLED',
      }
    })
    const optionRows = products.flatMap((product) => (product.modifierGroups ?? []).flatMap((group) => group.options.map((option) => {
      const effective = getEffectiveAvailability(option.id, records, current)
      return {
        entityId: option.id,
        entityType: (group.id === 'size' || group.id === 'base' ? 'VARIANT' : 'MODIFIER') as 'VARIANT' | 'MODIFIER',
        name: option.name, parentName: `${product.name} · ${group.name}`,
        effectiveStatus: effective.status, source: effective.source, reason: effective.reason,
        startsAt: effective.record?.startsAt, expiresAt: effective.record?.expiresAt,
        locked: effective.status === 'OWNER_DISABLED',
      }
    })))
    const seen = new Set<string>()
    return json([...productRows, ...optionRows].filter((row) => {
      const key = `${row.entityType}:${row.entityId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }))
  }),

  http.patch(`${API}/kds/availability/:entityId`, async ({ params, request }) => {
    await boot()
    const body = await request.json() as { entityType: AvailabilityEntityType; duration: ChefUnavailableDuration; reason?: string }
    const entityId = String(params.entityId)
    const records = await db.availability.where('entityId').equals(entityId).toArray()
    if (records.some((record) => record.source === 'OWNER' && record.status === 'OWNER_DISABLED')) {
      return json({ message: 'Disabled by owner' }, 423)
    }
    await Promise.all(records.filter((record) => record.source === 'CHEF').map((record) => db.availability.delete(record.id)))
    const record = setChefTemporaryAvailability(entityId, body.entityType, body.duration, now(), body.reason)
    await db.availability.put(record)
    eventBus.emit('AVAILABILITY_CHANGED', record)
    await propagateAvailabilityIssue(record.entityId, record.reason ?? record.entityId, now())
    return json(record)
  }),

  http.delete(`${API}/kds/availability/:entityId`, async ({ params }) => {
    await boot()
    const entityId = String(params.entityId)
    const records = await db.availability.where('entityId').equals(entityId).toArray()
    if (records.some((record) => record.source === 'OWNER' && record.status === 'OWNER_DISABLED')) {
      return json({ message: 'Disabled by owner' }, 423)
    }
    await Promise.all(records.filter((record) => record.source === 'CHEF').map((record) => db.availability.delete(record.id)))
    eventBus.emit('AVAILABILITY_CHANGED', { entityId: params.entityId, cleared: true })
    return json({ ok: true })
  }),
]

export const availabilityHandlers = [...publicAvailabilityHandlers, ...ownerAvailabilityHandlers, ...kdsAvailabilityHandlers]
