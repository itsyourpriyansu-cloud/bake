import { http } from 'msw'
import { db } from '../../database/db'
import { createSupportCase, resolveSupportCase } from '../../../domain/support/support.logic'
import { createAttentionItem } from '../../../domain/attention/attention.engine'
import type { SupportCategory } from '../../../domain/support/support.types'
import { API, boot, error, json, now } from './_shared'

export const supportHandlers = [
  http.get(`${API}/support/cases`, async ({ request }) => {
    await boot()
    const customerId = new URL(request.url).searchParams.get('customerId')
    const rows = await db.supportCases.toArray()
    return json(customerId ? rows.filter((row) => row.customerId === customerId) : rows)
  }),

  http.post(`${API}/support/cases`, async ({ request }) => {
    await boot()
    const body = await request.json() as { customerId: string; category: SupportCategory; description: string; orderId?: string; conversationId?: string }
    const supportCase = createSupportCase(body.customerId, body.category, body.description, now(), { orderId: body.orderId, conversationId: body.conversationId })
    await db.supportCases.add(supportCase)
    if (supportCase.status === 'FOUNDER_REVIEW') {
      await db.attentionItems.add(createAttentionItem('COMPLAINT', `${body.category.replace(/_/g, ' ')} — ${body.customerId}`, body.description, 'Review the case and decide on a refund or resolution.', now(), { orderId: body.orderId, customerId: body.customerId }))
    }
    return json(supportCase, 201)
  }),

  http.post(`${API}/support/cases/:id/resolve`, async ({ params }) => {
    await boot()
    const supportCase = await db.supportCases.get(String(params.id))
    if (!supportCase) return error('Support case not found', 404)
    const resolved = resolveSupportCase(supportCase, now())
    await db.supportCases.put(resolved)
    return json(resolved)
  }),
]
