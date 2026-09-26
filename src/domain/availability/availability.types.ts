import type { z } from 'zod'
import type {
  availabilityEntityTypeSchema, availabilityRecordSchema, availabilitySourceSchema, availabilityStatusSchema,
} from './availability.schema'

export type AvailabilityEntityType = z.infer<typeof availabilityEntityTypeSchema>
export type AvailabilitySource = z.infer<typeof availabilitySourceSchema>
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>
export type AvailabilityRecord = z.infer<typeof availabilityRecordSchema>

export interface EffectiveAvailability { status: AvailabilityStatus; reason?: string; source?: AvailabilitySource; record?: AvailabilityRecord }
