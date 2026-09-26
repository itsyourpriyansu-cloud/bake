import type { CustomerSession } from '../../domain/auth/auth.types'
import { isSessionExpired } from '../../domain/auth/session.policy'
import { demoClock } from '../../domain/shared/clock'
import { db } from '../database/db'

/**
 * Resolves the authenticated customer from the mock backend session table.
 * The cart's seeded customerId is deliberately not an authentication signal.
 */
export async function getActiveCustomerSession(at = demoClock.now()): Promise<CustomerSession | undefined> {
  const rows = await db.sessions.where('realm').equals('CUSTOMER').toArray()
  const session = rows.at(-1)?.payload
  if (!session || session.realm !== 'CUSTOMER' || isSessionExpired(session, at)) return undefined
  return session
}
