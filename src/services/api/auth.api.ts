import { apiClient } from './client'
import { endpoints } from './endpoints'
import { z } from 'zod'

const otpRequestSchema = z.object({ requestId: z.string(), expiresAt: z.string() })
const customerSessionSchema = z.object({ realm: z.literal('CUSTOMER'), customerId: z.string(), issuedAt: z.string(), expiresAt: z.string() })
const ownerSessionSchema = z.object({ realm: z.literal('OWNER'), email: z.string(), issuedAt: z.string(), expiresAt: z.string(), idleLockAt: z.string() })
const kdsSessionSchema = z.object({ realm: z.literal('KDS'), device: z.string(), issuedAt: z.string(), expiresAt: z.string() })

export const requestCustomerOtp = async (phone: string) => otpRequestSchema.parse((await apiClient.post(endpoints.authCustomerOtpRequest, { phone })).data)
export const verifyCustomerOtp = async (phone: string, otp: string) => customerSessionSchema.parse((await apiClient.post(endpoints.authCustomerOtpVerify, { phone, otp })).data)
export const logoutCustomer = async () => z.object({ ok: z.boolean() }).parse((await apiClient.post('/auth/customer/logout')).data)
export const ownerLogin = async (email: string, password: string, code: string) => ownerSessionSchema.parse((await apiClient.post(endpoints.authOwnerLogin, { email, password, code })).data)
export const kdsLogin = async (pin: string) => kdsSessionSchema.parse((await apiClient.post(endpoints.authKdsLogin, { pin })).data)
