import { apiClient } from './client'
import { endpoints, ownerAcceptOrder, ownerCustomerPoints, ownerRejectOrder, ownerResolveAttention, ownerSupportAction } from './endpoints'
import { orderSchema } from '../../domain/orders/order.schema'
import { customerSchema } from '../../domain/customer/customer.schema'
import { refundSchema } from '../../domain/refunds/refund.schema'
import { availabilityRecordSchema } from '../../domain/availability/availability.schema'
import {
  ownerCustomer360Schema, ownerDashboardSchema, ownerOpportunitySchema, ownerSupportItemSchema, storeOrderResultSchema,
} from '../../domain/owner/owner.schema'
import { z } from 'zod'
import { campaignEventSchema, campaignPreviewInputSchema, campaignPreviewSchema, whatsappMessageTypeSchema, whatsappSimulationSchema } from '../../domain/retention/retention.schema'
import type { CampaignPreviewInput, WhatsAppMessageType } from '../../domain/retention/retention.types'

const attentionItemSchema = z.object({
  id: z.string(), type: z.string(), severity: z.string(), title: z.string(), summary: z.string(),
  orderId: z.string().optional(), customerId: z.string().optional(), suggestedAction: z.string(),
  createdAt: z.string(), resolvedAt: z.string().optional(),
})

export const getOwnerOrders = async (acceptanceStatus?: string) => orderSchema.array().parse((await apiClient.get(endpoints.ownerOrders, { params: acceptanceStatus ? { acceptanceStatus } : undefined })).data)
export const acceptOwnerOrder = async (orderId: string) => orderSchema.parse((await apiClient.post(ownerAcceptOrder(orderId))).data)
export const rejectOwnerOrder = async (orderId: string, reason: string) =>
  z.object({ order: orderSchema, refund: refundSchema }).parse((await apiClient.post(ownerRejectOrder(orderId), { reason })).data)
export const getAttentionQueue = async () => attentionItemSchema.array().parse((await apiClient.get(endpoints.ownerAttention)).data)
export const resolveAttentionItem = async (attentionId: string) => attentionItemSchema.parse((await apiClient.post(ownerResolveAttention(attentionId))).data)
export const getOwnerCustomer = async (customerId: string) => customerSchema.parse((await apiClient.get(`${endpoints.ownerCustomers}/${customerId}`)).data)
export const getOwnerDashboard = async () => ownerDashboardSchema.parse((await apiClient.get(endpoints.ownerDashboard)).data)
export const searchOwnerCustomers = async (query: string) => customerSchema.array().parse((await apiClient.get(endpoints.ownerCustomers, { params: { q: query } })).data)
export const getOwnerCustomer360 = async (customerId: string) => ownerCustomer360Schema.parse((await apiClient.get(`${endpoints.ownerCustomers}/${customerId}/timeline`)).data)
export const adjustOwnerCustomerPoints = async (customerId: string, input: { direction: 'ADD' | 'REMOVE'; amount: number; reason: string; note?: string }) =>
  ownerCustomer360Schema.parse((await apiClient.post(ownerCustomerPoints(customerId), input)).data)
export const getOwnerAvailability = async () => availabilityRecordSchema.array().parse((await apiClient.get(endpoints.ownerAvailability)).data)
export const getOwnerOpportunities = async () => ownerOpportunitySchema.array().parse((await apiClient.get(endpoints.ownerOpportunities)).data)
export const previewOwnerCampaign = async (input: CampaignPreviewInput) => campaignPreviewSchema.parse((await apiClient.post(endpoints.ownerCampaignPreview, campaignPreviewInputSchema.parse(input))).data)
export const simulateOwnerCampaign = async (input: CampaignPreviewInput) => campaignEventSchema.parse((await apiClient.post(endpoints.ownerCampaignSimulate, campaignPreviewInputSchema.parse(input))).data)
export const simulateOwnerWhatsApp = async (messageType: WhatsAppMessageType) => whatsappSimulationSchema.parse((await apiClient.post(endpoints.ownerWhatsAppSimulate, { messageType: whatsappMessageTypeSchema.parse(messageType) })).data)
export const getOwnerSupport = async () => ownerSupportItemSchema.array().parse((await apiClient.get(endpoints.ownerSupport)).data)
export const runOwnerSupportAction = async (caseId: string, input: { action: 'REFUND_ITEM' | 'REPLACEMENT' | 'ANSWER' | 'CLOSE'; amount?: number; message?: string }) =>
  z.object({ support: ownerSupportItemSchema, refund: refundSchema.optional() }).parse((await apiClient.post(ownerSupportAction(caseId), input)).data)
export const createOwnerStoreOrder = async (input: { customerMode: 'WAVE_ID' | 'PHONE_OTP' | 'GUEST'; customerId?: string; phone?: string; otp?: string; productId: string; quantity: number }) =>
  storeOrderResultSchema.parse((await apiClient.post(endpoints.ownerStoreOrders, input)).data)
