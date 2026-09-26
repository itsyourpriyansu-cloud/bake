import type { CustomerSession, KdsSession, OwnerSession } from './auth.types'

/**
 * Each realm gets its own session object and expiry policy. There is deliberately no shared
 * "role switching" session — a customer, owner, and KDS device can be signed in simultaneously
 * in different tabs without any of them leaking into the others.
 */
export const SESSION_POLICIES = {
  customer: { expiresInMs: 30 * 24 * 60 * 60 * 1000 },
  owner: { maxSessionMs: 12 * 60 * 60 * 1000, idleLockMs: 30 * 60 * 1000 },
  kds: { shiftSessionMs: 12 * 60 * 60 * 1000 },
} as const

export function createCustomerSession(customerId: string, now: Date): CustomerSession {
  return { realm: 'CUSTOMER', customerId, issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + SESSION_POLICIES.customer.expiresInMs).toISOString() }
}

export function createOwnerSession(email: string, now: Date): OwnerSession {
  return {
    realm: 'OWNER', email, issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_POLICIES.owner.maxSessionMs).toISOString(),
    idleLockAt: new Date(now.getTime() + SESSION_POLICIES.owner.idleLockMs).toISOString(),
  }
}

export function createKdsSession(device: string, now: Date): KdsSession {
  return { realm: 'KDS', device, issuedAt: now.toISOString(), expiresAt: new Date(now.getTime() + SESSION_POLICIES.kds.shiftSessionMs).toISOString() }
}

export function isSessionExpired(session: { expiresAt: string }, now: Date): boolean {
  return new Date(session.expiresAt).getTime() <= now.getTime()
}

export function isOwnerIdleLocked(session: OwnerSession, now: Date): boolean {
  return new Date(session.idleLockAt).getTime() <= now.getTime()
}

export function extendOwnerIdle(session: OwnerSession, now: Date): OwnerSession {
  return { ...session, idleLockAt: new Date(now.getTime() + SESSION_POLICIES.owner.idleLockMs).toISOString() }
}
