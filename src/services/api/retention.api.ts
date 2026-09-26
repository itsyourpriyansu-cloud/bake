import { z } from 'zod'
import { celebrationAutomationSchema, celebrationStageSchema, referralSchema, retentionSummarySchema } from '../../domain/retention/retention.schema'
import type { CelebrationStage } from '../../domain/retention/retention.types'
import { apiClient } from './client'
import { celebrationScenario, endpoints, referralAdvance } from './endpoints'

export const getRetentionSummary = async () => retentionSummarySchema.parse((await apiClient.get(endpoints.customerRetention)).data)
export const getReferrals = async () => referralSchema.array().parse((await apiClient.get(endpoints.referrals)).data)
export const createReferral = async (input: { friendName: string; phone: string }) => referralSchema.parse((await apiClient.post(endpoints.referrals, input)).data)
export const advanceReferral = async (id: string) => referralSchema.parse((await apiClient.post(referralAdvance(id))).data)
export const getCelebrationAutomation = async () => celebrationAutomationSchema.parse((await apiClient.get(endpoints.celebrationAutomation)).data)
export const simulateCelebrationStage = async (stage: CelebrationStage) => z.object({ ok: z.boolean(), stage: celebrationStageSchema }).parse((await apiClient.post(celebrationScenario(stage))).data)

