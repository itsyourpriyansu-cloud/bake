import { z } from 'zod'

export const crmSegmentSchema = z.enum([
  'SECOND_ORDER_PENDING', 'INACTIVE_14_30_DAYS', 'POINTS_EXPIRING', 'BIRTHDAY_UPCOMING',
  'NEAR_GOLD', 'NEAR_PLATINUM', 'DORMANT_GOLD', 'DORMANT_PLATINUM',
])

export const campaignChannelSchema = z.enum(['IN_APP', 'WHATSAPP_SIM', 'PUSH_SIM'])
export const campaignTimingSchema = z.enum(['NOW', 'TONIGHT_7PM', 'TOMORROW_11AM'])
export const whatsappMessageTypeSchema = z.enum(['ORDER_CONFIRMATION', 'DELAY', 'READY_FOR_PICKUP', 'ON_THE_WAY', 'POINTS_EARNED', 'BIRTHDAY', 'REORDER', 'REFUND', 'SUPPORT'])
export const whatsappSimulationSchema = z.object({ conversationId: z.string(), messageId: z.string(), messageType: whatsappMessageTypeSchema, channel: z.literal('WHATSAPP_SIM'), text: z.string(), demoOnly: z.literal(true) })

export const crmOpportunitySchema = z.object({
  id: z.string(), segment: crmSegmentSchema, label: z.string(), title: z.string(),
  customerCount: z.number().int().nonnegative(), derivedCustomerIds: z.array(z.string()),
  insight: z.string(), message: z.string(), offer: z.string(),
  suggestedChannel: campaignChannelSchema, suggestedTiming: campaignTimingSchema,
  estimatedCost: z.number().nonnegative(), estimatedConversions: z.number().nonnegative(),
})

export const campaignPreviewInputSchema = z.object({
  opportunityId: z.string(), channel: campaignChannelSchema, timing: campaignTimingSchema,
  offer: z.string().min(1), message: z.string().min(1),
})

export const campaignPreviewSchema = campaignPreviewInputSchema.extend({
  id: z.string(), audience: z.string(), estimatedAudience: z.number().int().nonnegative(),
  estimatedCost: z.number().nonnegative(), estimatedConversions: z.number().nonnegative(),
  demoOnly: z.literal(true),
})

export const campaignEventSchema = campaignPreviewSchema.extend({
  customerId: z.string().optional(), status: z.enum(['PREVIEWED', 'SIMULATED']), createdAt: z.string(),
})

export const referralStatusSchema = z.enum(['INVITED', 'SIGNED_UP', 'FIRST_ORDER_PENDING', 'QUALIFIED', 'REWARDED'])
export const referralSchema = z.object({
  id: z.string(), referrerCustomerId: z.string(), friendName: z.string(), maskedPhone: z.string(),
  referredCustomerId: z.string().optional(),
  status: referralStatusSchema, rewardPoints: z.number().int().nonnegative(),
  createdAt: z.string(), updatedAt: z.string(), qualifiedAt: z.string().optional(), rewardedAt: z.string().optional(),
})

export const celebrationStageSchema = z.enum(['T_MINUS_7', 'T_MINUS_3', 'T_MINUS_1', 'BIRTHDAY'])
export const celebrationTouchpointSchema = z.object({
  stage: celebrationStageSchema, label: z.string(), scheduledFor: z.string(), sent: z.boolean(), sentAt: z.string().optional(),
})
export const celebrationAutomationSchema = z.object({
  celebrationId: z.string(), label: z.string(), date: z.string(), nextStage: celebrationStageSchema.nullable(),
  touchpoints: z.array(celebrationTouchpointSchema), demoOnly: z.literal(true),
})

export const retentionSummarySchema = z.object({
  favouriteCategory: z.string(), usualProductIds: z.array(z.string()), recommendedProductIds: z.array(z.string()),
  savedOrderId: z.string().optional(), savedOrderName: z.string().optional(),
  secondOrderLoop: z.object({ title: z.string(), message: z.string(), campaignScheduled: z.boolean() }).nullable(),
  method: z.literal('RULE_BASED'),
})
