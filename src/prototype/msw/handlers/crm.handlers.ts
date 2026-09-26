import { http } from 'msw'
import { db } from '../../database/db'
import { API, boot, error, json } from './_shared'

export const crmHandlers = [
  http.get(`${API}/crm/customers`, async () => { await boot(); return json(await db.customers.toArray()) }),

  http.get(`${API}/crm/customers/:id`, async ({ params }) => {
    await boot()
    const customer = await db.customers.get(String(params.id))
    if (!customer) return error('Customer not found', 404)
    const orders = await db.orders.where('customerId').equals(customer.id).sortBy('createdAt')
    return json({ customer, recentOrders: orders.reverse().slice(0, 10) })
  }),
]
