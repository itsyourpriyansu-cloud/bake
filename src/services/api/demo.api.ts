import { apiClient } from './client'
import { endpoints, scenarioByName } from './endpoints'
import { z } from 'zod'

const scenarioSummarySchema = z.object({ id: z.string(), title: z.string(), description: z.string(), appliedAt: z.string() })
const demoStateSchema = z.object({
  now: z.string(), offsetMinutes: z.number(), kitchenLoadPercent: z.number(), kdsOnline: z.boolean(),
  latestPayment: z.object({ id: z.string(), status: z.string() }).optional(),
  activeOrder: z.object({ id: z.string(), publicOrderNumber: z.string(), fulfillmentStatus: z.string() }).optional(),
})

export const resetDemo = async () => (await apiClient.post(endpoints.demoReset)).data as { ok: boolean }
export const listScenarios = async () => z.array(z.string()).parse((await apiClient.get(endpoints.demoScenarios)).data)
export const loadScenario = async (name: string) => scenarioSummarySchema.parse((await apiClient.post(scenarioByName(name))).data)
/** Legacy Stage-1 toggle kept for the current DemoToolbar. */
export const setCustomerLoggedIn = async (loggedIn: boolean) => (await apiClient.patch(endpoints.demoSession, { loggedIn })).data as { loggedIn: boolean }
export const getDemoState = async () => demoStateSchema.parse((await apiClient.get(endpoints.demoState)).data)
export const advanceTime = async (minutes: number) => demoStateSchema.parse((await apiClient.post(endpoints.demoAdvanceTime, { minutes })).data)
export const setKitchenLoad = async (percent: number) => demoStateSchema.parse((await apiClient.post(endpoints.demoKitchenLoad, { percent })).data)
export const setLatestPaymentOutcome = async (outcome: 'SUCCESS' | 'FAILURE') => (await apiClient.post(endpoints.demoPaymentOutcome, { outcome })).data as { ok: boolean; paymentId: string; orderId?: string; status: string }
export const completeActiveOrder = async () => (await apiClient.post(endpoints.demoCompleteOrder)).data as { ok: boolean; orderId: string; fulfillmentStatus: string }
export const setKdsOffline = async (offline: boolean) => demoStateSchema.parse((await apiClient.post(endpoints.demoKdsOffline, { offline })).data)
