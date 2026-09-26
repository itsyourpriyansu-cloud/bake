import type { Product } from '../catalog/catalog.types'
import type { AvailabilityRecord, EffectiveAvailability } from './availability.types'

/**
 * Priority (highest authority first):
 *   OWNER_DISABLED > STORE_RULE (product.available=false) > INGREDIENT_DEPENDENCY >
 *   CHEF_TEMP_UNAVAILABLE > SYSTEM_CAPACITY (SYSTEM_DISABLED) > AVAILABLE
 * Owner override always wins, even over a chef's temporary disable.
 */
export function getEffectiveAvailability(entityId: string, records: AvailabilityRecord[], now: Date, product?: Product): EffectiveAvailability {
  const live = (record: AvailabilityRecord) => record.entityId === entityId && (!record.expiresAt || new Date(record.expiresAt) > now)
  const active = records.filter(live)

  const owner = active.find((record) => record.source === 'OWNER')
  if (owner) return { status: owner.status, reason: owner.reason, source: 'OWNER', record: owner }

  if (product && !product.available) return { status: 'OWNER_DISABLED', reason: 'Disabled in catalog', source: 'OWNER' }

  const chef = active.find((record) => record.source === 'CHEF')
  if (chef) return { status: chef.status, reason: chef.reason, source: 'CHEF', record: chef }

  const system = active.find((record) => record.source === 'SYSTEM')
  if (system) return { status: system.status, reason: system.reason, source: 'SYSTEM', record: system }

  return { status: 'AVAILABLE' }
}

export function setOwnerAvailability(entityId: string, entityType: AvailabilityRecord['entityType'], available: boolean, now: Date, reason?: string): AvailabilityRecord {
  return {
    id: `AVAIL-OWNER-${entityId}`, entityType, entityId, source: 'OWNER',
    status: available ? 'AVAILABLE' : 'OWNER_DISABLED', reason, startsAt: now.toISOString(),
  }
}

export type ChefUnavailableDuration = 30 | 60 | 'REST_OF_DAY' | 'UNTIL_ENABLED'

export function setChefTemporaryAvailability(entityId: string, entityType: AvailabilityRecord['entityType'], duration: ChefUnavailableDuration, now: Date, reason?: string): AvailabilityRecord {
  const expiresAt = duration === 'UNTIL_ENABLED'
    ? undefined
    : duration === 'REST_OF_DAY'
    ? new Date(new Date(now).setHours(23, 59, 59, 999)).toISOString()
    : new Date(now.getTime() + duration * 60_000).toISOString()
  return { id: `AVAIL-CHEF-${entityId}-${now.getTime()}`, entityType, entityId, source: 'CHEF', status: 'CHEF_TEMP_UNAVAILABLE', reason, startsAt: now.toISOString(), expiresAt }
}

export function clearChefAvailability(entityId: string, entityType: AvailabilityRecord['entityType'], now: Date): AvailabilityRecord {
  return { id: `AVAIL-CHEF-CLEAR-${entityId}-${now.getTime()}`, entityType, entityId, source: 'CHEF', status: 'AVAILABLE', startsAt: now.toISOString() }
}

/** Drops records whose expiresAt has passed — call periodically from the automation sweep. */
export function expireAvailabilityOverrides(records: AvailabilityRecord[], now: Date): AvailabilityRecord[] {
  return records.filter((record) => !record.expiresAt || new Date(record.expiresAt) > now)
}

export interface CartAvailabilityIssue { productId: string; productName: string; reason: string }

export function validateCartAvailability(items: Array<{ productId: string; productName: string }>, products: Product[], records: AvailabilityRecord[], now: Date): CartAvailabilityIssue[] {
  const issues: CartAvailabilityIssue[] = []
  for (const item of items) {
    const product = products.find((candidate) => candidate.id === item.productId)
    const effective = getEffectiveAvailability(item.productId, records, now, product)
    if (effective.status !== 'AVAILABLE') issues.push({ productId: item.productId, productName: item.productName, reason: effective.reason ?? 'Currently unavailable' })
  }
  return issues
}
