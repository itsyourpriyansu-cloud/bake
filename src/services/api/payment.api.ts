import { apiClient } from './client'
import { endpoints, paymentConfirm, paymentFail, paymentPending, paymentStatus } from './endpoints'
import { paymentAttemptSchema } from '../../domain/payment/payment.schema'
import { orderSchema } from '../../domain/orders/order.schema'
import { z } from 'zod'

const initiateResponseSchema = z.object({ payment: paymentAttemptSchema, redirectUrl: z.string(), demoOnly: z.literal(true) })
const paymentResultSchema = z.object({ payment: paymentAttemptSchema, order: orderSchema.optional() })

export const initiatePayment = async (orderIntentId: string) => initiateResponseSchema.parse((await apiClient.post(endpoints.paymentInitiate, { orderIntentId })).data)
export const getPaymentStatus = async (paymentId: string) => paymentResultSchema.parse((await apiClient.get(paymentStatus(paymentId))).data)
export const confirmPaymentDemo = async (paymentId: string) => paymentResultSchema.parse((await apiClient.post(paymentConfirm(paymentId))).data)
export const failPaymentDemo = async (paymentId: string) => paymentResultSchema.parse((await apiClient.post(paymentFail(paymentId))).data)
export const keepPaymentPendingDemo = async (paymentId: string) => paymentResultSchema.parse((await apiClient.post(paymentPending(paymentId))).data)
