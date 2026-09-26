import { apiClient } from './client'
import { endpoints } from './endpoints'
import { availabilityRecordSchema } from '../../domain/availability/availability.schema'
import type { AvailabilityEntityType } from '../../domain/availability/availability.types'
import type { ChefUnavailableDuration } from '../../domain/availability/availability.engine'

export const getAvailability = async () => availabilityRecordSchema.array().parse((await apiClient.get(endpoints.availability)).data)
export const setOwnerAvailability = async (entityId: string, entityType: AvailabilityEntityType, available: boolean, reason?: string) =>
  availabilityRecordSchema.parse((await apiClient.patch(`${endpoints.ownerAvailability}/${entityId}`, { entityType, available, reason })).data)
export const setChefAvailability = async (entityId: string, entityType: AvailabilityEntityType, duration: ChefUnavailableDuration, reason?: string) =>
  availabilityRecordSchema.parse((await apiClient.patch(`${endpoints.kdsAvailability}/${entityId}`, { entityType, duration, reason })).data)
export const clearChefAvailability = async (entityId: string) => (await apiClient.delete(`${endpoints.kdsAvailability}/${entityId}`)).data as { ok: boolean }
