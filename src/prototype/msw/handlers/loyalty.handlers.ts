import { http } from 'msw'
import { db } from '../../database/db'
import { calculateTierProgress } from '../../../domain/loyalty/loyalty.engine'
import { toDemoCustomerView } from '../../../domain/customer/customer.view'
import { API, boot, error, json, now } from './_shared'
import { getActiveCustomerSession } from '../../services/customer-session'

export const loyaltyHandlers = [
  http.get(`${API}/loyalty`, async () => {
    await boot()
    const session = await getActiveCustomerSession(now())
    if (!session) return error('Customer authentication required', 401)
    const customerId = session.customerId
    const customer = await db.customers.get(customerId)
    if (!customer) return error('Customer not found', 404)
    const progress = calculateTierProgress({ rolling120Orders: customer.stats.rolling120Orders, rolling120EligibleSpend: customer.stats.rolling120EligibleSpend })
    return json({
      customer: toDemoCustomerView(customer), nextTier: progress.next?.id, ordersNeeded: progress.ordersNeeded, spendNeeded: progress.spendNeeded,
      progress: {
        currentOrders: customer.stats.rolling120Orders, targetOrders: progress.next?.ordersRequired ?? customer.stats.rolling120Orders,
        currentSpend: customer.stats.rolling120EligibleSpend, targetSpend: progress.next?.spendRequired ?? customer.stats.rolling120EligibleSpend,
        earnRatePercent: progress.tier.earnRate * 100,
        ordersPercent: progress.next ? Math.min(100, customer.stats.rolling120Orders / progress.next.ordersRequired * 100) : 100,
        spendPercent: progress.next ? Math.min(100, customer.stats.rolling120EligibleSpend / progress.next.spendRequired * 100) : 100,
        message: progress.next ? `${progress.ordersNeeded} orders + ₹${progress.spendNeeded} to ${progress.next.name.replace(' Wave', '')}` : 'You are at the highest Wave tier',
      },
    })
  }),

  http.get(`${API}/loyalty/history`, async () => {
    await boot(); const session = await getActiveCustomerSession(now())
    if (!session) return error('Customer authentication required', 401)
    const customerId = session.customerId
    const transactions = await db.loyaltyTransactions.where('customerId').equals(customerId).sortBy('createdAt')
    return json(transactions.reverse())
  }),

  http.get(`${API}/loyalty/wallet/:customerId`, async ({ params }) => {
    await boot()
    const customerId = String(params.customerId)
    const transactions = await db.loyaltyTransactions.where('customerId').equals(customerId).sortBy('createdAt')
    return json(transactions.reverse())
  }),

  http.get(`${API}/wave-id/:waveId`, async ({ params }) => {
    await boot()
    const waveId = String(params.waveId)
    const tokenRecord = await db.config.get(`waveIdToken:${waveId}`)
    const token = tokenRecord?.value as { customerId: string; expiresAt: string } | undefined
    if (token && new Date(token.expiresAt) <= now()) return error('Wave ID expired', 410)
    const customer = token
      ? await db.customers.get(token.customerId)
      : await db.customers.filter((row) => row.waveId === waveId || row.id === waveId.replace('WAVE-', '')).first()
    return customer ? json(toDemoCustomerView(customer)) : error('Wave ID not found', 404)
  }),
]
