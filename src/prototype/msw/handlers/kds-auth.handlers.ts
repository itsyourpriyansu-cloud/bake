import { http } from 'msw'
import { DEMO_CREDENTIALS } from '../../../domain/auth/auth.types'
import { createKdsSession } from '../../../domain/auth/session.policy'
import { createId } from '../../../domain/shared/ids'
import { setKdsHeartbeat } from '../../services/kds-heartbeat'
import { db } from '../../database/db'
import { API, boot, error, json, now } from './_shared'

/** Authentication surface used by the scoped KDS worker; no customer or owner auth routes are exposed. */
export const kdsAuthSurfaceHandlers = [
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
