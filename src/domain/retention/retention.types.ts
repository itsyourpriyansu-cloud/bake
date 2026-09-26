import type { z } from 'zod'
import type {
  campaignChannelSchema, campaignEventSchema, campaignPreviewInputSchema, campaignPreviewSchema,
  campaignTimingSchema, celebrationAutomationSchema, celebrationStageSchema, crmOpportunitySchema,
  crmSegmentSchema, referralSchema, referralStatusSchema, retentionSummarySchema,
  whatsappMessageTypeSchema, whatsappSimulationSchema,
} from './retention.schema'

export type CrmSegment = z.infer<typeof crmSegmentSchema>
export type CampaignChannel = z.infer<typeof campaignChannelSchema>
export type CampaignTiming = z.infer<typeof campaignTimingSchema>
export type CrmOpportunity = z.infer<typeof crmOpportunitySchema>
export type CampaignPreviewInput = z.infer<typeof campaignPreviewInputSchema>
export type CampaignPreview = z.infer<typeof campaignPreviewSchema>
export type CampaignEvent = z.infer<typeof campaignEventSchema>
export type ReferralStatus = z.infer<typeof referralStatusSchema>
export type Referral = z.infer<typeof referralSchema>
export type CelebrationStage = z.infer<typeof celebrationStageSchema>
export type CelebrationAutomation = z.infer<typeof celebrationAutomationSchema>
export type RetentionSummary = z.infer<typeof retentionSummarySchema>
export type WhatsAppMessageType = z.infer<typeof whatsappMessageTypeSchema>
export type WhatsAppSimulation = z.infer<typeof whatsappSimulationSchema>
