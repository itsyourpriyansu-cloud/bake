import { z } from 'zod'
import { apiClient } from './client'
import { endpoints } from './endpoints'
import {
  celebrationSchema, customerNotificationSchema, customerProfileSchema, familyMemberSchema, favouriteSchema,
  foodPreferencesSchema, notificationPreferencesSchema, savedOrderSchema, waveIdTokenSchema,
} from '../../domain/customer/customer-experience.schema'
import type { Celebration, FamilyMember, FoodPreferences, NotificationPreferences } from '../../domain/customer/customer-experience.types'

const okSchema = z.object({ ok: z.boolean() })
export const getProfile = async () => customerProfileSchema.parse((await apiClient.get(endpoints.customerProfile)).data)
export const getPreferences = async () => foodPreferencesSchema.parse((await apiClient.get(endpoints.customerPreferences)).data)
export const updatePreferences = async (input: Partial<FoodPreferences>) => foodPreferencesSchema.parse((await apiClient.patch(endpoints.customerPreferences, input)).data)
export const updateNotificationPreferences = async (input: Partial<NotificationPreferences>) => notificationPreferencesSchema.parse((await apiClient.patch(endpoints.notificationPreferences, input)).data)
export const getSavedOrders = async () => savedOrderSchema.array().parse((await apiClient.get(endpoints.savedOrders)).data)
export const renameSavedOrder = async (id: string, name: string) => savedOrderSchema.parse((await apiClient.patch(`${endpoints.savedOrders}/${id}`, { name })).data)
export const saveCompletedOrder = async (orderId: string, name?: string) => savedOrderSchema.parse((await apiClient.post(`${endpoints.savedOrders}/from-order/${orderId}`, { name })).data)
export const deleteSavedOrder = async (id: string) => okSchema.parse((await apiClient.delete(`${endpoints.savedOrders}/${id}`)).data)
export const getFavourites = async () => favouriteSchema.array().parse((await apiClient.get(endpoints.favourites)).data)
export const deleteFavourite = async (id: string) => okSchema.parse((await apiClient.delete(`${endpoints.favourites}/${id}`)).data)
export const getFamily = async () => familyMemberSchema.array().parse((await apiClient.get(endpoints.family)).data)
export const saveFamilyMember = async (member: FamilyMember) => familyMemberSchema.parse((await apiClient.put(`${endpoints.family}/${member.id}`, member)).data)
export const getCelebrations = async () => celebrationSchema.array().parse((await apiClient.get(endpoints.celebrations)).data)
export const createCelebration = async (input: Omit<Celebration, 'id' | 'customerId'>) => celebrationSchema.parse((await apiClient.post(endpoints.celebrations, input)).data)
export const deleteCelebration = async (id: string) => okSchema.parse((await apiClient.delete(`${endpoints.celebrations}/${id}`)).data)
export const getNotifications = async () => customerNotificationSchema.array().parse((await apiClient.get(endpoints.notifications)).data)
export const markNotificationRead = async (id: string) => customerNotificationSchema.array().parse((await apiClient.post(`${endpoints.notifications}/${id}/read`)).data)
export const createWaveId = async () => waveIdTokenSchema.parse((await apiClient.post('/customer/wave-id')).data)
