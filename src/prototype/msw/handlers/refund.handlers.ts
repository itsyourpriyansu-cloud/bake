import { http } from 'msw'
import { db } from '../../database/db'
import { API, boot, error, json, now } from './_shared'
import { processRefundAutomation } from '../../services/refund-automation'

export const refundHandlers = [
  http.get(`${API}/refunds`, async ({ request }) => {
    await boot()
    const orderId = new URL(request.url).searchParams.get('orderId')
    const rows = await db.refunds.toArray()
    return json(orderId ? rows.filter((row) => row.orderId === orderId) : rows)
  }),

  /**
   * Simulated end-to-end refund: REQUESTED -> APPROVED -> SUBMITTED -> PROCESSING -> SUCCESS/FAILED.
   * A completed refund reverses the linked order's points and closes any matching attention item.
   */
  http.post(`${API}/refunds/:id/process`, async ({ params }) => {
    await boot()
    let refund = await db.refunds.get(String(params.id))
    if (!refund) return error('Refund not found', 404)

    refund = await processRefundAutomation(refund, now())
    return json(refund, refund.status === 'FAILED' ? 402 : 200)
  }),
]
