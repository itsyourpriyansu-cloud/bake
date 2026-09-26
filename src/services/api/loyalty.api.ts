import { apiClient } from './client'
import { endpoints } from './endpoints'
import { loyaltySummarySchema, loyaltyTransactionSchema } from '../../domain/loyalty/loyalty.schema'
import { demoCustomerViewSchema } from '../../domain/customer/customer.schema'

export const getLoyalty = async (customerId?: string) => loyaltySummarySchema.parse((await apiClient.get(endpoints.loyalty, { params: customerId ? { customerId } : undefined })).data)
export const getLoyaltyWallet = async (customerId: string) => loyaltyTransactionSchema.array().parse((await apiClient.get(`${endpoints.loyaltyWallet}/${customerId}`)).data)
export const getLoyaltyHistory = async (customerId = 'CUST001') => loyaltyTransactionSchema.array().parse((await apiClient.get(endpoints.loyaltyHistory, { params: { customerId } })).data)
export const getByWaveId = async (waveId: string) => demoCustomerViewSchema.parse((await apiClient.get(`${endpoints.waveId}/${waveId}`)).data)
