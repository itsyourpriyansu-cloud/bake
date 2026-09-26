import type { Celebration } from '../../domain/customer/customer-experience.types'
import { celebrationStageFor, nextAnnualDate } from '../../domain/retention/retention.engine'
import type { CelebrationStage } from '../../domain/retention/retention.types'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'
import { appendRetentionMessage } from './retention-messaging'

const stageCopy: Record<CelebrationStage, string> = {
  T_MINUS_7: 'Your birthday Wave begins in 7 days 🎉 We’re saving a delicious surprise.',
  T_MINUS_3: 'Three days to your birthday. Your Pizza Wave celebration pick is ready.',
  T_MINUS_1: 'Tomorrow is your day 🎂 Your birthday Pizza Wave is almost here.',
  BIRTHDAY: 'Happy birthday, Priyanshu! 🎉 Your Pizza Wave birthday surprise is ready.',
}

export function celebrationSchedule(celebration: Celebration, now: Date) {
  const birthday = nextAnnualDate(celebration.day, celebration.month, now)
  const offsets: Array<[CelebrationStage, number, string]> = [
    ['T_MINUS_7', 7, '7 days before'], ['T_MINUS_3', 3, '3 days before'], ['T_MINUS_1', 1, 'Tomorrow'], ['BIRTHDAY', 0, 'Birthday'],
  ]
  return offsets.map(([stage, days, label]) => ({ stage, label, scheduledFor: new Date(birthday.getTime() - days * 86_400_000).toISOString() }))
}

export async function runCelebrationStage(celebration: Celebration, stage: CelebrationStage, now: Date) {
  const eventId = `CAMPAIGN-CELEB-${celebration.id}-${stage}`
  const existing = await db.campaignEvents.get(eventId)
  if (existing) return existing
  const message = stageCopy[stage]
  await appendRetentionMessage(celebration.customerId, message, 'WHATSAPP_SIM', 'BIRTHDAY')
  const event = {
    id: eventId, opportunityId: `CELEBRATION-${celebration.id}`, channel: 'WHATSAPP_SIM' as const,
    timing: 'NOW' as const, offer: 'Birthday surprise', message, audience: celebration.label,
    estimatedAudience: 1, estimatedCost: .78, estimatedConversions: 1, demoOnly: true as const,
    customerId: celebration.customerId, status: 'SIMULATED' as const, createdAt: now.toISOString(),
  }
  await db.campaignEvents.add(event)
  eventBus.emit('RETENTION_UPDATED', { kind: 'CELEBRATION', stage, celebrationId: celebration.id }, { customerId: celebration.customerId })
  return event
}

export async function runCelebrationAutomation(now: Date) {
  const celebrations = ((await db.config.get('celebrations'))?.value as Celebration[] | undefined) ?? []
  for (const celebration of celebrations.filter((item) => item.type === 'BIRTHDAY')) {
    const stage = celebrationStageFor(celebration.day, celebration.month, now)
    if (stage) await runCelebrationStage(celebration, stage, now)
  }
}

