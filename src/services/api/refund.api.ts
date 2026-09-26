import { apiClient } from './client'
import { endpoints, refundProcess } from './endpoints'
import { refundSchema } from '../../domain/refunds/refund.schema'

export const getRefunds = async (orderId?: string) => refundSchema.array().parse((await apiClient.get(endpoints.refunds, { params: orderId ? { orderId } : undefined })).data)
export const processRefund = async (refundId: string) => refundSchema.parse((await apiClient.post(refundProcess(refundId))).data)
