import { apiClient } from './client'
import { endpoints } from './endpoints'
import { capabilitiesSchema, storeConfigSchema } from '../../domain/store/store.schema'

export const getCapabilities = async () => capabilitiesSchema.parse((await apiClient.get(endpoints.capabilities)).data)
export const getStoreConfig = async () => storeConfigSchema.parse((await apiClient.get(endpoints.configStore)).data)
export const patchStoreConfig = async (patch: Partial<import('../../domain/store/store.types').StoreConfig>) =>
  storeConfigSchema.parse((await apiClient.patch(endpoints.configStore, patch)).data)
/** Legacy Stage-1 shortcut — patches store flags directly and returns the recomputed capabilities. */
export const patchDemoCapabilities = async (patch: Partial<{ deliveryEnabled: boolean; pickupEnabled: boolean; isOpen: boolean; kdsOnline: boolean }>) =>
  capabilitiesSchema.parse((await apiClient.patch(endpoints.demoCapabilities, patch)).data)
