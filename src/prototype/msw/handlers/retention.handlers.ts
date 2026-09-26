import { http } from 'msw'
import type { Celebration, CustomerNotification, Favourite, FoodPreferences, SavedOrder } from '../../../domain/customer/customer-experience.types'
import { buildCampaignPreview, buildCrmOpportunities, nextAnnualDate, nextReferralStatus, rankPersonalizedProducts, referralRewardEligible } from '../../../domain/retention/retention.engine'
import { campaignPreviewInputSchema, celebrationStageSchema, whatsappMessageTypeSchema } from '../../../domain/retention/retention.schema'
import type { CampaignEvent, CelebrationStage, Referral } from '../../../domain/retention/retention.types'
import { createId } from '../../../domain/shared/ids'
import { demoClock } from '../../../domain/shared/clock'
import { db } from '../../database/db'
import { eventBus } from '../../events/event-bus'
import { appendRetentionMessage } from '../../services/retention-messaging'
import { celebrationSchedule, runCelebrationStage } from '../../services/retention-automation'
import { API, boot, error, json, now } from './_shared'

async function config<T>(key: string, fallback: T): Promise<T> { return ((await db.config.get(key))?.value as T | undefined) ?? fallback }

async function opportunities() {
  const [customers, celebrations, loyalty] = await Promise.all([db.customers.toArray(), config<Celebration[]>('celebrations', []), db.loyaltyTransactions.toArray()])
  const expiryCutoff = now().getTime() + 30 * 86_400_000
  const expiring = loyalty.filter((row) => row.status === 'AVAILABLE' && row.points > 0 && row.expiresAt && new Date(row.expiresAt).getTime() <= expiryCutoff)
    .reduce<Record<string, number>>((map, row) => ({ ...map, [row.customerId]: (map[row.customerId] ?? 0) + row.points }), {})
  return buildCrmOpportunities(customers, celebrations, now(), expiring)
}

