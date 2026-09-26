import { http } from 'msw'
import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import { DEMO_CREDENTIALS } from '../../../domain/auth/auth.types'
import { createCustomerSession, createKdsSession, createOwnerSession } from '../../../domain/auth/session.policy'
import { demoCustomerAuthProvider } from '../../../services/auth/DemoCustomerAuthProvider'
import { setKdsHeartbeat } from '../../services/kds-heartbeat'
import { API, boot, error, json, now } from './_shared'

export const authHandlers = [
  http.post(`${API}/auth/customer/request-otp`, async ({ request }) => {
    await boot()
    const { phone } = await request.json() as { phone: string }
    const result = await demoCustomerAuthProvider.requestOtp(phone)
    return json(result)
  }),

  http.post(`${API}/auth/customer/verify-otp`, async ({ request }) => {
    await boot()
    const { phone, otp } = await request.json() as { phone: string; otp: string }
    const result = await demoCustomerAuthProvider.verifyOtp(phone, otp)
    if (!result.verified || !result.customerId) return error('Invalid OTP', 401)
    const session = createCustomerSession(result.customerId, now())
    await db.sessions.where('realm').equals('CUSTOMER').delete()
    await db.sessions.put({ id: createId('SESSION'), realm: 'CUSTOMER', payload: session })
    await db.config.put({ key: 'customerLoggedIn', value: true })
    return json(session)
  }),

  http.post(`${API}/auth/customer/logout`, async () => {
    await boot()
    await db.sessions.where('realm').equals('CUSTOMER').delete()
    await db.config.put({ key: 'customerLoggedIn', value: false })
    return json({ ok: true })
  }),

  http.post(`${API}/auth/owner/login`, async ({ request }) => {
    await boot()
    const { email, password, code } = await request.json() as { email: string; password: string; code: string }
    if (email !== DEMO_CREDENTIALS.owner.email || password !== DEMO_CREDENTIALS.owner.password || code !== DEMO_CREDENTIALS.owner.twoFactorCode) return error('Invalid owner credentials', 401)
    const session = createOwnerSession(email, now())
    await db.sessions.put({ id: createId('SESSION'), realm: 'OWNER', payload: session })
    return json(session)
  }),

  http.post(`${API}/auth/kds/login`, async ({ request }) => {
    await boot()
    const { pin } = await request.json() as { pin: string }
    if (pin !== DEMO_CREDENTIALS.kds.pin) return error('Invalid chef PIN', 401)
    const session = createKdsSession('Kitchen Tablet #1', now())
    await db.sessions.where('realm').equals('KDS').delete()
    await db.sessions.put({ id: createId('SESSION'), realm: 'KDS', payload: session })
    await setKdsHeartbeat(true, now())
    return json(session)
  }),
]
