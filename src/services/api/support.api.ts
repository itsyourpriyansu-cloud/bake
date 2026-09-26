import { apiClient } from './client'
import { endpoints, supportCaseResolve } from './endpoints'
import { z } from 'zod'

const supportCaseSchema = z.object({
  id: z.string(), conversationId: z.string().optional(), orderId: z.string().optional(), customerId: z.string(),
  category: z.string(), status: z.string(), description: z.string(), createdAt: z.string(), resolvedAt: z.string().optional(), refundId: z.string().optional(),
})

export const getSupportCases = async (customerId?: string) => supportCaseSchema.array().parse((await apiClient.get(endpoints.supportCases, { params: customerId ? { customerId } : undefined })).data)
export const createSupportCase = async (input: { customerId: string; category: string; description: string; orderId?: string; conversationId?: string }) =>
  supportCaseSchema.parse((await apiClient.post(endpoints.supportCases, input)).data)
export const resolveSupportCase = async (caseId: string) => supportCaseSchema.parse((await apiClient.post(supportCaseResolve(caseId))).data)