export const retentionHandlers = [
  http.get(`${API}/owner/opportunities`, async () => { await boot(); return json(await opportunities()) }),
  http.post(`${API}/owner/campaigns/preview`, async ({ request }) => {
    await boot(); const parsed = campaignPreviewInputSchema.safeParse(await request.json())
    if (!parsed.success) return error('Invalid campaign preview', 400)
    const opportunity = (await opportunities()).find((row) => row.id === parsed.data.opportunityId)
    return opportunity ? json(buildCampaignPreview(opportunity, parsed.data)) : error('Opportunity not found', 404)
  }),
  http.post(`${API}/owner/campaigns/simulate`, async ({ request }) => {
    await boot(); const parsed = campaignPreviewInputSchema.safeParse(await request.json())
    if (!parsed.success) return error('Invalid campaign simulation', 400)
    const opportunity = (await opportunities()).find((row) => row.id === parsed.data.opportunityId)
    if (!opportunity) return error('Opportunity not found', 404)
    const preview = buildCampaignPreview(opportunity, parsed.data); const timestamp = now().toISOString()
    const channel = parsed.data.channel === 'WHATSAPP_SIM' ? 'WHATSAPP_SIM' : parsed.data.channel === 'IN_APP' ? 'PWA_CHAT' : 'SYSTEM'
    await appendRetentionMessage('CUST001', `${parsed.data.message}\n\n${parsed.data.offer}`, channel, 'CAMPAIGN')
    const event: CampaignEvent = { ...preview, id: createId('CAMPAIGN'), customerId: 'CUST001', status: 'SIMULATED', createdAt: timestamp }
    await db.campaignEvents.add(event)
    if (parsed.data.channel !== 'WHATSAPP_SIM') {
      const notifications = await config<CustomerNotification[]>('customerNotifications', [])
      notifications.unshift({ id: createId('NOTIF'), customerId: 'CUST001', kind: 'REWARD', title: opportunity.title, message: parsed.data.message, createdAt: timestamp, read: false })
      await db.config.put({ key: 'customerNotifications', value: notifications })
    }
    eventBus.emit('RETENTION_UPDATED', { kind: 'CAMPAIGN', campaignId: event.id }, { customerId: 'CUST001' })
    return json(event, 201)
  }),
  http.post(`${API}/owner/whatsapp/simulate`, async ({ request }) => {
    await boot(); const parsed = whatsappMessageTypeSchema.safeParse((await request.json() as { messageType?: string }).messageType)
    if (!parsed.success) return error('Unknown WhatsApp simulation type', 400)
    const [customer, orders, refunds, support] = await Promise.all([db.customers.get('CUST001'), db.orders.where('customerId').equals('CUST001').toArray(), db.refunds.where('customerId').equals('CUST001').toArray(), db.supportCases.where('customerId').equals('CUST001').toArray()])
    if (!customer) return error('Customer not found', 404)
    const latestOrder = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; const latestRefund = refunds.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    const orderNumber = latestOrder?.publicOrderNumber ?? 'PW1384'; const templates = {
      ORDER_CONFIRMATION: `Payment received for ${orderNumber}. Pizza Wave is confirming your order now.`,
      DELAY: `${orderNumber} needs a little longer in the kitchen. Your live ETA has been updated.`,
      READY_FOR_PICKUP: `${orderNumber} is ready for pickup at Grand Road. We’ll keep it warm.`,
      ON_THE_WAY: `${orderNumber} is on the way. Track the live delivery state in the Pizza Wave app.`,
      POINTS_EARNED: `You now have ${customer.pointsAvailable} Wave Points available. Your latest order updated the wallet automatically.`,
      BIRTHDAY: `Happy birthday, ${customer.firstName}! 🎉 Your Pizza Wave birthday surprise is ready.`,
      REORDER: `Been a while 🍕 Your saved Pizza Wave order is waiting whenever you are ready.`,
      REFUND: latestRefund ? `Refund ${latestRefund.id} is ${latestRefund.status.replaceAll('_', ' ').toLowerCase()}. Follow the same support thread for updates.` : 'There is no active refund. This is a template preview only.',
      SUPPORT: support[0] ? `Support case ${support[0].id} is ${support[0].status.replaceAll('_', ' ').toLowerCase()}. Reply in this same thread.` : 'Pizza Wave support is here. Reply in this same shared thread.',
    } as const
    const message = await appendRetentionMessage(customer.id, templates[parsed.data], 'WHATSAPP_SIM', parsed.data)
    return json({ conversationId: message.conversationId, messageId: message.id, messageType: parsed.data, channel: 'WHATSAPP_SIM' as const, text: message.text, demoOnly: true as const }, 201)
  }),

  http.get(`${API}/customer/retention`, async () => {
    await boot(); const customer = await db.customers.get('CUST001'); if (!customer) return error('Customer not found', 404)
    const [products, preferences, favourites, savedOrders, followup] = await Promise.all([
      db.products.toArray(), config<FoodPreferences>('foodPreferences', { diet: 'BOTH', spiceLevel: 'MEDIUM', cheese: 'REGULAR', avoid: [], favouriteCategories: [] }),
      config<Favourite[]>('favourites', []), config<SavedOrder[]>('savedOrders', []), db.config.get(`secondOrderLoop:${customer.id}`),
    ])
    const ranked = rankPersonalizedProducts(products, preferences, favourites, savedOrders, customer)
    const saved = savedOrders.find((row) => row.name === 'My Usual') ?? savedOrders[0]
    return json({ favouriteCategory: preferences.favouriteCategories[0] ?? customer.stats.preferredCategory ?? 'Pizza', usualProductIds: saved?.items.map((item) => item.productId) ?? ranked.slice(0, 2), recommendedProductIds: ranked.slice(0, 6), savedOrderId: saved?.id, savedOrderName: saved?.name, secondOrderLoop: (followup?.value as object | undefined) ?? null, method: 'RULE_BASED' as const })
  }),

  http.get(`${API}/referrals`, async () => { await boot(); return json((await db.referrals.where('referrerCustomerId').equals('CUST001').sortBy('updatedAt')).reverse()) }),
  http.post(`${API}/referrals`, async ({ request }) => {
    await boot(); const body = await request.json() as { friendName?: string; phone?: string }
    if (!body.friendName?.trim() || !body.phone?.replace(/\D/g, '').match(/^\d{10}$/)) return error('Name and a 10-digit phone are required', 422)
    const timestamp = now().toISOString(); const referral: Referral = { id: createId('REF'), referrerCustomerId: 'CUST001', friendName: body.friendName.trim(), maskedPhone: `•••• ${body.phone.replace(/\D/g, '').slice(-4)}`, status: 'INVITED', rewardPoints: 0, createdAt: timestamp, updatedAt: timestamp }
    await db.referrals.add(referral); await appendRetentionMessage('CUST001', `Demo referral invitation prepared for ${referral.friendName}. Rewards unlock only after their first completed order.`, 'WHATSAPP_SIM', 'REORDER')
    eventBus.emit('RETENTION_UPDATED', { kind: 'REFERRAL', referralId: referral.id }, { customerId: 'CUST001' }); return json(referral, 201)
  }),
  http.post(`${API}/referrals/:id/advance-demo`, async ({ params }) => {
    await boot(); const referral = await db.referrals.get(String(params.id)); if (!referral) return error('Referral not found', 404)
    const status = nextReferralStatus(referral.status); if (!status) return json(referral)
    const timestamp = now().toISOString(); const next: Referral = { ...referral, status, updatedAt: timestamp, qualifiedAt: status === 'QUALIFIED' ? timestamp : referral.qualifiedAt, rewardedAt: status === 'REWARDED' ? timestamp : referral.rewardedAt, rewardPoints: status === 'REWARDED' ? 60 : referral.rewardPoints }
    await db.referrals.put(next)
    if (referralRewardEligible(referral.status)) {
      const customer = await db.customers.get(referral.referrerCustomerId)
      if (customer) { await db.customers.update(customer.id, { pointsAvailable: customer.pointsAvailable + 60 }); await db.loyaltyTransactions.add({ id: createId('LOY-REFERRAL'), customerId: customer.id, type: 'BONUS', status: 'AVAILABLE', points: 60, createdAt: timestamp, note: `Referral reward · ${referral.friendName}'s first completed order` }) }
      await appendRetentionMessage(referral.referrerCustomerId, `${referral.friendName} completed their first order. You earned 60 Wave Points!`, 'WHATSAPP_SIM', 'POINTS_EARNED')
    }
    eventBus.emit('RETENTION_UPDATED', { kind: 'REFERRAL', referralId: next.id, status }, { customerId: next.referrerCustomerId }); return json(next)
  }),

  http.get(`${API}/celebrations/automation`, async () => {
    await boot(); const birthday = (await config<Celebration[]>('celebrations', [])).find((item) => item.type === 'BIRTHDAY')
    if (!birthday) return error('No birthday saved', 404)
    const schedule = celebrationSchedule(birthday, now()); const rows = await db.campaignEvents.where('opportunityId').equals(`CELEBRATION-${birthday.id}`).toArray()
    const touchpoints = schedule.map((item) => { const sent = rows.find((row) => row.id === `CAMPAIGN-CELEB-${birthday.id}-${item.stage}`); return { ...item, sent: Boolean(sent), sentAt: sent?.createdAt } })
    return json({ celebrationId: birthday.id, label: birthday.label, date: nextAnnualDate(birthday.day, birthday.month, now()).toISOString(), nextStage: touchpoints.find((item) => !item.sent)?.stage ?? null, touchpoints, demoOnly: true as const })
  }),
  http.post(`${API}/demo/celebrations/:stage`, async ({ params }) => {
    await boot(); const parsed = celebrationStageSchema.safeParse(String(params.stage)); if (!parsed.success) return error('Unknown celebration stage', 400)
    const birthday = (await config<Celebration[]>('celebrations', [])).find((item) => item.type === 'BIRTHDAY'); if (!birthday) return error('No birthday saved', 404)
    const scheduled = celebrationSchedule(birthday, now()).find((item) => item.stage === parsed.data); if (!scheduled) return error('Schedule missing', 500)
    const priorOffset = demoClock.offsetMinutes(); demoClock.freeze(new Date(scheduled.scheduledFor))
    try { await runCelebrationStage(birthday, parsed.data as CelebrationStage, demoClock.now()) } finally { demoClock.setOffsetMinutes(priorOffset) }
    await db.config.put({ key: 'activeCelebrationScenario', value: parsed.data })
    return json({ ok: true, stage: parsed.data })
  }),
]
