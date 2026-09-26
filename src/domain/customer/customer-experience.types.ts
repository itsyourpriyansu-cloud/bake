import type { z } from 'zod'
import type {
  celebrationSchema, customerNotificationSchema, customerProfileSchema, familyMemberSchema, favouriteSchema,
  foodPreferencesSchema, notificationPreferencesSchema, reorderChangeSchema, reorderResultSchema, savedOrderItemSchema,
  savedOrderSchema, waveIdTokenSchema,
} from './customer-experience.schema'

export type SavedOrderItem = z.infer<typeof savedOrderItemSchema>
export type SavedOrder = z.infer<typeof savedOrderSchema>
export type Favourite = z.infer<typeof favouriteSchema>
export type FoodPreferences = z.infer<typeof foodPreferencesSchema>
export type FamilyMember = z.infer<typeof familyMemberSchema>
export type Celebration = z.infer<typeof celebrationSchema>
export type CustomerNotification = z.infer<typeof customerNotificationSchema>
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type CustomerProfile = z.infer<typeof customerProfileSchema>
export type WaveIdToken = z.infer<typeof waveIdTokenSchema>
export type ReorderChange = z.infer<typeof reorderChangeSchema>
export type ReorderResult = z.infer<typeof reorderResultSchema>

