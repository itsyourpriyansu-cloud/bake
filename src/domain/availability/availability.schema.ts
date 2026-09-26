import { z } from 'zod'

export const availabilityEntityTypeSchema = z.enum(['PRODUCT', 'VARIANT', 'MODIFIER', 'INGREDIENT'])
export const availabilitySourceSchema = z.enum(['OWNER', 'CHEF', 'SYSTEM'])
export const availabilityStatusSchema = z.enum(['AVAILABLE', 'OWNER_DISABLED', 'CHEF_TEMP_UNAVAILABLE', 'SYSTEM_DISABLED'])

export const availabilityRecordSchema = z.object({
  id: z.string(),
  entityType: availabilityEntityTypeSchema,
  entityId: z.string(),
  status: availabilityStatusSchema,
  source: availabilitySourceSchema,
  reason: z.string().optional(),
  startsAt: z.string(),
  expiresAt: z.string().optional(),
})
