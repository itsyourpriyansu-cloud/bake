import { http } from 'msw'
import type { z } from 'zod'
import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import {
  celebrationSchema, customerNotificationSchema, familyMemberSchema, favouriteSchema, foodPreferencesSchema,
  notificationPreferencesSchema, savedOrderSchema,
} from '../../../domain/customer/customer-experience.schema'
import type { Celebration, FamilyMember, Favourite, FoodPreferences, NotificationPreferences, SavedOrder } from '../../../domain/customer/customer-experience.types'
import { API, boot, error, json, now } from './_shared'

async function configValue<T>(key: string, fallback: T): Promise<T> {
  return ((await db.config.get(key))?.value as T | undefined) ?? fallback
}

const maskedPhone = (phone: string) => `${phone.slice(0, 3)} •••••• ${phone.slice(-4)}`

export const customerHandlers = [
  http.get(`${API}/customer/profile`, async () => {
    await boot()
    const customer = await db.customers.get('CUST001')
    if (!customer) return error('Customer not found', 404)
    const [foodPreferences, notificationPreferences] = await Promise.all([
      configValue<FoodPreferences>('foodPreferences', { diet: 'BOTH', spiceLevel: 'MEDIUM', cheese: 'REGULAR', avoid: [], favouriteCategories: [] }),
      configValue<NotificationPreferences>('notificationPreferences', { orderUpdates: true, offers: true, rewards: true, celebrations: true }),
    ])
    return json({ id: customer.id, firstName: customer.firstName, maskedPhone: maskedPhone(customer.phone), tier: customer.tier, pointsAvailable: customer.pointsAvailable, pointsPending: customer.pointsPending, defaultAddress: customer.addresses.find((item) => item.isDefault)?.line1, foodPreferences, notificationPreferences })
  }),

  http.get(`${API}/customer/preferences`, async () => { await boot(); return json(await configValue<FoodPreferences>('foodPreferences', { diet: 'BOTH', spiceLevel: 'MEDIUM', cheese: 'REGULAR', avoid: [], favouriteCategories: [] })) }),
  http.patch(`${API}/customer/preferences`, async ({ request }) => {
    await boot(); const current = await configValue<FoodPreferences>('foodPreferences', { diet: 'BOTH', spiceLevel: 'MEDIUM', cheese: 'REGULAR', avoid: [], favouriteCategories: [] })
    const body = await request.json() as Partial<FoodPreferences>
    const parsed = foodPreferencesSchema.safeParse({ ...current, ...body })
    if (!parsed.success) return error('Invalid food preferences', 400)
    await db.config.put({ key: 'foodPreferences', value: parsed.data }); return json(parsed.data)
  }),

  http.get(`${API}/customer/notification-preferences`, async () => { await boot(); return json(await configValue<NotificationPreferences>('notificationPreferences', { orderUpdates: true, offers: true, rewards: true, celebrations: true })) }),
  http.patch(`${API}/customer/notification-preferences`, async ({ request }) => {
    await boot(); const current = await configValue<NotificationPreferences>('notificationPreferences', { orderUpdates: true, offers: true, rewards: true, celebrations: true })
    const body = await request.json() as Partial<NotificationPreferences>
    const parsed = notificationPreferencesSchema.safeParse({ ...current, ...body })
    if (!parsed.success) return error('Invalid notification preferences', 400)
    await db.config.put({ key: 'notificationPreferences', value: parsed.data }); return json(parsed.data)
  }),

  http.get(`${API}/saved-orders`, async () => { await boot(); return json(savedOrderSchema.array().parse(await configValue<SavedOrder[]>('savedOrders', []))) }),
  http.patch(`${API}/saved-orders/:id`, async ({ params, request }) => {
    await boot(); const rows = await configValue<SavedOrder[]>('savedOrders', []); const index = rows.findIndex((row) => row.id === String(params.id))
    if (index < 0) return error('Saved order not found', 404)
    const body = await request.json() as { name?: string }; rows[index] = { ...rows[index], name: body.name?.trim() || rows[index].name, updatedAt: now().toISOString() }
    await db.config.put({ key: 'savedOrders', value: rows }); return json(rows[index])
  }),
  http.post(`${API}/saved-orders/from-order/:orderId`, async ({ params, request }) => {
    await boot(); const order = await db.orders.get(String(params.orderId)); if (!order) return error('Order not found', 404)
    const body = await request.json().catch(() => ({})) as { name?: string }; const rows = await configValue<SavedOrder[]>('savedOrders', [])
    const timestamp = now().toISOString(); const saved: SavedOrder = { id: `SAVED-${order.id}`, customerId: order.customerId, name: body.name?.trim() || `${order.publicOrderNumber} favourite`, items: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity, modifiers: item.modifiers ?? [] })), createdAt: timestamp, updatedAt: timestamp }
    await db.config.put({ key: 'savedOrders', value: [...rows.filter((row) => row.id !== saved.id), saved] }); return json(saved, 201)
  }),
  http.delete(`${API}/saved-orders/:id`, async ({ params }) => {
    await boot(); const rows = await configValue<SavedOrder[]>('savedOrders', []); await db.config.put({ key: 'savedOrders', value: rows.filter((row) => row.id !== String(params.id)) }); return json({ ok: true })
  }),

  http.get(`${API}/favourites`, async () => { await boot(); return json(favouriteSchema.array().parse(await configValue<Favourite[]>('favourites', []))) }),
  http.delete(`${API}/favourites/:id`, async ({ params }) => {
    await boot(); const rows = await configValue<Favourite[]>('favourites', []); await db.config.put({ key: 'favourites', value: rows.filter((row) => row.id !== String(params.id)) }); return json({ ok: true })
  }),

  http.get(`${API}/family`, async () => { await boot(); return json(familyMemberSchema.array().parse(await configValue<FamilyMember[]>('family', []))) }),
  http.put(`${API}/family/:id`, async ({ params, request }) => {
    await boot(); const rows = await configValue<FamilyMember[]>('family', []); const body = await request.json() as Partial<FamilyMember>; const parsed = familyMemberSchema.safeParse({ ...rows.find((row) => row.id === String(params.id)), ...body, id: String(params.id), customerId: 'CUST001' })
    if (!parsed.success) return error('Invalid family preference', 400)
    const next = [...rows.filter((row) => row.id !== parsed.data.id), parsed.data]; await db.config.put({ key: 'family', value: next }); return json(parsed.data)
  }),

  http.get(`${API}/celebrations`, async () => { await boot(); return json(celebrationSchema.array().parse(await configValue<Celebration[]>('celebrations', []))) }),
  http.post(`${API}/celebrations`, async ({ request }) => {
    await boot(); const body = await request.json() as Partial<Celebration>; const parsed = celebrationSchema.safeParse({ ...body, id: createId('CELEB'), customerId: 'CUST001' })
    if (!parsed.success) return error('Invalid celebration', 400)
    const rows = await configValue<Celebration[]>('celebrations', []); rows.push(parsed.data); await db.config.put({ key: 'celebrations', value: rows }); return json(parsed.data, 201)
  }),
  http.delete(`${API}/celebrations/:id`, async ({ params }) => {
    await boot(); const rows = await configValue<Celebration[]>('celebrations', []); await db.config.put({ key: 'celebrations', value: rows.filter((row) => row.id !== String(params.id)) }); return json({ ok: true })
  }),

  http.get(`${API}/notifications`, async () => { await boot(); return json(customerNotificationSchema.array().parse(await configValue('customerNotifications', []))) }),
  http.post(`${API}/notifications/:id/read`, async ({ params }) => {
    await boot(); const rows = await configValue<Array<z.infer<typeof customerNotificationSchema>>>('customerNotifications', []); const next = rows.map((row) => row.id === String(params.id) ? { ...row, read: true } : row); await db.config.put({ key: 'customerNotifications', value: next }); return json(next)
  }),

  http.post(`${API}/customer/wave-id`, async () => {
    await boot(); const customer = await db.customers.get('CUST001'); if (!customer) return error('Customer not found', 404)
    const issued = now(); const expires = new Date(issued.getTime() + 60_000)
    const token = `WAVE-DEMO-${Math.floor(issued.getTime() / 60_000).toString(36).toUpperCase()}`
    await db.config.put({ key: `waveIdToken:${token}`, value: { customerId: customer.id, expiresAt: expires.toISOString() } })
    return json({ token, issuedAt: issued.toISOString(), expiresAt: expires.toISOString(), firstName: customer.firstName, tier: customer.tier, pointsAvailable: customer.pointsAvailable })
  }),
]
