import type { z } from 'zod'
import type { acceptanceModeSchema, capabilitiesSchema, storeConfigSchema } from './store.schema'

export type AcceptanceMode = z.infer<typeof acceptanceModeSchema>
export type StoreConfig = z.infer<typeof storeConfigSchema>
export type Capabilities = z.infer<typeof capabilitiesSchema>
