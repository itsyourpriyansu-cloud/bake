import { apiClient } from './client'
import { endpoints, kdsOrderById, kdsPrepTime, kdsProblem, kdsReady, kdsStartPrep } from './endpoints'
import {
  kdsAvailabilityItemSchema, kdsHeartbeatSchema, kdsOrderSchema, kdsPrepTimeResponseSchema, kdsProblemResponseSchema,
} from '../../domain/kitchen/kds.schema'
import type { KdsProblemType } from '../../domain/kitchen/kds.types'
import type { AvailabilityEntityType } from '../../domain/availability/availability.types'
import type { ChefUnavailableDuration } from '../../domain/availability/availability.engine'
import { availabilityRecordSchema } from '../../domain/availability/availability.schema'

export const getKitchenQueue = async () => kdsOrderSchema.array().parse((await apiClient.get(endpoints.kdsQueue)).data)
export const getKitchenOrder = async (orderId: string) => kdsOrderSchema.parse((await apiClient.get(kdsOrderById(orderId))).data)
export const startPrep = async (orderId: string) => kdsOrderSchema.parse((await apiClient.post(kdsStartPrep(orderId))).data)
export const updatePrepTime = async (orderId: string, minutes: number, reason: string, chefId?: string) =>
  kdsPrepTimeResponseSchema.parse((await apiClient.patch(kdsPrepTime(orderId), { minutes, reason, chefId })).data)
export const markReady = async (orderId: string) => kdsOrderSchema.parse((await apiClient.post(kdsReady(orderId))).data)
export const reportKitchenProblem = async (orderId: string, type: KdsProblemType, detail?: string) => kdsProblemResponseSchema.parse((await apiClient.post(kdsProblem(orderId), { type, detail })).data)
export const getKdsAvailability = async () => kdsAvailabilityItemSchema.array().parse((await apiClient.get(endpoints.kdsAvailability)).data)
export const setKdsAvailability = async (entityId: string, entityType: AvailabilityEntityType, duration: ChefUnavailableDuration, reason?: string) =>
  availabilityRecordSchema.parse((await apiClient.patch(`${endpoints.kdsAvailability}/${entityId}`, { entityType, duration, reason })).data)
export const clearKdsAvailability = async (entityId: string) => (await apiClient.delete(`${endpoints.kdsAvailability}/${entityId}`)).data as { ok: boolean }
export const getKdsHeartbeat = async () => kdsHeartbeatSchema.parse((await apiClient.get(endpoints.kdsHeartbeat)).data)
export const setKdsOnline = async (online: boolean) => kdsHeartbeatSchema.parse((await apiClient.post(endpoints.kdsHeartbeat, { online })).data)
